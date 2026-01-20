"""
FocusGuard ML Models Package

This package contains machine learning models for focus detection:
- Blink Detection: Eye Aspect Ratio algorithm with OpenCV Haar Cascades
- Focus Detection: Coming soon
- Distraction Detection: Coming soon

Note: Database ORM models are located in api/models/
"""

from .blink_detector_opencv import BlinkDetector

__all__ = [
    "BlinkDetector",
]

__all__ = ['BlinkDetector']
__version__ = '0.1.0'
