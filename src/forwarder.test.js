'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createForwarder } = require('./forwarder');
const { FakeWebSocket } = require('./fake-websocket');

test.beforeEach(() => {
  FakeWebSocket.instances.length = 0;
});

function startForwarder(overrides = {}) {
  const sensorClient = new EventEmitter();
  const forwarder = createForwarder({
    sensorClient,
    masterUrl: 'ws://fake/ws/sensor',
    WebSocketImpl: FakeWebSocket,
    log: () => {},
    ...overrides,
  });
  return { sensorClient, forwarder };
}

test('forwards sensor packets once connected', () => {
  const { sensorClient } = startForwarder();

  const socket = FakeWebSocket.instances[0];
  socket._open();

  sensorClient.emit('data', { attention: 10, meditation: 20 });

  assert.deepEqual(socket.sent, [JSON.stringify({ attention: 10, meditation: 20 })]);
});

test('drops packets sent before the connection is open', () => {
  const { sensorClient } = startForwarder();

  sensorClient.emit('data', { attention: 10, meditation: 20 });

  assert.deepEqual(FakeWebSocket.instances[0].sent, []);
});

test('reconnects after the master connection drops', async () => {
  startForwarder({ retryDelayMs: 10 });

  const first = FakeWebSocket.instances[0];
  first._open();
  first._dropConnection();

  await new Promise((resolve) => setTimeout(resolve, 30));

  assert.equal(FakeWebSocket.instances.length, 2, 'expected a second connection attempt');
});

test('resumes forwarding over the reconnected socket', async () => {
  const { sensorClient } = startForwarder({ retryDelayMs: 10 });

  const first = FakeWebSocket.instances[0];
  first._open();
  first._dropConnection();

  await new Promise((resolve) => setTimeout(resolve, 30));

  const second = FakeWebSocket.instances[1];
  second._open();
  sensorClient.emit('data', { meditation: 42 });

  assert.deepEqual(second.sent, [JSON.stringify({ meditation: 42 })]);
  assert.deepEqual(first.sent, [], 'the dead socket should not receive anything');
});

test('does not reconnect once closed by the caller', async () => {
  const { forwarder } = startForwarder({ retryDelayMs: 10 });

  FakeWebSocket.instances[0]._open();
  forwarder.close();

  await new Promise((resolve) => setTimeout(resolve, 30));

  assert.equal(FakeWebSocket.instances.length, 1, 'expected no reconnect attempt after explicit close');
});
