import cv2
import numpy as np

def analyze_face(image_bytes: bytes) -> dict:

    np_array = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if image is None:
        return {"error": "Image invalide ou non lisible"}

    height, width = image.shape[:2]

    import mediapipe as mp
    mp_face_mesh = mp.solutions.face_mesh

    with mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5
    ) as face_mesh:

        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(image_rgb)

        if not results.multi_face_landmarks:
            return {"face_detected": False, "landmarks": []}

        landmarks = []
        for point in results.multi_face_landmarks[0].landmark:
            landmarks.append({
                "x": round(point.x * width, 2),
                "y": round(point.y * height, 2),
                "z": round(point.z, 4)
            })

        return {
            "face_detected": True,
            "total_landmarks": len(landmarks),
            "image_size": {"width": width, "height": height},
            "landmarks": landmarks
        }