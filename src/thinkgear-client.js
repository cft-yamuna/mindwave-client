'use strict';

const net = require('node:net');
const { EventEmitter } = require('node:events');
const { ThinkGearLineParser } = require('./thinkgear-parser');

// Connects to a ThinkGear Connector TCP/JSON socket and emits parsed
// packets. Shared by the master backend (reads its own local sensor) and
// the client forwarder (reads the second laptop's local sensor).
class ThinkGearClient extends EventEmitter {
  constructor({ host = '127.0.0.1', port = 13854 } = {}) {
    super();
    this.host = host;
    this.port = port;
    this._parser = new ThinkGearLineParser();
    this._socket = null;
  }

  connect() {
    this._socket = net.createConnection({ host: this.host, port: this.port }, () => {
      this._socket.write(JSON.stringify({ enableRawOutput: false, format: 'Json' }) + '\n');
      this.emit('connect');
    });
    this._socket.setEncoding('utf8');
    this._socket.on('data', (chunk) => {
      for (const packet of this._parser.push(chunk)) {
        this.emit('data', packet);
      }
    });
    this._socket.on('error', (err) => this.emit('error', err));
    this._socket.on('close', () => this.emit('close'));
    return this;
  }

  close() {
    if (this._socket) this._socket.end();
  }
}

module.exports = { ThinkGearClient };
