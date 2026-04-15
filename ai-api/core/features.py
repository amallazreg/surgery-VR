import numpy as np

def get_point(landmarks, index):
    p = landmarks[index]
    return np.array([p["x"], p["y"]])

def euclidean(a, b):
    return float(np.linalg.norm(a - b))

def calculate_features(landmarks: list) -> dict:

    # --- Points clés MediaPipe (indices standardisés) ---
    nose_tip        = get_point(landmarks, 4)
    nose_bottom     = get_point(landmarks, 94)
    left_eye_outer  = get_point(landmarks, 33)
    right_eye_outer = get_point(landmarks, 263)
    left_eye_inner  = get_point(landmarks, 133)
    right_eye_inner = get_point(landmarks, 362)
    mouth_left      = get_point(landmarks, 61)
    mouth_right     = get_point(landmarks, 291)
    mouth_top       = get_point(landmarks, 13)
    mouth_bottom    = get_point(landmarks, 14)
    chin            = get_point(landmarks, 152)
    forehead        = get_point(landmarks, 10)
    left_cheek      = get_point(landmarks, 234)
    right_cheek     = get_point(landmarks, 454)

    # --- Distances de base ---
    face_width      = euclidean(left_cheek, right_cheek)
    face_height     = euclidean(forehead, chin)
    eye_distance    = euclidean(left_eye_outer, right_eye_outer)
    mouth_width     = euclidean(mouth_left, mouth_right)
    mouth_height    = euclidean(mouth_top, mouth_bottom)
    nose_width      = euclidean(get_point(landmarks, 129), get_point(landmarks, 358))
    nose_height     = euclidean(nose_tip, nose_bottom)
    left_eye_width  = euclidean(left_eye_outer, left_eye_inner)
    right_eye_width = euclidean(right_eye_outer, right_eye_inner)

    # --- Ratios faciaux ---
    face_ratio          = round(face_width / face_height, 4)         if face_height > 0 else 0
    nose_face_ratio     = round(nose_width / face_width, 4)          if face_width > 0 else 0
    mouth_face_ratio    = round(mouth_width / face_width, 4)         if face_width > 0 else 0
    eye_face_ratio      = round(eye_distance / face_width, 4)        if face_width > 0 else 0
    nose_mouth_ratio    = round(nose_width / mouth_width, 4)         if mouth_width > 0 else 0
    mouth_openness      = round(mouth_height / mouth_width, 4)       if mouth_width > 0 else 0
    eye_symmetry        = round(left_eye_width / right_eye_width, 4) if right_eye_width > 0 else 0

    # --- Symétrie gauche/droite ---
    face_center_x   = (left_cheek[0] + right_cheek[0]) / 2
    nose_offset     = abs(nose_tip[0] - face_center_x)
    symmetry_score  = round(1 - (nose_offset / (face_width / 2)), 4) if face_width > 0 else 0
    symmetry_score  = max(0, min(1, symmetry_score))  # clamp entre 0 et 1

    # --- Ratio d'or (Phi = 1.618) ---
    phi = 1.618
    golden_ratio_score = round(1 - abs(face_ratio - (1 / phi)), 4)
    golden_ratio_score = max(0, min(1, golden_ratio_score))

    return {
        "distances": {
            "face_width":      round(face_width, 2),
            "face_height":     round(face_height, 2),
            "eye_distance":    round(eye_distance, 2),
            "mouth_width":     round(mouth_width, 2),
            "nose_width":      round(nose_width, 2),
        },
        "ratios": {
            "face_ratio":       face_ratio,
            "nose_face_ratio":  nose_face_ratio,
            "mouth_face_ratio": mouth_face_ratio,
            "eye_face_ratio":   eye_face_ratio,
            "nose_mouth_ratio": nose_mouth_ratio,
            "mouth_openness":   mouth_openness,
            "eye_symmetry":     eye_symmetry,
        },
        "scores": {
            "symmetry_score":     symmetry_score,
            "golden_ratio_score": golden_ratio_score,
        }
    }