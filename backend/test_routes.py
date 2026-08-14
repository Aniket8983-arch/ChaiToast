import urllib.request

api_routes = [
    'http://localhost:8000/api/dashboard/overview',
    'http://localhost:8000/api/waste/history',
    'http://localhost:8000/api/bins',
    'http://localhost:8000/api/sensors/readings',
    'http://localhost:8000/api/pickups',
    'http://localhost:8000/api/vehicles',
    'http://localhost:8000/api/alerts',
    'http://localhost:8000/api/analytics/waste-trend',
    'http://localhost:8000/api/compliance/score',
    'http://localhost:8000/api/devices',
]

print("--- TESTING BACKEND REST API ENDPOINTS ---")
for url in api_routes:
    try:
        req = urllib.request.urlopen(url)
        path = url.split("/api/")[1]
        print(f"[OK] {path:<30} Status: {req.status}")
    except Exception as e:
        print(f"[FAIL] {url} - Error: {e}")

fe_routes = [
    'http://localhost:5174/overview',
    'http://localhost:5174/waste',
    'http://localhost:5174/bins',
    'http://localhost:5174/scheduling',
    'http://localhost:5174/vehicles',
    'http://localhost:5174/pickups',
    'http://localhost:5174/compliance',
    'http://localhost:5174/analytics',
    'http://localhost:5174/devices',
    'http://localhost:5174/settings',
]

print("\n--- TESTING FRONTEND ROUTE SERVING ---")
for url in fe_routes:
    try:
        req = urllib.request.urlopen(url)
        path = url.split(":5174")[1]
        print(f"[OK] {path:<20} Status: {req.status}")
    except Exception as e:
        print(f"[FAIL] {url} - Error: {e}")
