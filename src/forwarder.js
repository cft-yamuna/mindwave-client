'use strict';

function createForwarder({ sensorClient, masterUrl, WebSocketImpl, retryDelayMs = 2000, log = console.log }) {
  let socket = null;
  let closedByUser = false;

  function connect() {
    socket = new WebSocketImpl(masterUrl);

    socket.on('open', () => log(`Connected to master at ${masterUrl}`));

    socket.on('close', () => {
      if (closedByUser) return;
      log(`Disconnected from master, retrying in ${retryDelayMs}ms`);
      setTimeout(connect, retryDelayMs);
    });

    socket.on('error', (err) => {
      log(`Master connection error: ${err.message}`);
    });
  }

  sensorClient.on('data', (packet) => {
    if (socket && socket.readyState === WebSocketImpl.OPEN) {
      socket.send(JSON.stringify(packet));
    }
  });

  connect();

  return {
    close() {
      closedByUser = true;
      if (socket) socket.close();
    },
  };
}

module.exports = { createForwarder };
