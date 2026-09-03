'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { ThinkGearClient } = require('./thinkgear-client');

function startFakeTgc() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function nextConnection(server) {
  return new Promise((resolve) => server.once('connection', resolve));
}

// `server.close()` only stops new connections — a live socket keeps the
// handle open and the test process alive. Destroy both ends, then await
// the server actually closing.
function shutdown(server, serverSocket, client) {
  client.on('error', () => {});
  if (serverSocket) {
    serverSocket.on('error', () => {});
    serverSocket.destroy();
  }
  client.close();
  return new Promise((resolve) => server.close(resolve));
}

test('sends the config command on connect', async () => {
  const server = await startFakeTgc();
  const { port } = server.address();
  const client = new ThinkGearClient({ host: '127.0.0.1', port });

  const connPromise = nextConnection(server);
  client.connect();
  const serverSocket = await connPromise;
  const received = await new Promise((resolve) =>
    serverSocket.once('data', (chunk) => resolve(chunk.toString()))
  );

  assert.equal(received, '{"enableRawOutput":false,"format":"Json"}\n');

  await shutdown(server, serverSocket, client);
});

test('parses and emits packets sent by the server', async () => {
  const server = await startFakeTgc();
  const { port } = server.address();
  const client = new ThinkGearClient({ host: '127.0.0.1', port });

  const connPromise = nextConnection(server);
  client.connect();
  const serverSocket = await connPromise;

  const gotPacket = new Promise((resolve) => client.once('data', resolve));
  serverSocket.write('{"poorSignalLevel":0,"eSense":{"attention":10,"meditation":20}}\r');

  assert.deepEqual(await gotPacket, {
    poorSignalLevel: 0,
    eSense: { attention: 10, meditation: 20 },
  });

  await shutdown(server, serverSocket, client);
});

test('emits multiple packets from one chunk in order', async () => {
  const server = await startFakeTgc();
  const { port } = server.address();
  const client = new ThinkGearClient({ host: '127.0.0.1', port });

  const connPromise = nextConnection(server);
  client.connect();
  const serverSocket = await connPromise;

  const packets = [];
  const gotBoth = new Promise((resolve) => {
    client.on('data', (packet) => {
      packets.push(packet);
      if (packets.length === 2) resolve();
    });
  });

  serverSocket.write('{"poorSignalLevel":200,"status":"scanning"}\r{"eSense":{"attention":7,"meditation":9}}\r');
  await gotBoth;

  assert.deepEqual(packets, [
    { poorSignalLevel: 200, status: 'scanning' },
    { eSense: { attention: 7, meditation: 9 } },
  ]);

  await shutdown(server, serverSocket, client);
});

test('emits close when the connection ends', async () => {
  const server = await startFakeTgc();
  const { port } = server.address();
  const client = new ThinkGearClient({ host: '127.0.0.1', port });

  const connPromise = nextConnection(server);
  client.connect();
  const serverSocket = await connPromise;

  const closed = new Promise((resolve) => client.once('close', resolve));
  serverSocket.end();
  await closed;

  await shutdown(server, serverSocket, client);
});

test('emits error when nothing is listening', async () => {
  // Bind then immediately close, so the port is almost certainly free.
  const server = await startFakeTgc();
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));

  const client = new ThinkGearClient({ host: '127.0.0.1', port });
  const error = await new Promise((resolve) => {
    client.once('error', resolve);
    client.connect();
  });

  assert.equal(error.code, 'ECONNREFUSED');
  client.close();
});
