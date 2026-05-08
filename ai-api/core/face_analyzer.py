import cv2
import mediapipe as mp
import numpy as np

def analyze_face(image_bytes: bytes) -> dict:
    mp_face_mesh = mp.solutions.face_mesh

    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return {"face_detected": False, "error": "Image invalide"}

    h, w = frame.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    with mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5
    ) as face_mesh:
        results = face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            return {
                "face_detected": False,
                "total_landmarks": 0,
                "image_size": {"width": w, "height": h}
            }

        landmarks = [
            {"x": lm.x * w, "y": lm.y * h, "z": lm.z}
            for lm in results.multi_face_landmarks[0].landmark
        ]

        return {
            "face_detected": True,
            "total_landmarks": len(landmarks),
            "image_size": {"width": w, "height": h},
            "landmarks": landmarks
        }