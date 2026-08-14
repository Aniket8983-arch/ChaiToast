import tensorflow as tf
import numpy as np
from PIL import Image
import urllib.request
import io
import os

MODEL_PATH = "../models/waste_model.h5"
model = tf.keras.models.load_model(MODEL_PATH)

def test_url(url, label):
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            img = Image.open(io.BytesIO(response.read()))
            img_resized = img.convert("RGB").resize((224, 224))
            img_array = np.array(img_resized) / 255.0
            img_array = np.expand_dims(img_array, axis=0)
            
            prediction = float(model.predict(img_array, verbose=0)[0][0])
            print(f"[{label}] Raw prediction score: {prediction:.4f}")
    except Exception as e:
        print(f"Failed to test {label}: {e}")

# Test 1: An apple (clearly Biodegradable)
apple_url = "https://upload.wikimedia.org/wikipedia/commons/1/15/Red_Apple.jpg"
test_url(apple_url, "APPLE (BIO)")

# Test 2: A plastic bottle (clearly Non-Biodegradable)
bottle_url = "https://upload.wikimedia.org/wikipedia/commons/2/27/Water_bottle.jpg"
test_url(bottle_url, "PLASTIC BOTTLE (NONBIO)")

# Test 3: A metal beverage can (clearly Non-Biodegradable)
can_url = "https://upload.wikimedia.org/wikipedia/commons/e/ec/Red_beverage_can.jpg"
test_url(can_url, "ALUMINUM CAN (NONBIO)")
