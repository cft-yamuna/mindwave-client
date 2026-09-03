'use strict';

const { EventEmitter } = require('node:events');

// Stand-in for the `ws` client used by forwarder tests, so reconnect
// behavior can be driven deterministically without real sockets or timers.
class FakeWebSocket extends EventEmitter {
  constructor(url) {
    super();
    this.url = url;
    this.readyState = FakeWebSocket.CONNECTING;
    this.sent = [];
    FakeWebSocket.instances.push(this);
  }

  send(data) {
    this.sent.push(data);
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.emit('close');
  }

  // Test helper: simulate the connection succeeding.
  _open() {
    this.readyState = FakeWebSocket.OPEN;
    this.emit('open');
  }

  // Test helper: simulate the server dropping the connection.
  _dropConnection() {
    this.readyState = FakeWebSocket.CLOSED;
    this.emit('close');
  }
}
FakeWebSocket.CONNECTING = 0;
FakeWebSocket.OPEN = 1;
FakeWebSocket.CLOSED = 3;
FakeWebSocket.instances = [];

module.exports = { FakeWebSocket };
