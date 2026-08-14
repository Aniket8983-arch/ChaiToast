import sys
import os
from pathlib import Path
import numpy as np
from PIL import Image
import tensorflow as tf

def main():
    if len(sys.argv) < 2:
        print("Usage: python test_model_image.py \"PATH_TO_IMAGE\"")
        sys.exit(1)

    image_path_str = sys.argv[1]
    image_path = Path(image_path_str).resolve()

    if not image_path.exists():
        print(f"Error: Image path '{image_path_str}' does not exist.")
        sys.exit(1)

    model_path = Path("models/waste_model.h5").resolve()
    if not model_path.exists():
        print("Error: models/waste_model.h5 not found.")
        sys.exit(1)

    # 1. Load models/waste_model.h5
    model = tf.keras.models.load_model(str(model_path))

    # 2. Load the supplied image
    img = Image.open(str(image_path))

    # 3. Convert it to RGB
    img_rgb = img.convert("RGB")

    # 4. Resize it to exactly 224x224
    IMG_SIZE = 224
    img_resized = img_rgb.resize((IMG_SIZE, IMG_SIZE))

    # 5. Normalize it exactly as the original model expects
    img_array = np.array(img_resized) / 255.0
    preprocessed_tensor = np.expand_dims(img_array, axis=0)

    # 6. Run inference
    raw_prediction = float(model.predict(preprocessed_tensor, verbose=0)[0][0])

    # 7. Apply CURRENT threshold of 0.5
    if raw_prediction > 0.5:
        predicted_class = "NON-BIODEGRADABLE"
        confidence = raw_prediction
    else:
        predicted_class = "BIODEGRADABLE"
        confidence = 1.0 - raw_prediction

    # Output format
    print(f"IMAGE: {image_path_str}")
    print(f"MODEL: {model_path.name}")
    print(f"INPUT SHAPE: {model.input_shape}")
    print(f"RAW PREDICTION: {raw_prediction:.6f}")
    print(f"PREDICTED CLASS: {predicted_class}")
    print(f"CONFIDENCE: {confidence * 100:.2f}%")

if __name__ == "__main__":
    main()
