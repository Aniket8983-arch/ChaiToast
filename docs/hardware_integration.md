# SmartWaste 360 — Hardware Integration & Telemetry Specification

## 1. Executive Hardware Audit Summary

| Component | Prototype Specifications |
| :--- | :--- |
| **Microcontroller Board** | Arduino Uno / ESP32 NodeMCU |
| **Servo Actuator Pin** | Digital Pin `9` (PWM Signal) |
| **Baud Rate** | `9600` Baud |
| **Libraries Used** | `<Servo.h>` |
| **Command Protocol** | Single ASCII character commands over USB/TTL Serial |
| **Sensor Status** | Ultrasonic fill sensor currently **SIMULATED** in software |

---

## 2. Command Protocol & Flap Actuation

The Python backend communicates with the microcontroller via `pyserial` over standard serial ports (`COM3` on Windows / `/dev/ttyUSB0` on Linux).

| Command Byte | Target Waste Category | Servo Rotation Angle | Resting Reset Angle | Delay Window |
| :---: | :---: | :---: | :---: | :---: |
| `'B'` | **BIODEGRADABLE** | **45°** | 90° (Center) | 3000 ms |
| `'N'` | **NON-BIODEGRADABLE** | **135°** | 90° (Center) | 3000 ms |

### Arduino C++ Firmware Code Reference (`src/arduino_servo.ino`)
```cpp
#include <Servo.h>

Servo wasteServo;
const int SERVO_PIN = 9;

void setup() {
  Serial.begin(9600);
  wasteServo.attach(SERVO_PIN);
  wasteServo.write(90); // Default resting position
}

void loop() {
  if (Serial.available() > 0) {
    char command = Serial.read();
    if (command == 'B') {
      wasteServo.write(45);  // Open BIODEGRADABLE flap
      delay(3000);
      wasteServo.write(90);  // Reset flap
    } else if (command == 'N') {
      wasteServo.write(135); // Open NON-BIODEGRADABLE flap
      delay(3000);
      wasteServo.write(90);  // Reset flap
    }
  }
}
```

---

## 3. Disconnection & Offline Handling (Reliability Safeguard)

If the serial port is unavailable or hardware is disconnected:
1. Python backend catches `serial.SerialException` gracefully.
2. Sets `hardware_mode = "SIMULATED"` and `hardware_sent = False`.
3. System UI displays `SIMULATED SENSOR DATA` / `SIMULATED DEVICE` badges.
4. **The application never crashes when hardware is disconnected.**

---

## 4. Future ESP32 Ultrasonic Telemetry Architecture

When upgrading from simulation mode to physical HC-SR04 ultrasonic sensors:

```
+------------------+         +------------------+         +-------------------+
|  HC-SR04 Sensor  |  Trig   |      ESP32       |  WiFi   |  FastAPI Backend  |
| (Ultrasonic Echo)| ------> |   Microcontroller| ------> | POST /api/sensors |
+------------------+         +------------------+         +---------+---------+
                                                                    |
                                                                    v
                                                          +-------------------+
                                                          | SQLite Database   |
                                                          | (sensor_readings) |
                                                          +-------------------+
```

### ESP32 Telemetry Calculation Contract
```cpp
// ESP32 Distance to Fill % Formula
float duration_us = pulseIn(ECHO_PIN, HIGH);
float distance_cm = duration_us * 0.0343 / 2.0;
float bin_height_cm = 50.0;
float fill_percentage = ((bin_height_cm - distance_cm) / bin_height_cm) * 100.0;
```
