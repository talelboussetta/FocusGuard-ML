"""
Blink Detection Module using OpenCV Haar Cascades and Eye Aspect Ratio (EAR)

This module implements real-time blink detection using:
- OpenCV Haar Cascades for face and eye detection
- Eye Aspect Ratio (EAR) algorithm to detect eye closure
- Configurable thresholds for blink detection sensitivity

Reference: Eye Aspect Ratio for Blink Detection
Soukupová and Čech (2016) - Real-Time Eye Blink Detection using Facial Landmarks
"""

import cv2
import numpy as np
from typing import Tuple, Optional, List
import time


class BlinkDetector:
    """
    Real-time blink detector using OpenCV and Eye Aspect Ratio algorithm.
    
    The Eye Aspect Ratio is calculated based on eye region analysis.
    When eyes close, the vertical dimension decreases significantly.
    """
    
    def __init__(
        self,
        ear_threshold: float = 0.15,
        consec_frames: int = 3,
        scale_factor: float = 1.1,
        min_neighbors: int = 5
    ):
        """
        Initialize the blink detector.
        
        Args:
            ear_threshold: EAR value below which eye is considered closed (default: 0.15)
            consec_frames: Number of consecutive frames eye must be closed to count as blink (default: 3)
            scale_factor: Parameter for cascade classifier (default: 1.1)
            min_neighbors: Parameter for cascade classifier (default: 5)
        """
        self.ear_threshold = ear_threshold
        self.consec_frames = consec_frames
        self.scale_factor = scale_factor
        self.min_neighbors = min_neighbors
        
        # Load Haar Cascades
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_eye.xml'
        )
        
        # Blink tracking variables
        self.blink_counter = 0
        self.total_blinks = 0
        self.frame_counter = 0
        self.is_eye_closed = False
        self.closed_frames = 0
        
        # Performance tracking
        self.start_time = time.time()
        self.fps = 0
        
    def calculate_ear_from_region(self, eye_region: np.ndarray) -> float:
        """
        Calculate Eye Aspect Ratio from eye region.
        
        Args:
            eye_region: Cropped eye region from the frame
            
        Returns:
            Eye Aspect Ratio value
        """
        if eye_region is None or eye_region.size == 0:
            return 1.0
        
        # Convert to grayscale if needed
        if len(eye_region.shape) == 3:
            gray_eye = cv2.cvtColor(eye_region, cv2.COLOR_BGR2GRAY)
        else:
            gray_eye = eye_region
        
        # Apply threshold to get binary image
        _, binary = cv2.threshold(gray_eye, 50, 255, cv2.THRESH_BINARY)
        
        # Calculate vertical and horizontal dimensions
        height, width = binary.shape
        
        # Count white pixels in vertical and horizontal directions
        vertical_sum = np.sum(binary, axis=0)
        horizontal_sum = np.sum(binary, axis=1)
        
        # Find the maximum values
        max_vertical = np.max(vertical_sum) if vertical_sum.size > 0 else 1
        max_horizontal = np.max(horizontal_sum) if horizontal_sum.size > 0 else 1
        
        # Calculate EAR-like ratio
        if max_horizontal > 0:
            ear = max_vertical / (max_horizontal * width) if width > 0 else 1.0
        else:
            ear = 1.0
        
        return ear
    
    def detect_blink(self, frame: np.ndarray) -> Tuple[np.ndarray, dict]:
        """
        Process a frame and detect blinks.
        
        Args:
            frame: Input video frame (BGR format)
            
        Returns:
            Tuple of (annotated_frame, detection_info)
            detection_info contains: left_ear, right_ear, avg_ear, is_blinking, total_blinks, fps
        """
        # Convert to grayscale for detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Initialize detection info
        detection_info = {
            'left_ear': 0.0,
            'right_ear': 0.0,
            'avg_ear': 0.0,
            'is_blinking': False,
            'total_blinks': self.total_blinks,
            'fps': self.fps,
            'eyes_detected': 0
        }
        
        # Detect faces (adjusted for users not super close to camera)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=self.scale_factor,
            minNeighbors=self.min_neighbors,
            minSize=(60, 60),  # Smaller min size for distant users
            maxSize=(400, 400)  # Limit max size
        )
        
        if len(faces) > 0:
            # Take the first (largest) face
            (x, y, w, h) = faces[0]
            
            # Draw face rectangle
            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 255), 2)
            
            # Region of interest for eyes (upper half of face)
            roi_gray = gray[y:y+int(h*0.6), x:x+w]
            roi_color = frame[y:y+int(h*0.6), x:x+w]
            
            # Detect eyes in the face ROI
            eyes = self.eye_cascade.detectMultiScale(
                roi_gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(20, 20)
            )
            
            detection_info['eyes_detected'] = len(eyes)
            
            if len(eyes) >= 2:
                # Sort eyes by x-coordinate (left to right)
                eyes = sorted(eyes, key=lambda e: e[0])
                
                # Get left and right eyes
                left_eye = eyes[0]
                right_eye = eyes[1]
                
                # Extract eye regions
                (ex1, ey1, ew1, eh1) = left_eye
                (ex2, ey2, ew2, eh2) = right_eye
                
                left_eye_region = roi_gray[ey1:ey1+eh1, ex1:ex1+ew1]
                right_eye_region = roi_gray[ey2:ey2+eh2, ex2:ex2+ew2]
                
                # Calculate EAR for both eyes
                left_ear = self.calculate_ear_from_region(left_eye_region)
                right_ear = self.calculate_ear_from_region(right_eye_region)
                avg_ear = (left_ear + right_ear) / 2.0
                
                # Update detection info
                detection_info['left_ear'] = left_ear
                detection_info['right_ear'] = right_ear
                detection_info['avg_ear'] = avg_ear
                
                # Draw eye rectangles
                cv2.rectangle(roi_color, (ex1, ey1), (ex1+ew1, ey1+eh1), (0, 255, 0), 2)
                cv2.rectangle(roi_color, (ex2, ey2), (ex2+ew2, ey2+eh2), (0, 255, 0), 2)
                
                # Debug: Print EAR values occasionally
                if self.frame_counter % 30 == 0:  # Every 30 frames
                    print(f"[DEBUG] EAR: {avg_ear:.3f}, Threshold: {self.ear_threshold}, Closed frames: {self.closed_frames}")
                
                # Check if eyes are closed (EAR below threshold)
                if avg_ear < self.ear_threshold:
                    self.closed_frames += 1
                    # Mark as blinking when threshold is reached
                    if self.closed_frames >= self.consec_frames:
                        detection_info['is_blinking'] = True
                        if not self.is_eye_closed:
                            self.is_eye_closed = True
                            print(f"[DEBUG] Eyes detected as CLOSED")
                else:
                    # Eyes opened - check if this completes a blink
                    if self.is_eye_closed:
                        self.blink_counter += 1
                        self.total_blinks += 1
                        print(f"✓ [BLINK #{self.total_blinks}] Detected! (closed for {self.closed_frames} frames)")
                    self.is_eye_closed = False
                    self.closed_frames = 0
            
            elif len(eyes) == 1:
                # Only one eye detected
                (ex, ey, ew, eh) = eyes[0]
                cv2.rectangle(roi_color, (ex, ey), (ex+ew, ey+eh), (0, 255, 255), 2)
        
        # Always update total blinks in detection info regardless of detection status
        detection_info['total_blinks'] = self.total_blinks
        
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
        h, w = frame.shape[:2]
        
        # Position stats box in bottom-left corner
        box_width = 200
        box_height = 140
        box_x = 10
        box_y = h - box_height - 10
        
        # Background for text (semi-transparent)
        overlay = frame.copy()
        cv2.rectangle(overlay, (box_x, box_y), (box_x + box_width, box_y + box_height), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
        cv2.rectangle(frame, (box_x, box_y), (box_x + box_width, box_y + box_height), (0, 255, 0), 2)
        
        # Draw text information with smaller font
        y_offset = box_y + 25
        font_scale = 0.5
        thickness = 1
        
        cv2.putText(frame, f"qqq: {info['avg_ear']:.3f}", (box_x + 10, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 255, 0), thickness)
        
        y_offset += 25
        cv2.putText(frame, f"Blinks: {info['total_blinks']}", (box_x + 10, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 255, 0), thickness)
        
        y_offset += 25
        status = "BLINKING" if info['is_blinking'] else "OPEN"
        color = (0, 0, 255) if info['is_blinking'] else (0, 255, 0)
        cv2.putText(frame, f"Status: {status}", (box_x + 10, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale, color, thickness)
        
        y_offset += 25
        cv2.putText(frame, f"Eyes: {info['eyes_detected']}", (box_x + 10, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 255, 0), thickness)
        
        y_offset += 25
        cv2.putText(frame, f"FPS: {info['fps']:.1f}", (box_x + 10, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 255, 0), thickness)
    
    def reset(self):
        """Reset blink counter and statistics."""
        self.blink_counter = 0
        self.total_blinks = 0
        self.frame_counter = 0
        self.is_eye_closed = False
        self.closed_frames = 0
        self.start_time = time.time()


def main():
    """
    Main function to test the blink detector with webcam.
    Press 'q' to quit, 'r' to reset blink counter.
    """
    print("=" * 60)
    print("FocusGuard - Blink Detection System (OpenCV)")
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
        ear_threshold=0.15,  # Lower = more strict (eyes must be more closed)
        consec_frames=3
    )
    
    print("✓ Camera initialized successfully")
    print("✓ Blink detector ready")
    print(f"\nCurrent EAR Threshold: {detector.ear_threshold}")
    print("(Eyes are considered closed when EAR < threshold)")
    print("\nControls:")
    print("  - Press 'q' to quit")
    print("  - Press 'r' to reset blink counter")
    print("  - Press 's' to save screenshot")
    print("  - Press '+' to increase threshold (less sensitive)")
    print("  - Press '-' to decrease threshold (more sensitive)")
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
            cv2.imshow('FocusGuard - Blink Detection (OpenCV)', annotated_frame)
            
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
            elif key == ord('+') or key == ord('='):
                detector.ear_threshold += 0.01
                print(f"\n[{time.strftime('%H:%M:%S')}] Threshold increased to {detector.ear_threshold:.3f}")
            elif key == ord('-') or key == ord('_'):
                detector.ear_threshold = max(0.05, detector.ear_threshold - 0.01)
                print(f"\n[{time.strftime('%H:%M:%S')}] Threshold decreased to {detector.ear_threshold:.3f}")
    
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
