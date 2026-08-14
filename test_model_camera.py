import cv2
import numpy as np
import tensorflow as tf
from pathlib import Path
from datetime import datetime


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_PATH = Path("models/waste_model.h5")

CAMERA_INDEX = 0

IMAGE_SIZE = (224, 224)

THRESHOLD = 0.50

CAPTURE_FOLDER = Path("images")

CAPTURE_FOLDER.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# LOAD MODEL
# ============================================================

print("=" * 60)
print("CHAI TOAST - WASTE SEGREGATION CAMERA TEST")
print("=" * 60)

print("\nLoading model...")

if not MODEL_PATH.exists():

    print("\nERROR: Model not found!")
    print(f"Expected: {MODEL_PATH}")
    exit()


try:

    model = tf.keras.models.load_model(
        MODEL_PATH
    )

except Exception as e:

    print("\nERROR: Could not load model.")
    print(e)
    exit()


print("Model loaded successfully!")

print("\nModel information")
print("-" * 40)
print("Input shape :", model.input_shape)
print("Output shape:", model.output_shape)
print("-" * 40)


# ============================================================
# PREDICTION FUNCTION
# ============================================================

def predict_image(image):

    # BGR → RGB
    image = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2RGB
    )

    # Resize
    image = cv2.resize(
        image,
        IMAGE_SIZE
    )

    # Convert to float
    image = np.array(
        image,
        dtype=np.float32
    )

    # Normalize
    image = image / 255.0

    # Add batch dimension
    image = np.expand_dims(
        image,
        axis=0
    )

    # Prediction
    prediction = model.predict(
        image,
        verbose=0
    )

    print("\nRaw model output:")
    print(prediction)


    # ========================================================
    # SIGMOID BINARY MODEL
    # ========================================================

    if prediction.shape[-1] == 1:

        probability = float(
            prediction[0][0]
        )

        if probability >= THRESHOLD:

            label = "NON-BIODEGRADABLE"

            confidence = probability

        else:

            label = "BIODEGRADABLE"

            confidence = 1.0 - probability


    # ========================================================
    # SOFTMAX 2-CLASS MODEL
    # ========================================================

    elif prediction.shape[-1] == 2:

        probabilities = prediction[0]

        class_index = int(
            np.argmax(probabilities)
        )

        confidence = float(
            probabilities[class_index]
        )

        class_names = [
            "BIODEGRADABLE",
            "NON-BIODEGRADABLE"
        ]

        label = class_names[class_index]


    else:

        raise ValueError(
            f"Unexpected model output shape: "
            f"{prediction.shape}"
        )


    return label, confidence


# ============================================================
# OPEN CAMERA
# ============================================================

print("\nOpening camera...")

camera = cv2.VideoCapture(
    CAMERA_INDEX
)

if not camera.isOpened():

    print("\nERROR: Could not open camera.")

    print("Try:")
    print("CAMERA_INDEX = 1")

    exit()


# ============================================================
# CAMERA RESOLUTION
# ============================================================

camera.set(
    cv2.CAP_PROP_FRAME_WIDTH,
    1280
)

camera.set(
    cv2.CAP_PROP_FRAME_HEIGHT,
    720
)


# ============================================================
# CAMERA WINDOW
# ============================================================

WINDOW_NAME = "ChaiToast - Waste Segregation"

cv2.namedWindow(
    WINDOW_NAME,
    cv2.WINDOW_NORMAL
)

cv2.resizeWindow(
    WINDOW_NAME,
    1100,
    700
)


# ============================================================
# VARIABLES FOR RESULT
# ============================================================

last_prediction = "READY"

last_confidence = 0.0

prediction_count = 0


# ============================================================
# MAIN CAMERA LOOP
# ============================================================

print("\n" + "=" * 60)

print("CAMERA READY")

print("=" * 60)

print("Place ONE waste item inside the box.")

print()

print("C = Capture and classify")

print("Q = Quit")

print("=" * 60)


