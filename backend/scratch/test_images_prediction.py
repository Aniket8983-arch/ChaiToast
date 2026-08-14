import tensorflow as tf
import numpy as np
from PIL import Image

MODEL_PATH = "../models/waste_model.h5"
model = tf.keras.models.load_model(MODEL_PATH)

def test_file(path, label):
    img = Image.open(path)
    img_resized = img.convert("RGB").resize((224, 224))
    img_array = np.array(img_resized) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    prediction = float(model.predict(img_array, verbose=0)[0][0])
    predicted_label = "NONBIO" if prediction > 0.5 else "BIO"
    conf = prediction if prediction > 0.5 else 1.0 - prediction
    print(f"[{label}] Raw prediction score: {prediction:.4f} -> {predicted_label} ({conf*100:.1f}%)")

test_file("scratch/apple.jpg", "APPLE (BIO)")
test_file("scratch/bottle.jpg", "PLASTIC BOTTLE (NONBIO)")
