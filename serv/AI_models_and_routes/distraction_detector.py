"""
FocusGuard ML - YOLO-based Distraction Detection

Real-time distraction detection using YOLOv11 for person and phone detection.
Monitors user presence and phone usage to maintain focus during active sessions.
"""

import cv2
import numpy as np
from ultralytics import YOLO
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
import time


class DistractionDetector:
    """
    Real-time distraction detector using YOLOv11.
    
    Detects:
    - User presence (person detection)
    - Phone usage (cellphone detection)
    - Distraction events (prolonged phone usage)
    """
    
    # COCO class names for YOLO
    PERSON_CLASS = 0
    CELL_PHONE_CLASS = 67
    
    def __init__(
        self,
        model_name: str = "yolo11n.pt",  # Nano model for speed
        person_confidence: float = 0.5,
        phone_confidence: float = 0.4,
        phone_alert_duration: float = 10.0,  # seconds before alert
        proximity_threshold: float = 0.3,  # Phone proximity to person (IoU-based)
    ):
        """
        Initialize the distraction detector.
        
        Args:
            model_name: YOLO model to use (yolo11n.pt, yolo11s.pt, etc.)
            person_confidence: Confidence threshold for person detection
            phone_confidence: Confidence threshold for phone detection
            phone_alert_duration: Seconds of phone usage before alert
            proximity_threshold: Distance threshold for phone-person proximity
        """
        print(f"🤖 Loading YOLO model: {model_name}")
        self.model = YOLO(model_name)
        
        self.person_confidence = person_confidence
        self.phone_confidence = phone_confidence
        self.phone_alert_duration = phone_alert_duration
        self.proximity_threshold = proximity_threshold
        
        # State tracking
        self.person_detected = False
        self.phone_detected = False
        self.phone_start_time: Optional[float] = None
        self.distraction_active = False
        self.total_distractions = 0
        self.session_start_time = time.time()
        
        # Performance metrics
        self.frame_count = 0
        self.fps = 0
        self.last_fps_time = time.time()
        
        print("✅ Distraction detector initialized")
    
    def _calculate_iou(self, box1: List[float], box2: List[float]) -> float:
        """Calculate Intersection over Union between two bounding boxes."""
        x1_min, y1_min, x1_max, y1_max = box1
        x2_min, y2_min, x2_max, y2_max = box2
        
        # Calculate intersection area
        inter_x_min = max(x1_min, x2_min)
        inter_y_min = max(y1_min, y2_min)
        inter_x_max = min(x1_max, x2_max)
        inter_y_max = min(y1_max, y2_max)
        
        if inter_x_max < inter_x_min or inter_y_max < inter_y_min:
            return 0.0
        
        inter_area = (inter_x_max - inter_x_min) * (inter_y_max - inter_y_min)
        
        # Calculate union area
        box1_area = (x1_max - x1_min) * (y1_max - y1_min)
        box2_area = (x2_max - x2_min) * (y2_max - y2_min)
        union_area = box1_area + box2_area - inter_area
        
        return inter_area / union_area if union_area > 0 else 0.0
    
    def _is_phone_near_person(
        self,
        person_box: List[float],
        phone_box: List[float]
    ) -> bool:
        """
        Check if phone is near the detected person.
        Uses IoU and distance metrics.
        """
        # Calculate IoU
        iou = self._calculate_iou(person_box, phone_box)
        if iou > 0.1:  # Phone overlaps with person
            return True
        
        # Calculate center distance
        person_center_x = (person_box[0] + person_box[2]) / 2
        person_center_y = (person_box[1] + person_box[3]) / 2
        phone_center_x = (phone_box[0] + phone_box[2]) / 2
        phone_center_y = (phone_box[1] + phone_box[3]) / 2
        
        # Normalize distance by frame size
        distance = np.sqrt(
            (person_center_x - phone_center_x) ** 2 +
            (person_center_y - phone_center_y) ** 2
        )
        
        # If phone is within proximity threshold relative to person's height
        person_height = person_box[3] - person_box[1]
        return distance < (person_height * self.proximity_threshold)
    
    def detect(self, frame: np.ndarray) -> Tuple[np.ndarray, Dict]:
        """
        Detect distractions in the frame.
        
        Args:
            frame: Input frame (BGR format from OpenCV)
            
        Returns:
            Tuple of (annotated_frame, detection_info)
        """
        # Run YOLO detection
        results = self.model(frame, verbose=False)[0]
        
        # Extract detections
        person_boxes = []
        phone_boxes = []
        
        for box in results.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].cpu().numpy().tolist()
            
            if cls == self.PERSON_CLASS and conf >= self.person_confidence:
                person_boxes.append(xyxy)
            elif cls == self.CELL_PHONE_CLASS and conf >= self.phone_confidence:
                phone_boxes.append(xyxy)
        
        # Update state
        self.person_detected = len(person_boxes) > 0
        phone_near_person = False
        
        # Check if phone is near person
        if self.person_detected and phone_boxes:
            for person_box in person_boxes:
                for phone_box in phone_boxes:
                    if self._is_phone_near_person(person_box, phone_box):
                        phone_near_person = True
                        break
                if phone_near_person:
                    break
        
        # Phone usage timing
        current_time = time.time()
        phone_usage_duration = 0.0
        should_alert = False
        
        if phone_near_person:
            if self.phone_start_time is None:
                self.phone_start_time = current_time
            phone_usage_duration = current_time - self.phone_start_time
            
            # Check if alert should be triggered
            if phone_usage_duration >= self.phone_alert_duration and not self.distraction_active:
                should_alert = True
                self.distraction_active = True
                self.total_distractions += 1
        else:
            # Phone no longer detected or not near person
            if self.distraction_active:
                self.distraction_active = False
            self.phone_start_time = None
            phone_usage_duration = 0.0
        
        # Annotate frame
        annotated_frame = frame.copy()
        
        # Draw person boxes (green)
        for person_box in person_boxes:
            x1, y1, x2, y2 = map(int, person_box)
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(
                annotated_frame, "Person", (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2
            )
        
        # Draw phone boxes (red if near person, yellow otherwise)
        for phone_box in phone_boxes:
            x1, y1, x2, y2 = map(int, phone_box)
            color = (0, 0, 255) if phone_near_person else (0, 255, 255)
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
            label = "Phone (ALERT)" if phone_near_person else "Phone"
            cv2.putText(
                annotated_frame, label, (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2
            )
        
        # Update FPS
        self.frame_count += 1
        if current_time - self.last_fps_time >= 1.0:
            self.fps = self.frame_count
            self.frame_count = 0
            self.last_fps_time = current_time
        
        # Overlay info
        info_y = 30
        cv2.putText(
            annotated_frame, f"FPS: {self.fps}", (10, info_y),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2
        )
        info_y += 30
        
        status_color = (0, 255, 0) if self.person_detected else (0, 0, 255)
        status_text = "User Present" if self.person_detected else "User Absent"
        cv2.putText(
            annotated_frame, status_text, (10, info_y),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2
        )
        info_y += 30
        
        if phone_near_person:
            alert_color = (0, 0, 255) if self.distraction_active else (0, 165, 255)
            cv2.putText(
                annotated_frame, f"Phone: {phone_usage_duration:.1f}s", (10, info_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, alert_color, 2
            )
            info_y += 30
        
        if self.distraction_active:
            cv2.putText(
                annotated_frame, "DISTRACTION DETECTED!", (10, info_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 3
            )
        
        # Return detection info
        detection_info = {
            "person_detected": self.person_detected,
            "phone_detected": phone_near_person,
            "phone_usage_duration": phone_usage_duration,
            "should_alert": should_alert,
            "distraction_active": self.distraction_active,
            "total_distractions": self.total_distractions,
            "fps": self.fps,
            "person_count": len(person_boxes),
            "phone_count": len(phone_boxes),
        }
        
        return annotated_frame, detection_info
    
    def reset(self):
        """Reset detection state for a new session."""
        self.person_detected = False
        self.phone_detected = False
        self.phone_start_time = None
        self.distraction_active = False
        self.total_distractions = 0
        self.session_start_time = time.time()
        print("🔄 Detector state reset")


def test_detector():
    """Test the distraction detector with webcam."""
    print("🎥 Starting distraction detector test...")
    print("Controls:")
    print("  q - Quit")
    print("  r - Reset counters")
    print("  s - Save screenshot")
    print()
    
    detector = DistractionDetector()
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Error: Could not open webcam")
        return
    
    print("✅ Webcam opened successfully")
    print("📱 Point your phone at the camera to test detection")
    print()
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Error: Failed to read frame")
            break
        
        # Detect
        annotated_frame, info = detector.detect(frame)
        
        # Display
        cv2.imshow("FocusGuard - Distraction Detector", annotated_frame)
        
        # Handle keyboard input
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            print("👋 Quitting...")
            break
        elif key == ord('r'):
            detector.reset()
            print("🔄 Reset counters")
        elif key == ord('s'):
            filename = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
            cv2.imwrite(filename, annotated_frame)
            print(f"📸 Saved: {filename}")
    
    cap.release()
    cv2.destroyAllWindows()
    print("✅ Test completed")


if __name__ == "__main__":
    test_detector()
