# SmartWaste 360 — Hardware

This directory documents the physical hardware setup.

## Physical Components

| Component | Model | Purpose |
|---|---|---|
| Microcontroller | ESP32 WROOM | Serial communication + servo control |
| Power regulator | Arduino UNO | 5V power supply |
| Servo motor | SG90 | Waste flap actuation |
| Prototype bin | Cardboard box | Physical sorting container |

## Firmware

The Arduino sketch is located at `../arduino/.ino`.
**Do not modify the firmware without updating the serial protocol documentation.**

## Serial Protocol

- **Port**: Configurable via `SERIAL_PORT` in `.env` (default: `COM4`)
- **Baud rate**: `115200`
- **Commands**: Single ASCII byte — `'B'` (Biodegradable) or `'N'` (Non-Biodegradable)
- **Servo angles**: BIO → 45° | NONBIO → 135° | Neutral → 90°

## GPIO Pinout

| Pin | Purpose |
|---|---|
| GPIO 18 | SG90 servo signal (PWM) |
| 5V (from Arduino) | Servo power |
| GND (common) | Common ground |

## ⚠️ Discrepancy Note

The circuit diagram (`images/circuit.jpeg`) shows GPIO Pin 30 as the servo signal.
The actual firmware uses **GPIO Pin 18**. Wire according to the firmware, not the diagram.