while True:

    # --------------------------------------------------------
    # Read frame
    # --------------------------------------------------------

    success, frame = camera.read()

    if not success:

        print("ERROR: Could not read camera.")

        break


    # --------------------------------------------------------
    # Mirror camera
    # --------------------------------------------------------

    frame = cv2.flip(
        frame,
        1
    )


    # --------------------------------------------------------
    # Keep clean copy
    # --------------------------------------------------------

    original_frame = frame.copy()


    # --------------------------------------------------------
    # Frame dimensions
    # --------------------------------------------------------

    height, width = frame.shape[:2]


    # ========================================================
    # CAPTURE BOX
    # ========================================================

    box_width = int(
        width * 0.55
    )

    box_height = int(
        height * 0.65
    )


    x1 = (
        width - box_width
    ) // 2

    y1 = (
        height - box_height
    ) // 2


    x2 = x1 + box_width

    y2 = y1 + box_height


    # ========================================================
    # DARKEN OUTSIDE AREA
    # ========================================================

    overlay = frame.copy()


    # Top
    cv2.rectangle(
        overlay,
        (0, 0),
        (width, y1),
        (0, 0, 0),
        -1
    )


    # Bottom
    cv2.rectangle(
        overlay,
        (0, y2),
        (width, height),
        (0, 0, 0),
        -1
    )


    # Left
    cv2.rectangle(
        overlay,
        (0, y1),
        (x1, y2),
        (0, 0, 0),
        -1
    )


    # Right
    cv2.rectangle(
        overlay,
        (x2, y1),
        (width, y2),
        (0, 0, 0),
        -1
    )


    # Blend
    frame = cv2.addWeighted(
        overlay,
        0.55,
        frame,
        0.45,
        0
    )


    # ========================================================
    # DRAW CAPTURE BOX
    # ========================================================

    cv2.rectangle(
        frame,
        (x1, y1),
        (x2, y2),
        (255, 255, 255),
        3
    )


    # ========================================================
    # CORNER MARKERS
    # ========================================================

    corner_length = 30

    thickness = 5


    # Top-left
    cv2.line(
        frame,
        (x1, y1),
        (x1 + corner_length, y1),
        (255, 255, 255),
        thickness
    )

    cv2.line(
        frame,
        (x1, y1),
        (x1, y1 + corner_length),
        (255, 255, 255),
        thickness
    )


    # Top-right
    cv2.line(
        frame,
        (x2, y1),
        (x2 - corner_length, y1),
        (255, 255, 255),
        thickness
    )

    cv2.line(
        frame,
        (x2, y1),
        (x2, y1 + corner_length),
        (255, 255, 255),
        thickness
    )


    # Bottom-left
    cv2.line(
        frame,
        (x1, y2),
        (x1 + corner_length, y2),
        (255, 255, 255),
        thickness
    )

    cv2.line(
        frame,
        (x1, y2),
        (x1, y2 - corner_length),
        (255, 255, 255),
        thickness
    )


    # Bottom-right
    cv2.line(
        frame,
        (x2, y2),
        (x2 - corner_length, y2),
        (255, 255, 255),
        thickness
    )

    cv2.line(
        frame,
        (x2, y2),
        (x2, y2 - corner_length),
        (255, 255, 255),
        thickness
    )


    # ========================================================
    # INSTRUCTIONS
    # ========================================================

    cv2.putText(
        frame,
        "PLACE WASTE INSIDE THE BOX",
        (x1, y1 - 20),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.75,
        (255, 255, 255),
        2
    )


    cv2.putText(
        frame,
        "C = CAPTURE",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2
    )


    cv2.putText(
        frame,
        "Q = QUIT",
        (20, 75),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2
    )


    # ========================================================
    # SHOW LAST RESULT
    # ========================================================

    if prediction_count > 0:

        result_text = (
            f"{last_prediction}"
        )

        confidence_text = (
            f"Confidence: "
            f"{last_confidence * 100:.2f}%"
        )

        cv2.putText(
            frame,
            result_text,
            (20, height - 65),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.75,
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            confidence_text,
            (20, height - 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (255, 255, 255),
            2
        )


    # ========================================================
    # SHOW CAMERA
    # ========================================================

    cv2.imshow(
        WINDOW_NAME,
        frame
    )


    # ========================================================
    # KEYBOARD
    # ========================================================

    key = cv2.waitKey(1) & 0xFF


    # ========================================================
    # CAPTURE
    # ========================================================

    if key == ord("c"):

        print("\n" + "=" * 60)

        print(
            f"CAPTURE #{prediction_count + 1}"
        )

        print("=" * 60)


        # ----------------------------------------------------
        # CROP ONLY THE BOX
        # ----------------------------------------------------

        captured_image = original_frame[
            y1:y2,
            x1:x2
        ].copy()


        # ----------------------------------------------------
        # Save image with unique filename
        # ----------------------------------------------------

        timestamp = datetime.now().strftime(
            "%Y%m%d_%H%M%S_%f"
        )

        capture_path = (
            CAPTURE_FOLDER
            / f"capture_{timestamp}.jpg"
        )


        cv2.imwrite(
            str(capture_path),
            captured_image
        )


        print(
            f"Saved: {capture_path}"
        )


        # ----------------------------------------------------
        # PREDICT
        # ----------------------------------------------------

        try:

            label, confidence = predict_image(
                captured_image
            )

        except Exception as e:

            print("\nPrediction error:")
            print(e)

            continue


        # ----------------------------------------------------
        # Update result
        # ----------------------------------------------------

        last_prediction = label

        last_confidence = confidence

        prediction_count += 1


        # ----------------------------------------------------
        # Print result
        # ----------------------------------------------------

        print("\nRESULT")

        print(
            f"Prediction : {label}"
        )

        print(
            f"Confidence : "
            f"{confidence * 100:.2f}%"
        )

        print(
            f"Total objects checked: "
            f"{prediction_count}"
        )

        print("=" * 60)


    # ========================================================
    # QUIT
    # ========================================================

    elif key == ord("q"):

        print("\nExiting...")

        break


# ============================================================
# CLEANUP
# ============================================================

camera.release()

cv2.destroyAllWindows()


print("\n" + "=" * 60)

print("CAMERA TEST FINISHED")

print(
    f"Total objects checked: "
    f"{prediction_count}"
)

print("=" * 60)