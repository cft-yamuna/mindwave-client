# MindWave Football — CLIENT laptop

Copy **this entire `client/` folder** to Player 2's laptop. It reads that
laptop's own sensor and streams it to the master over the LAN.

This folder is self-contained — it does **not** need the `master/` folder.

## Setup (once)

1. Pair the MindWave headset over Bluetooth (Windows Settings -> Bluetooth
   & devices) and start **ThinkGear Connector**. Confirm the headset shows
   as connected in its UI.
2. Check the sensor works on its own:
   ```
   npm run check-sensor
   ```
   You should see live `Attention` / `Meditation` lines. Ctrl+C to stop.
3. Install dependencies:
   ```
   npm install
   ```

## Join a match

Start the master laptop first, get its LAN IP (`ipconfig` on that machine),
then here — in PowerShell:

```
$env:MASTER_HOST="<master-lan-ip>"; npm start
```

In bash:

```
MASTER_HOST=<master-lan-ip> npm start
```

You should see `Connected to master at ws://<master-lan-ip>:4000/ws/sensor`.
Player 2's meter will start moving on the master's dashboard.

If the WiFi drops, this reconnects on its own — no need to restart it.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `MASTER_HOST` | *(required)* | LAN IP of the master laptop |
| `MASTER_PORT` | `4000` | Port the master is listening on |
| `TGC_HOST` / `TGC_PORT` | `127.0.0.1` / `13854` | ThinkGear Connector socket |

## Layout

| Path | Role |
|---|---|
| `index.js` | Entrypoint: local sensor -> master |
| `forwarder.js` | Forwarding + reconnect logic |
| `lib/` | ThinkGear Connector client + stream parser |
| `mindwave-reader.js` | Standalone single-sensor console check |

> `lib/` is duplicated from the `master/` folder so this folder deploys on
> its own. If you change a file in `lib/`, copy the change to the other
> folder.

## Tests

```
npm test
```
