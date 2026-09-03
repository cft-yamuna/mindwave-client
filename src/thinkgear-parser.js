'use strict';

// ThinkGear Connector streams one JSON object per line, delimited by \r
// (not \n). TCP chunks also don't respect those line boundaries — a packet
// can arrive split across two `data` events. This buffers text across calls
// to `push()` until a full line shows up.
class ThinkGearLineParser {
  constructor() {
    this._buffer = '';
  }

  push(chunk) {
    this._buffer += chunk;
    const lines = this._buffer.split(/\r\n|\r|\n/);
    this._buffer = lines.pop();

    const packets = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        packets.push(JSON.parse(trimmed));
      } catch {
        // TGC occasionally emits a stray non-JSON line; skip it.
      }
    }
    return packets;
  }
}

module.exports = { ThinkGearLineParser };
