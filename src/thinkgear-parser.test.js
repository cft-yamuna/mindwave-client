'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ThinkGearLineParser } = require('./thinkgear-parser');

test('parses a single complete line', () => {
  const parser = new ThinkGearLineParser();
  const packets = parser.push('{"poorSignalLevel":0}\n');
  assert.deepEqual(packets, [{ poorSignalLevel: 0 }]);
});

test('parses multiple lines delivered in one chunk', () => {
  const parser = new ThinkGearLineParser();
  const packets = parser.push('{"a":1}\n{"b":2}\n');
  assert.deepEqual(packets, [{ a: 1 }, { b: 2 }]);
});

test('buffers a line split across two chunks', () => {
  const parser = new ThinkGearLineParser();
  assert.deepEqual(parser.push('{"eSense":{"atte'), []);
  assert.deepEqual(parser.push('ntion":40}}\n'), [{ eSense: { attention: 40 } }]);
});

test('skips blank lines', () => {
  const parser = new ThinkGearLineParser();
  const packets = parser.push('\n{"a":1}\n\n');
  assert.deepEqual(packets, [{ a: 1 }]);
});

test('skips malformed JSON without throwing', () => {
  const parser = new ThinkGearLineParser();
  const packets = parser.push('not json\n{"a":1}\n');
  assert.deepEqual(packets, [{ a: 1 }]);
});

test('splits on ThinkGear Connector\'s actual \\r delimiter', () => {
  const parser = new ThinkGearLineParser();
  const packets = parser.push('{"poorSignalLevel":200,"status":"scanning"}\r{"a":1}\r');
  assert.deepEqual(packets, [{ poorSignalLevel: 200, status: 'scanning' }, { a: 1 }]);
});

test('buffers a line split across chunks when delimited by \\r', () => {
  const parser = new ThinkGearLineParser();
  assert.deepEqual(parser.push('{"eSense":{"atte'), []);
  assert.deepEqual(parser.push('ntion":40}}\r'), [{ eSense: { attention: 40 } }]);
});
