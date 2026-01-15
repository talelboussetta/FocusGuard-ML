"""
FocusGuard ML Models Package

This package contains machine learning models for focus detection:
- Blink Detection: Eye Aspect Ratio algorithm with MediaPipe
- Focus Detection: Coming soon
- Distraction Detection: Coming soon
"""

from .blink_detector import BlinkDetector

__all__ = ['BlinkDetector']
__version__ = '0.1.0'
