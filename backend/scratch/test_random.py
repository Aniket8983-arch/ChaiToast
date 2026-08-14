import tensorflow as tf
import numpy as np

MODEL_PATH = "../models/waste_model.h5"
model = tf.keras.models.load_model(MODEL_PATH)

scores = []
for _ in range(100):
    img_array = np.random.rand(1, 224, 224, 3)
    prediction = float(model.predict(img_array, verbose=0)[0][0])
    scores.append(prediction)

scores = np.array(scores)
print(f"Min score: {scores.min():.4f}")
print(f"Max score: {scores.max():.4f}")
print(f"Mean score: {scores.mean():.4f}")
print(f"Median score: {scores.median() if hasattr(scores, 'median') else np.median(scores):.4f}")
print(f"Percent above 0.5: {np.sum(scores > 0.5) / len(scores) * 100:.1f}%")
