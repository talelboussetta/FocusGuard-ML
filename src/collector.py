import cv2
import csv
import os
from datetime import datetime
from pynput import keyboard, mouse
import mediapipe as mp
import math
import time
from collections import deque

LOGS_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(LOGS_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOGS_DIR, 'activity_log.csv')

def log_event(event_type, event_detail):
    with open(LOG_FILE, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([datetime.now().isoformat(), event_type, event_detail])

def on_key_press(key):
    try:
        log_event('keyboard_press', key.char)
    except AttributeError:
        log_event('keyboard_press', str(key))

def on_click(x, y, button, pressed):
    action = 'pressed' if pressed else 'released'
    log_event('mouse_click', f'{button} {action} at ({x},{y})')

def calculate_eye_aspect_ratio(landmarks, eye_indices):
    def distance(a, b):
        return math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

    vertical1 = distance(landmarks[eye_indices[1]], landmarks[eye_indices[5]])
    vertical2 = distance(landmarks[eye_indices[2]], landmarks[eye_indices[4]])
    horizontal = distance(landmarks[eye_indices[0]], landmarks[eye_indices[3]])
    ear = (vertical1 + vertical2) / (2.0 * horizontal)
    return ear

def calibrate_ear(cap, face_mesh, eye_indices, duration=5):
    print(f"Calibration: Please keep your eyes OPEN for {duration} seconds.")
    open_ear_values = []
    start_time = time.time()
    while time.time() - start_time < duration:
        ret, frame = cap.read()
        if not ret:
            continue
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(frame_rgb)
        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark
            ear = calculate_eye_aspect_ratio(landmarks, eye_indices)
            open_ear_values.append(ear)
        cv2.imshow("Calibration - Eyes Open", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    print(f"Now, please CLOSE your eyes for {duration} seconds.")
    closed_ear_values = []
    start_time = time.time()
    while time.time() - start_time < duration:
        ret, frame = cap.read()
        if not ret:
            continue
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(frame_rgb)
        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark
            ear = calculate_eye_aspect_ratio(landmarks, eye_indices)
            closed_ear_values.append(ear)
        cv2.imshow("Calibration - Eyes Closed", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cv2.destroyAllWindows()
    open_ear_avg = sum(open_ear_values) / len(open_ear_values) if open_ear_values else 0.3
    closed_ear_avg = sum(closed_ear_values) / len(closed_ear_values) if closed_ear_values else 0.15
    threshold = (open_ear_avg + closed_ear_avg) / 2
    print(f"Calibration done. EAR threshold set to {threshold:.3f}")
    return threshold

def main():
    keyboard_listener = keyboard.Listener(on_press=on_key_press)
    keyboard_listener.start()

    mouse_listener = mouse.Listener(on_click=on_click)
    mouse_listener.start()

    mp_face_mesh = mp.solutions.face_mesh
    cap = cv2.VideoCapture(0)

    left_eye_indices = [33, 160, 158, 133, 153, 144]

    with mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5) as face_mesh:

        EAR_THRESHOLD = calibrate_ear(cap, face_mesh, left_eye_indices)
        EYE_AR_CONSEC_FRAMES = 3
        blink_cooldown = 1.0  # seconds

        blink_counter = 0
        closed_eyes_frame_count = 0
        last_blink_time = 0

        # Moving average smoothing buffer
        ear_buffer = deque(maxlen=5)

        print("Starting data collection. Press 'q' to quit.")

        while True:
            ret, frame = cap.read()
            if not ret:
                print("Failed to grab frame")
                break

            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(frame_rgb)

            if results.multi_face_landmarks:
                landmarks = results.multi_face_landmarks[0].landmark
                ear = calculate_eye_aspect_ratio(landmarks, left_eye_indices)

                # Add to buffer and calculate smoothed EAR
                ear_buffer.append(ear)
                ear_smoothed = sum(ear_buffer) / len(ear_buffer)

                current_time = time.time()

                if ear_smoothed < EAR_THRESHOLD:
                    closed_eyes_frame_count += 1
                else:
                    if closed_eyes_frame_count >= EYE_AR_CONSEC_FRAMES:
                        if current_time - last_blink_time > blink_cooldown:
                            blink_counter += 1
                            log_event('blink', f'total_blinks={blink_counter}')
                            last_blink_time = current_time
                    closed_eyes_frame_count = 0

                cv2.putText(frame, f'Blinks: {blink_counter}', (30, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            else:
                closed_eyes_frame_count = 0

            cv2.imshow('FocusGuard Webcam', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    keyboard_listener.stop()
    mouse_listener.stop()

if __name__ == "__main__":
    main()
