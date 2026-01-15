"""
Blink Detection Module using MediaPipe Face Mesh and Eye Aspect Ratio (EAR)

This module implements real-time blink detection using:
- MediaPipe Face Mesh for facial landmark detection
- Eye Aspect Ratio (EAR) algorithm to detect eye closure
- Configurable thresholds for blink detection sensitivity

Reference: Eye Aspect Ratio for Blink Detection
Soukupová and Čech (2016) - Real-Time Eye Blink Detection using Facial Landmarks
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import Tuple, Optional, List
import time


class BlinkDetector:
    """
    Real-time blink detector using MediaPipe and Eye Aspect Ratio algorithm.
    
    The Eye Aspect Ratio is calculated as:
    EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
    
    Where p1-p6 are the 6 key landmarks around each eye.
    """
    
    # MediaPipe Face Mesh landmark indices for left and right eyes
    LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]  # Left eye landmarks
    RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]  # Right eye landmarks
    
    def __init__(
        self,
        ear_threshold: float = 0.25,
        consec_frames: int = 2,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5
    ):
        """
        Initialize the blink detector.
        
        Args:
            ear_threshold: EAR value below which eye is considered closed (default: 0.25)
            consec_frames: Number of consecutive frames eye must be closed to count as blink (default: 2)
            min_detection_confidence: Minimum confidence for face detection (default: 0.5)
            min_tracking_confidence: Minimum confidence for face tracking (default: 0.5)
        """
        self.ear_threshold = ear_threshold
        self.consec_frames = consec_frames
        
        # Initialize MediaPipe Face Mesh
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
        
        # Blink tracking variables
        self.blink_counter = 0
        self.total_blinks = 0
        self.frame_counter = 0
        
        # Performance tracking
        self.start_time = time.time()
        self.fps = 0
        
    def calculate_ear(self, eye_landmarks: np.ndarray) -> float:
        """
        Calculate Eye Aspect Ratio for a single eye.
        
        Args:
            eye_landmarks: Array of 6 (x, y) coordinates for eye landmarks
            
        Returns:
            Eye Aspect Ratio value
        """
        # Compute the euclidean distances between the vertical eye landmarks
        vertical_1 = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
        vertical_2 = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
        
        # Compute the euclidean distance between the horizontal eye landmarks
        horizontal = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])
        
        # Calculate the eye aspect ratio
        ear = (vertical_1 + vertical_2) / (2.0 * horizontal)
        
        return ear
    
    def get_eye_landmarks(
        self,
        face_landmarks,
        eye_indices: List[int],
        frame_width: int,
        frame_height: int
    ) -> np.ndarray:
        """
        Extract eye landmarks from face mesh results.
        
        Args:
            face_landmarks: MediaPipe face landmarks
            eye_indices: List of landmark indices for the eye
            frame_width: Width of the video frame
            frame_height: Height of the video frame
            
        Returns:
            Array of (x, y) coordinates for eye landmarks
        """
        landmarks = []
        for idx in eye_indices:
            landmark = face_landmarks.landmark[idx]
            x = int(landmark.x * frame_width)
            y = int(landmark.y * frame_height)
            landmarks.append([x, y])
        
        return np.array(landmarks, dtype=np.float32)
    
    def detect_blink(self, frame: np.ndarray) -> Tuple[np.ndarray, dict]:
        """
        Process a frame and detect blinks.
        
        Args:
            frame: Input video frame (BGR format)
            
        Returns:
            Tuple of (annotated_frame, detection_info)
            detection_info contains: left_ear, right_ear, avg_ear, is_blinking, total_blinks, fps
        """
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process the frame
        results = self.face_mesh.process(rgb_frame)
        
        # Get frame dimensions
        h, w = frame.shape[:2]
        
        # Initialize detection info
        detection_info = {
            'left_ear': 0.0,
            'right_ear': 0.0,
            'avg_ear': 0.0,
            'is_blinking': False,
            'total_blinks': self.total_blinks,
            'fps': self.fps
        }
        
        if results.multi_face_landmarks:
            face_landmarks = results.multi_face_landmarks[0]
            
            # Get left and right eye landmarks
            left_eye = self.get_eye_landmarks(face_landmarks, self.LEFT_EYE_INDICES, w, h)
            right_eye = self.get_eye_landmarks(face_landmarks, self.RIGHT_EYE_INDICES, w, h)
            
            # Calculate EAR for both eyes
            left_ear = self.calculate_ear(left_eye)
            right_ear = self.calculate_ear(right_eye)
            avg_ear = (left_ear + right_ear) / 2.0
            
            # Update detection info
            detection_info['left_ear'] = left_ear
            detection_info['right_ear'] = right_ear
            detection_info['avg_ear'] = avg_ear
            
            # Check if eyes are closed (EAR below threshold)
            if avg_ear < self.ear_threshold:
                self.blink_counter += 1
                detection_info['is_blinking'] = True
            else:
                # If eyes were closed for sufficient consecutive frames, count as blink
                if self.blink_counter >= self.consec_frames:
                    self.total_blinks += 1
                    detection_info['total_blinks'] = self.total_blinks
                self.blink_counter = 0
            
            # Draw eye landmarks
            for landmark in left_eye:
                cv2.circle(frame, tuple(landmark.astype(int)), 2, (0, 255, 0), -1)
            for landmark in right_eye:
                cv2.circle(frame, tuple(landmark.astype(int)), 2, (0, 255, 0), -1)
            
            # Draw eye contours
            cv2.polylines(frame, [left_eye.astype(int)], True, (0, 255, 255), 1)
            cv2.polylines(frame, [right_eye.astype(int)], True, (0, 255, 255), 1)
        
        # Calculate FPS
        self.frame_counter += 1
        elapsed_time = time.time() - self.start_time
        if elapsed_time > 0:
            self.fps = self.frame_counter / elapsed_time
            detection_info['fps'] = self.fps
        
        # Draw information on frame
        self._draw_info(frame, detection_info)
        
        return frame, detection_info
    
    def _draw_info(self, frame: np.ndarray, info: dict):
        """Draw detection information on the frame."""
        # Background for text
        cv2.rectangle(frame, (10, 10), (400, 150), (0, 0, 0), -1)
        cv2.rectangle(frame, (10, 10), (400, 150), (0, 255, 0), 2)
        
        # Draw text information
        y_offset = 35
        cv2.putText(frame, f"EAR: {info['avg_ear']:.3f}", (20, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        y_offset += 30
        cv2.putText(frame, f"Blinks: {info['total_blinks']}", (20, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        y_offset += 30
        status = "BLINKING" if info['is_blinking'] else "OPEN"
        color = (0, 0, 255) if info['is_blinking'] else (0, 255, 0)
        cv2.putText(frame, f"Status: {status}", (20, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        
        y_offset += 30
        cv2.putText(frame, f"FPS: {info['fps']:.1f}", (20, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    def reset(self):
        """Reset blink counter and statistics."""
        self.blink_counter = 0
        self.total_blinks = 0
        self.frame_counter = 0
        self.start_time = time.time()
    
    def __del__(self):
        """Cleanup resources."""
        if hasattr(self, 'face_mesh'):
            self.face_mesh.close()


def main():
    """
    Main function to test the blink detector with webcam.
    Press 'q' to quit, 'r' to reset blink counter.
    """
    print("=" * 60)
    print("FocusGuard - Blink Detection System")
    print("=" * 60)
    print("\nInitializing camera and blink detector...")
    
    # Initialize video capture
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open camera!")
        return
    
    # Set camera properties for better performance
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)
    
    # Initialize blink detector
    detector = BlinkDetector(
        ear_threshold=0.25,
        consec_frames=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    print("✓ Camera initialized successfully")
    print("✓ Blink detector ready")
    print("\nControls:")
    print("  - Press 'q' to quit")
    print("  - Press 'r' to reset blink counter")
    print("  - Press 's' to save screenshot")
    print("\nStarting detection...\n")
    
    screenshot_counter = 0
    
    try:
        while True:
            # Read frame from camera
            ret, frame = cap.read()
            
            if not ret:
                print("Error: Failed to grab frame")
                break
            
            # Flip frame horizontally for mirror view
            frame = cv2.flip(frame, 1)
            
            # Detect blinks
            annotated_frame, info = detector.detect_blink(frame)
            
            # Display the frame
            cv2.imshow('FocusGuard - Blink Detection', annotated_frame)
            
            # Handle key presses
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'):
                print("\nExiting...")
                break
            elif key == ord('r'):
                detector.reset()
                print(f"\n[{time.strftime('%H:%M:%S')}] Blink counter reset")
            elif key == ord('s'):
                screenshot_name = f"blink_detection_{screenshot_counter}.jpg"
                cv2.imwrite(screenshot_name, annotated_frame)
                print(f"\n[{time.strftime('%H:%M:%S')}] Screenshot saved: {screenshot_name}")
                screenshot_counter += 1
    
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    
    finally:
        # Cleanup
        print("\nCleaning up...")
        cap.release()
        cv2.destroyAllWindows()
        print("✓ Camera released")
        print("✓ Windows closed")
        print(f"\nFinal Statistics:")
        print(f"  Total Blinks: {detector.total_blinks}")
        print(f"  Average FPS: {detector.fps:.1f}")
        print("\nThank you for using FocusGuard Blink Detection!")


if __name__ == "__main__":
    main()
