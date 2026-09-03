# MindWave Football — PLAYER 2 laptop

Copy this whole `client/` folder to Player 2's laptop. It reads that
laptop's headset and sends the data to the master laptop over WiFi.

This folder is self-contained — it does **not** need the `master/` folder.

---

## The short version

1. Put the master laptop's IP in **`config.json`**
2. Run **`node app.js`** — or just double-click **`START-PLAYER-2.bat`**

That's it.

---

## Step by step

### 1. One-time setup on this laptop

- Install **Node.js** (nodejs.org)
- Pair the MindWave headset over Bluetooth
  (Windows Settings -> Bluetooth & devices)
- Install and start **ThinkGear Connector**, and confirm the headset shows
  as connected in it
- Install dependencies — open a terminal in this folder and run:
  ```
  npm install
  ```
  (Skip this if you use `START-PLAYER-2.bat`; it installs automatically.)

### 2. Check the headset works

```
node check-sensor.js
```

You should see live `Attention` / `Meditation` numbers. Press Ctrl+C to
stop. If the numbers stay at 0, adjust the headset until the signal line
says good contact.

### 3. Tell it where the master is

On the **master laptop**, run `ipconfig` and find the `IPv4 Address` under
the Wi-Fi adapter — something like `192.168.0.175`.

Open **`config.json`** in this folder and put it in:

```json
{
  "masterHost": "192.168.0.175",
  "masterPort": 4000
}
```

### 4. Join the match

Start the master laptop first, then here:

```
node app.js
```

or double-click **`START-PLAYER-2.bat`**.

You should see:

```
Connected to ThinkGear Connector.
Connected to master at ws://192.168.0.175:4000/ws/sensor
```

Player 2's meter will start moving on the master's dashboard. Leave this
window open for the whole match. Ctrl+C to stop.

If WiFi drops, it reconnects on its own — no need to restart it.

---

## Which file is which

| File | What it is |
|---|---|
| **`app.js`** | **Run this to play.** |
| **`config.json`** | **Edit this — the master laptop's IP.** |
| `START-PLAYER-2.bat` | Double-click alternative to `node app.js` |
| `check-sensor.js` | Tests this laptop's headset on its own |
| `src/` | Internal code — nothing to run in here |

## If something goes wrong

| Message | Fix |
|---|---|
| `The master laptop's IP address is not set yet` | Edit `config.json` (step 3) |
| `Could not reach ThinkGear Connector on this laptop` | Start ThinkGear Connector; check the headset is paired |
| `Master connection error: connect ECONNREFUSED` | The master isn't running, or the IP in `config.json` is wrong |
| Connects, but the meter stays at 0 | Headset contact — run `node check-sensor.js` and adjust the fit |
| Connects from this laptop's browser but not from here | Windows Firewall on the **master** is blocking Node — allow it on Private networks |

## Options

You can also pass the master IP directly, which overrides `config.json`:

```
node app.js 192.168.0.175
```

`config.json` also accepts `thinkGearHost` and `thinkGearPort` if your
ThinkGear Connector isn't on the default `127.0.0.1:13854`.

## Tests

```
npm test
```
