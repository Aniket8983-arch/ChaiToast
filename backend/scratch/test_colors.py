import tensorflow as tf
import numpy as np
from PIL import Image

MODEL_PATH = "../models/waste_model.h5"
model = tf.keras.models.load_model(MODEL_PATH)

def test_color(color, name):
    img = Image.new('RGB', (224, 224), color=color)
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    prediction = float(model.predict(img_array, verbose=0)[0][0])
    label = "NONBIO" if prediction > 0.5 else "BIO"
    conf = prediction if prediction > 0.5 else 1.0 - prediction
    print(f"[{name}] Score: {prediction:.4f} -> {label} ({conf*100:.1f}%)")

test_color((255, 0, 0), "RED")
test_color((0, 255, 0), "GREEN")
test_color((0, 0, 255), "BLUE")
test_color((0, 0, 0), "BLACK")
test_color((255, 255, 255), "WHITE")
test_color((128, 128, 128), "GRAY")
