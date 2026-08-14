import urllib.request
import json
import io
from PIL import Image

BASE = 'http://localhost:8000/api'

print("=== 1. TESTING AI WASTE CLASSIFICATION (models/waste_model.h5) ===")
img = Image.new('RGB', (224, 224), color=(34, 197, 94))
img_bytes = io.BytesIO()
img.save(img_bytes, format='JPEG')
img_bytes = img_bytes.getvalue()

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = (
    f'--{boundary}\r\n'.encode('utf-8') +
    'Content-Disposition: form-data; name="file"; filename="camera_photo.jpg"\r\n'.encode('utf-8') +
    'Content-Type: image/jpeg\r\n\r\n'.encode('utf-8') +
    img_bytes +
    f'\r\n--{boundary}--\r\n'.encode('utf-8')
)

req = urllib.request.Request(f'{BASE}/waste/classify', data=body, headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
resp = urllib.request.urlopen(req)
print(f"[OK] POST /api/waste/classify Status: {resp.status}")
data = json.loads(resp.read().decode())
print(f"  Category Result: {data.get('display_label')} (label={data.get('label')})")
print(f"  Confidence: {data.get('confidence')*100:.1f}%")
print(f"  Model Status: {data.get('model_status')}")
print(f"  Classification Status: {data.get('classification_status')}")

# GET /api/waste/history & /statistics
resp_hist = urllib.request.urlopen(f'{BASE}/waste/history')
print(f"[OK] GET /api/waste/history Status: {resp_hist.status} Count: {len(json.loads(resp_hist.read().decode()))}")

resp_stats = urllib.request.urlopen(f'{BASE}/waste/statistics')
print(f"[OK] GET /api/waste/statistics Status: {resp_stats.status} Stats: {json.loads(resp_stats.read().decode())}")


print("\n=== 2. TESTING SMART BIN MANAGEMENT APIS ===")
resp_bins = urllib.request.urlopen(f'{BASE}/bins')
bins_data = json.loads(resp_bins.read().decode())
print(f"[OK] GET /api/bins Status: {resp_bins.status} Total Bins: {len(bins_data)}")

resp_single = urllib.request.urlopen(f'{BASE}/bins/BIN-001')
print(f"[OK] GET /api/bins/BIN-001 Status: {resp_single.status} Fill: {json.loads(resp_single.read().decode()).get('current_fill_pct')}%")

resp_readings = urllib.request.urlopen(f'{BASE}/bins/BIN-001/readings')
print(f"[OK] GET /api/bins/BIN-001/readings Status: {resp_readings.status} Readings Count: {len(json.loads(resp_readings.read().decode()))}")


print("\n=== 3. TESTING ULTRASONIC SIMULATION ENGINE APIS ===")
resp_sim_start = urllib.request.urlopen(urllib.request.Request(f'{BASE}/simulation/bins/BIN-001/start', data=b'', headers={}))
print(f"[OK] POST /api/simulation/bins/BIN-001/start Status: {resp_sim_start.status}")

resp_sim_stop = urllib.request.urlopen(urllib.request.Request(f'{BASE}/simulation/bins/BIN-001/stop', data=b'', headers={}))
print(f"[OK] POST /api/simulation/bins/BIN-001/stop Status: {resp_sim_stop.status}")

resp_sim_reset = urllib.request.urlopen(urllib.request.Request(f'{BASE}/simulation/bins/BIN-001/reset', data=b'', headers={}))
print(f"[OK] POST /api/simulation/bins/BIN-001/reset Status: {resp_sim_reset.status} Reset Fill: {json.loads(resp_sim_reset.read().decode()).get('current_fill_pct')}%")


print("\n=== 4. TESTING DASHBOARD LIVE SUMMARY API ===")
resp_dash = urllib.request.urlopen(f'{BASE}/dashboard/summary')
dash_data = json.loads(resp_dash.read().decode())
print(f"[OK] GET /api/dashboard/summary Status: {resp_dash.status}")
print(f"  Total Waste: {dash_data.get('total_waste_liters')} L")
print(f"  Today's Waste: {dash_data.get('today_waste_liters')} L")
print(f"  Recycling Rate: {dash_data.get('recycling_rate')}%")
print(f"  Active Pickups: {dash_data.get('active_pickups')}")
print(f"  Bins Near Full: {dash_data.get('bins_near_full')}")
print("\n✅ ALL MODULE INTEGRATION TESTS PASSED PERFECTLY!")
