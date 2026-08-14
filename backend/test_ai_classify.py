import urllib.request
import io
from PIL import Image

# Create test image
img = Image.new('RGB', (224, 224), color=(34, 197, 94))
img_bytes = io.BytesIO()
img.save(img_bytes, format='JPEG')
img_bytes = img_bytes.getvalue()

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = (
    f'--{boundary}\r\n'.encode('utf-8') +
    'Content-Disposition: form-data; name="file"; filename="test_camera_photo.jpg"\r\n'.encode('utf-8') +
    'Content-Type: image/jpeg\r\n\r\n'.encode('utf-8') +
    img_bytes +
    f'\r\n--{boundary}--\r\n'.encode('utf-8')
)

req = urllib.request.Request(
    'http://localhost:8000/api/waste/classify',
    data=body,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

try:
    resp = urllib.request.urlopen(req)
    print("AI Classification Response Status:", resp.status)
    print("AI Classification Response Body:\n", resp.read().decode())
except Exception as e:
    print("Error during test:", e)
