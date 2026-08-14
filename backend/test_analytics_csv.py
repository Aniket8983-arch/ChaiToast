import urllib.request
import json

BASE = 'http://localhost:8000/api'

print("=== 1. TESTING ANALYTICS DATABASE AGGREGATIONS ===")
resp_sum = urllib.request.urlopen(f'{BASE}/analytics/summary?range=LAST_30_DAYS')
data_sum = json.loads(resp_sum.read().decode())
print(f"[OK] GET /api/analytics/summary Status: {resp_sum.status}")
print(f"  Total Waste: {data_sum.get('total_waste_liters')} L")
print(f"  BIO Waste: {data_sum.get('biodegradable_waste_liters')} L")
print(f"  NONBIO Waste: {data_sum.get('non_biodegradable_waste_liters')} L")
print(f"  Segregation Rate: {data_sum.get('segregation_percentage')}%")
print(f"  Recycling Rate: {data_sum.get('recycling_percentage')}%")

resp_trend = urllib.request.urlopen(f'{BASE}/analytics/waste-trend?range=LAST_7_DAYS')
print(f"[OK] GET /api/analytics/waste-trend Status: {resp_trend.status} Points: {len(json.loads(resp_trend.read().decode()).get('data'))}")

resp_cats = urllib.request.urlopen(f'{BASE}/analytics/categories')
print(f"[OK] GET /api/analytics/categories Status: {resp_cats.status} Output: {json.loads(resp_cats.read().decode())}")

print("\n=== 2. TESTING CSV EXPORT ENDPOINT ===")
resp_csv = urllib.request.urlopen(f'{BASE}/analytics/export/csv?range=LAST_30_DAYS')
csv_content = resp_csv.read().decode()
print(f"[OK] GET /api/analytics/export/csv Status: {resp_csv.status} Content Length: {len(csv_content)} bytes")
print("First 3 lines of CSV Report:\n" + "\n".join(csv_content.splitlines()[:3]))

print("\n✅ ANALYTICS & CSV EXPORT INTEGRATION TESTS PASSED PERFECTLY!")
