import urllib.request
import json

BASE = 'http://localhost:8000/api'

print("=== 1. TESTING PICKUP CREATION & STATUS TRANSITIONS ===")
pickup_payload = json.dumps({
    "establishment": "Main Canteen Building",
    "location": "Zone A - Sector 3",
    "waste_category": "BIO",
    "estimated_quantity": 75.0,
    "scheduled_date": "2026-08-15",
    "scheduled_time": "09:30 AM",
    "priority": "HIGH",
    "vehicle_id": "v-001",
    "assigned_vehicle": "MH-12-SW-1001 (COMPACT)",
    "assigned_driver": "Rajesh Kumar"
}).encode('utf-8')

req = urllib.request.Request(f'{BASE}/pickups', data=pickup_payload, headers={'Content-Type': 'application/json'})
except Exception as e:
    if hasattr(e, 'read'):
        print("HTTP Error details:", e.read().decode())
    else:
        print("Error details:", e)

# Update Pickup Status
pickup_id = pickup_res.get('id')
update_payload = json.dumps({"status": "IN_TRANSIT"}).encode('utf-8')
req_upd = urllib.request.Request(f'{BASE}/pickups/{pickup_id}', data=update_payload, headers={'Content-Type': 'application/json'}, method='PUT')
resp_upd = urllib.request.urlopen(req_upd)
print(f"[OK] PUT /api/pickups/{pickup_id} Status: {resp_upd.status} New Status: {json.loads(resp_upd.read().decode()).get('status')}")

print("\n=== 2. TESTING VEHICLE LOCATION & MOVEMENT SIMULATION ===")
resp_v_loc = urllib.request.urlopen(f'{BASE}/vehicles/v-001/location')
v_loc = json.loads(resp_v_loc.read().decode())
print(f"[OK] GET /api/vehicles/v-001/location Status: {resp_v_loc.status}")
print(f"  Coordinates: ({v_loc.get('latitude')}, {v_loc.get('longitude')})")
print(f"  Telemetry Speed: {v_loc.get('speed_kmh')} km/h")
print(f"  Data Source Contract: '{v_loc.get('data_source')}'")

print("\n✅ PICKUP & VEHICLE SIMULATION TESTS COMPLETE!")
