import os
import sys
from pathlib import Path
import numpy as np
from PIL import Image
import tensorflow as tf

def run_direct_test(image_path: str):
    model_path = Path("../models/waste_model.h5").resolve()
    if not model_path.exists():
        model_path = Path("models/waste_model.h5").resolve()

    img_path = Path(image_path).resolve()

    # 1. Load Model
    model = tf.keras.models.load_model(str(model_path))

    # 2. Preprocess Image
    img = Image.open(str(img_path))
    img_resized = img.convert("RGB").resize((224, 224))
    img_array = np.array(img_resized) / 255.0
    preprocessed = np.expand_dims(img_array, axis=0)

    # 3. Predict
    raw_pred = float(model.predict(preprocessed, verbose=0)[0][0])

    if raw_pred > 0.5:
        pred_class = "NON-BIODEGRADABLE"
        confidence = raw_pred
    else:
        pred_class = "BIODEGRADABLE"
        confidence = 1.0 - raw_pred

    print("Image:", img_path.name)
    print("Model:", model_path.name)
    print("Input shape:", model.input_shape)
    print("Preprocessed shape:", preprocessed.shape)
    print("Raw prediction:", f"{raw_pred:.6f}")
    print("Predicted class:", pred_class)
    print("Confidence:", f"{confidence * 100:.2f}%")

if __name__ == "__main__":
    test_img = sys.argv[1] if len(sys.argv) > 1 else "scratch/bottle.jpg"
    run_direct_test(test_img)
