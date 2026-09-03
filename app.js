#!/usr/bin/env node
'use strict';

// ============================================================
//  MindWave Football — PLAYER 2 (client)
//  Run this file:   node app.js
//  Set the master's IP in:   config.json
// ============================================================

const fs = require('node:fs');
const path = require('node:path');
const WebSocket = require('ws');
const { ThinkGearClient } = require('./src/thinkgear-client');
const { createForwarder } = require('./src/forwarder');

const CONFIG_PATH = path.join(__dirname, 'config.json');

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    console.error(`Could not read config.json — it has a typo in it:\n  ${err.message}`);
    process.exit(1);
  }
}

const config = readConfig();

// Command line wins, then config.json, then environment variable.
//   node app.js 192.168.0.175
const masterHost = process.argv[2] || config.masterHost || process.env.MASTER_HOST;
const masterPort = Number(config.masterPort || process.env.MASTER_PORT || 4000);
const tgcHost = config.thinkGearHost || process.env.TGC_HOST || '127.0.0.1';
const tgcPort = Number(config.thinkGearPort || process.env.TGC_PORT || 13854);

if (!masterHost || masterHost === 'PUT-MASTER-IP-HERE') {
  console.error(`
  The master laptop's IP address is not set yet.

  Open  config.json  in this folder and replace PUT-MASTER-IP-HERE with the
  master laptop's IP, for example:

      { "masterHost": "192.168.0.175" }

  On the master laptop, find its IP by running:  ipconfig
  (look for "IPv4 Address" under your Wi-Fi adapter)

  Or pass it directly:   node app.js 192.168.0.175
`);
  process.exit(1);
}

console.log('MindWave Football — Player 2');
console.log(`  sensor:  ThinkGear Connector at ${tgcHost}:${tgcPort}`);
console.log(`  master:  ${masterHost}:${masterPort}`);
console.log('');

const sensorClient = new ThinkGearClient({ host: tgcHost, port: tgcPort });

sensorClient.on('connect', () => {
  console.log('Connected to ThinkGear Connector.');
});

sensorClient.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.error(
      'Could not reach ThinkGear Connector on this laptop.\n' +
        'Start ThinkGear Connector and make sure your headset shows as connected in it.'
    );
  } else {
    console.error('Sensor error:', err.message);
  }
});

sensorClient.connect();

createForwarder({
  sensorClient,
  masterUrl: `ws://${masterHost}:${masterPort}/ws/sensor`,
  WebSocketImpl: WebSocket,
});

console.log('Press Ctrl+C to stop.\n');
