#!/usr/bin/env node
'use strict';

const net = require('node:net');
const { ThinkGearLineParser } = require('./lib/thinkgear-parser');

const HOST = process.env.TGC_HOST || '127.0.0.1';
const PORT = Number(process.env.TGC_PORT || 13854);

const parser = new ThinkGearLineParser();
const socket = net.createConnection({ host: HOST, port: PORT }, () => {
  console.log(`Connected to ThinkGear Connector at ${HOST}:${PORT}`);
  // Ask TGC for JSON packets; raw EEG samples stay off (very high volume).
  socket.write(JSON.stringify({ enableRawOutput: false, format: 'Json' }) + '\n');
});

socket.setEncoding('utf8');

socket.on('data', (chunk) => {
  for (const packet of parser.push(chunk)) {
    handlePacket(packet);
  }
});

socket.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.error(
      `Could not reach ThinkGear Connector at ${HOST}:${PORT}. ` +
        'Make sure ThinkGear Connector is running and the headset shows as connected in it.'
    );
  } else {
    console.error('Socket error:', err.message);
  }
  process.exitCode = 1;
});

socket.on('close', () => {
  console.log('Connection to ThinkGear Connector closed.');
});

function handlePacket(packet) {
  if (typeof packet.poorSignalLevel === 'number') {
    logSignal(packet.poorSignalLevel);
  }
  if (packet.eSense) {
    console.log(`Attention: ${packet.eSense.attention}  Meditation: ${packet.eSense.meditation}`);
  }
  if (typeof packet.blinkStrength === 'number') {
    console.log(`Blink: ${packet.blinkStrength}`);
  }
}

function logSignal(level) {
  if (level === 0) return; // 0 = good contact, no need to spam the console
  if (level === 200) {
    console.log('Signal: no contact - check headset fit / battery.');
  } else {
    console.log(`Signal: poor (${level}) - adjust headset.`);
  }
}

process.on('SIGINT', () => {
  socket.end();
  process.exit(0);
});
