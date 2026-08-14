import urllib.request
import os

os.makedirs("scratch", exist_ok=True)

urls = {
    "bottle.jpg": "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=400&q=80",
    "can.jpg": "https://images.unsplash.com/photo-1534080391025-09795d197360?auto=format&fit=crop&w=400&q=80",
    "apple.jpg": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80"
}

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

for name, url in urls.items():
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as response:
            with open(f"scratch/{name}", "wb") as f:
                f.write(response.read())
        print(f"Successfully downloaded scratch/{name}")
    except Exception as e:
        print(f"Failed to download {name}: {e}")
