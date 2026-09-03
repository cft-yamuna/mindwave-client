#!/usr/bin/env node
'use strict';

const WebSocket = require('ws');
const { ThinkGearClient } = require('./lib/thinkgear-client');
const { createForwarder } = require('./forwarder');

const TGC_HOST = process.env.TGC_HOST || '127.0.0.1';
const TGC_PORT = Number(process.env.TGC_PORT || 13854);
const MASTER_HOST = process.env.MASTER_HOST;
const MASTER_PORT = Number(process.env.MASTER_PORT || 4000);

if (!MASTER_HOST) {
  console.error("Set MASTER_HOST to the master laptop's LAN IP address before starting.");
  process.exit(1);
}

const sensorClient = new ThinkGearClient({ host: TGC_HOST, port: TGC_PORT });
sensorClient.on('error', (err) => {
  console.error('Local sensor error:', err.message);
});
sensorClient.connect();

createForwarder({
  sensorClient,
  masterUrl: `ws://${MASTER_HOST}:${MASTER_PORT}/ws/sensor`,
  WebSocketImpl: WebSocket,
});
