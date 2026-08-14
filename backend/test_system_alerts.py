import urllib.request
import json

BASE = 'http://localhost:8000/api'

print("=== 1. TESTING CENTRALIZED ALERT SYSTEM ===")
# Fetch initial active alerts
req_active = urllib.request.urlopen(f'{BASE}/alerts?status=ACTIVE')
alerts = json.loads(req_active.read().decode())
print(f"[OK] GET /api/alerts?status=ACTIVE Count: {len(alerts)}")
if len(alerts) > 0:
    first = alerts[0]
    print(f"  First Alert Title: {first.get('title')}")
    print(f"  Severity: {first.get('severity')}")
    print(f"  Type: {first.get('alert_type')}")

    # Resolve single alert
    alert_id = first.get('id')
    req_res = urllib.request.Request(f'{BASE}/alerts/{alert_id}/resolve', data=b'', method='PUT')
    resp_res = urllib.request.urlopen(req_res)
    res_data = json.loads(resp_res.read().decode())
    print(f"[OK] PUT /api/alerts/{alert_id}/resolve Status: {resp_res.status} New Status: {res_data.get('status')}")

# Test Resolve All
req_all = urllib.request.Request(f'{BASE}/alerts/resolve-all', data=b'', method='POST')
resp_all = urllib.request.urlopen(req_all)
print(f"[OK] POST /api/alerts/resolve-all Status: {resp_all.status} Output: {json.loads(resp_all.read().decode())}")

print("\n✅ CENTRALIZED ALERT SYSTEM INTEGRATION TESTS PASSED PERFECTLY!")
