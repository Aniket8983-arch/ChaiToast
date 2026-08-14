# SmartWaste 360 — AI-Powered Waste Segregation & IoT Logistics Management System

SmartWaste 360 is a commercial-grade, professional waste-management platform designed to automate waste categorization at the source and optimize central collection logistics. Combining a **TensorFlow Deep Learning model**, **simulated IoT telemetry nodes**, **GPS vehicle routing**, and **operational compliance audit systems**, SmartWaste 360 delivers an end-to-end sustainable logistics pipeline.

---

## 🌍 Problem Statement
In traditional waste management systems, manual segregation is prone to human error, increases operational costs, and leads to cross-contamination of recyclable materials. Additionally, municipal and commercial collection fleets operate on fixed schedules rather than dynamic demand, leading to inefficient vehicle routes, high carbon emissions, and overfilled public bins.

## 🚀 Solution
SmartWaste 360 provides a complete automated ecosystem:
1. **At-Source Segregation**: AI computer vision identifies waste category instantly, triggering physical sorting flaps.
2. **On-Demand Logistics**: Smart bins calculate fill levels and trigger pick-up requests.
3. **Route Optimization**: Dispatchers schedule pickups, assign vehicles, and monitor fleet locations.
4. **Operations Dashboard**: Provides real-time status across central operations, compliance, and metrics.

---

## 📦 Key Features
- **AI waste classification** using a MobileNetV2 deep learning architecture.
- **Smart Bin Telemetry** with simulated fill levels and distance tracking.
- **Collections Manager** to schedule pickups, assign drivers, and monitor pickup status.
- **Simulated Vehicle Tracking** tracking fleet routes along pre-defined waypoints in Pune.
- **Alert Desk** notifying operators of critical bin levels and delayed collections.
- **Operational Compliance Engine** providing root cause analysis of operational score drops.
- **Real-Time Data Refreshing** using reliable 3-second API polling.
- **CSV Data Export** for fleet analytics and audit reports.

---

## 🧠 System Architecture

```
+--------------------------------------------------------------------------+
|                              REACT FRONTEND                              |
|   Dashboard | Waste AI | Bins | Collections | Fleet | Compliance | Settings  |
+------------------------------------+-------------------------------------+
                                     | (REST API Polling / 3s)
                                     v
+--------------------------------------------------------------------------+
|                             FASTAPI BACKEND                              |
|           Routers: /auth | /waste | /bins | /pickups | /vehicles         |
+-------+----------------------------+-----------------------------+-------+
        |                            |                             |
        v                            v                             v
+---------------+            +---------------+             +---------------+
| TENSORFLOW AI |            | SQLITE3 DB    |             | SIMULATOR     |
| waste_model.h5|            | smartwaste.db |             | Bins / GPS    |
+---------------+            +---------------+             +---------------+
```

---

## ⚙ Tech Stack
- **Frontend**: React, TypeScript, TailwindCSS, TanStack Query, Lucide Icons, ChartJS.
- **Backend**: FastAPI, SQLAlchemy, Uvicorn, Python Multipart, SQLite.
- **AI Model**: TensorFlow / Keras (MobileNetV2 Transfer Learning).
- **Hardware Integration**: Serial (USB TTL) communicating to ESP32 / Arduino Uno.

---

## 🤖 AI & Camera Classification Workflow
1. **Frame Capture**: Laptop camera captures a freeze-frame of waste.
2. **Preprocessing**: Image converted to RGB and resized to `224x224` pixels.
3. **Model Inference**: The frame is fed into the MobileNetV2 network (`models/waste_model.h5`).
4. **Classification**:
   - Scores `> 0.5` classify as **NON-BIODEGRADABLE** (`NONBIO`).
   - Scores `<= 0.5` classify as **BIODEGRADABLE** (`BIO`).
5. **Microcontroller Actuation**: Backend sends `'B'` or `'N'` command over the serial port.
6. **Flap Sorting**: SG90 servo rotates to `45°` (Bio) or `135°` (Non-Bio) for 3 seconds, then returns to `90°`.

---

## 📡 Smart Bin & Simulated Telemetry
> [!IMPORTANT]
> **SIMULATION NOTICE**: To run the project without physical hardware connected, the ultrasonic sensor fill-level telemetry and vehicle GPS locations are fully simulated by a background background thread worker.
> - **Ultrasonic Sensor**: Simulated fill level increases over time and varies realistically.
> - **Vehicle GPS**: Vehicles move gradually between pre-defined coordinates in Pune instead of jumping randomly.

### Transitioning to Physical Hardware (Roadmap)
When physical hardware is ready to deploy, the simulation mode can be swapped for live ESP32 microcontrollers:
1. Connect HC-SR04 ultrasonic sensors to ESP32 GPIOs (Trig: `GPIO 5`, Echo: `GPIO 18`).
2. Flash the ESP32 to compute distance:
   $$\text{fill\_pct} = \frac{\text{bin\_height\_cm} - \text{distance\_cm}}{\text{bin\_height\_cm}} \times 100$$
3. Program the ESP32 to execute HTTP `POST` requests to `/api/sensors/readings` over WiFi.
4. Update the settings page to switch telemetry data source from `SIMULATED` to `REAL`.

---

## 🛠 Installation & Setup

### Environment Variables
Create a `.env` file in the root workspace (never commit this file to Git):
```ini
APP_NAME="SmartWaste 360"
DATABASE_URL="sqlite:///./data/smartwaste.db"
SIMULATION_ENABLED=True
SECRET_KEY="your-secret-key-here"
```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the database seeding and start the server:
   ```bash
   python main.py
   ```
   *The database will be automatically created and populated with initial dummy records.*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
4. Access the application on `http://localhost:5173`.

---

## 🔑 Default Credentials
- **ADMIN Role**: username `admin` / password `admin123`
- **OPERATOR Role**: username `operator` / password `operator123`

---

## 🏁 Project Structure
```
ChaiToast/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # Auth, Bins, Vehicles, Compliance, Analytics
│   │   ├── models/              # User, Bin, Vehicle, Alert, Pickup models
│   │   ├── services/            # Database Seed service
│   │   └── main.py              # FastAPI startup lifecycle
│   ├── requirements.txt
│   └── main.py                  # Entrypoint runner
├── frontend/
│   ├── src/
│   │   ├── components/          # UI components & Sidebar layout
│   │   ├── context/             # AuthContext session provider
│   │   └── pages/               # Dashboard, AI, Bins, Compliance, Analytics
│   └── package.json
└── models/
    └── waste_model.h5           # MobilNetV2 AI Model file
```

---

## 🔮 Future Scope
- **Multi-Class Waste Sorting**: Expand models to detect glass, metal, paper, and medical waste.
- **Route Optimization Engine**: Use Dijkstra's algorithm to calculate optimal collection paths.
- **Solar-Powered Telemetry**: Run remote ESP32 bins on solar panels with sleep mode logic.
