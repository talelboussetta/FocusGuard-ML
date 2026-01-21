"""
FocusGuard API - Distraction Detection Schemas

Pydantic models for distraction detection API.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class EventType(str, Enum):
    """Distraction event types."""
    PHONE_USAGE = "phone_usage"
    USER_ABSENT = "user_absent"
    MULTIPLE_PERSONS = "multiple_persons"


class Severity(str, Enum):
    """Distraction severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class DistractionEventCreate(BaseModel):
    """Schema for creating a distraction event."""
    session_id: UUID
    event_type: EventType
    duration_seconds: int = Field(ge=0, description="Duration in seconds")
    severity: Severity = Severity.LOW
    details: Optional[Dict[str, Any]] = None
    started_at: datetime
    ended_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DistractionEventResponse(BaseModel):
    """Schema for distraction event response."""
    id: UUID
    session_id: UUID
    user_id: UUID
    event_type: EventType
    duration_seconds: int
    severity: Severity
    details: Optional[Dict[str, Any]] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DistractionEventList(BaseModel):
    """Schema for list of distraction events."""
    events: List[DistractionEventResponse]
    total: int
    session_id: Optional[UUID] = None


class DistractionStats(BaseModel):
    """Statistics about distractions in a session."""
    session_id: UUID
    total_distractions: int
    phone_usage_count: int
    user_absent_count: int
    total_distraction_time_seconds: int
    avg_distraction_duration_seconds: float
    severity_breakdown: Dict[str, int]  # {"low": 2, "medium": 1, "high": 0}


class DetectionFrame(BaseModel):
    """Real-time detection frame data (WebSocket)."""
    person_detected: bool
    phone_detected: bool
    phone_usage_duration: float = 0.0
    should_alert: bool = False
    distraction_active: bool = False
    total_distractions: int = 0
    fps: int = 0
    person_count: int = 0
    phone_count: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class MonitoringSessionStart(BaseModel):
    """Start monitoring session request."""
    session_id: UUID


class MonitoringSessionStop(BaseModel):
    """Stop monitoring session request."""
    session_id: UUID
    save_events: bool = True


class AlertNotification(BaseModel):
    """Alert notification to send to frontend."""
    alert_type: str  # "phone_usage", "user_absent"
    message: str
    severity: Severity
    duration: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    play_sound: bool = True
