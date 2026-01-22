"""
FocusGuard API - Distraction Service

Business logic for distraction detection and event management.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.distraction import DistractionEvent
from ..models.session import Session
from ..schemas.distraction import (
    DistractionEventCreate,
    DistractionEventResponse,
    DistractionStats,
    EventType,
    Severity
)
from ..utils.exceptions import SessionNotFoundException


async def create_distraction_event(
    db: AsyncSession,
    user_id: str,
    event_data: DistractionEventCreate
) -> DistractionEvent:
    """
    Create a new distraction event.
    
    Args:
        db: Database session
        user_id: User ID creating the event
        event_data: Event data
        
    Returns:
        Created distraction event
        
    Raises:
        NotFoundException: If session not found
    """
    # Verify session exists and belongs to user
    result = await db.execute(
        select(Session).where(
            and_(
                Session.id == event_data.session_id,
                Session.user_id == UUID(user_id)
            )
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise SessionNotFoundException(session_id=str(event_data.session_id))
    
    # Create event
    event = DistractionEvent(
        session_id=event_data.session_id,
        user_id=UUID(user_id),
        event_type=event_data.event_type.value,
        duration_seconds=event_data.duration_seconds,
        severity=event_data.severity.value,
        details=event_data.details,
        started_at=event_data.started_at,
        ended_at=event_data.ended_at
    )
    
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    return event


async def get_session_distractions(
    db: AsyncSession,
    session_id: UUID,
    user_id: str
) -> List[DistractionEvent]:
    """
    Get all distraction events for a session.
    
    Args:
        db: Database session
        session_id: Session ID
        user_id: User ID (for authorization)
        
    Returns:
        List of distraction events
    """
    result = await db.execute(
        select(DistractionEvent)
        .where(
            and_(
                DistractionEvent.session_id == session_id,
                DistractionEvent.user_id == UUID(user_id)
            )
        )
        .order_by(DistractionEvent.started_at.asc())
    )
    
    return result.scalars().all()


async def get_distraction_stats(
    db: AsyncSession,
    session_id: UUID,
    user_id: str
) -> DistractionStats:
    """
    Get distraction statistics for a session.
    
    Args:
        db: Database session
        session_id: Session ID
        user_id: User ID
        
    Returns:
        Distraction statistics
    """
    # Get all events for the session
    events = await get_session_distractions(db, session_id, user_id)
    
    if not events:
        return DistractionStats(
            session_id=session_id,
            total_distractions=0,
            phone_usage_count=0,
            user_absent_count=0,
            total_distraction_time_seconds=0,
            avg_distraction_duration_seconds=0.0,
            severity_breakdown={"low": 0, "medium": 0, "high": 0}
        )
    
    # Calculate statistics
    total_distractions = len(events)
    phone_usage_count = sum(1 for e in events if e.event_type == "phone_usage")
    user_absent_count = sum(1 for e in events if e.event_type == "user_absent")
    total_distraction_time = sum(e.duration_seconds for e in events)
    avg_duration = total_distraction_time / total_distractions if total_distractions > 0 else 0.0
    
    severity_breakdown = {
        "low": sum(1 for e in events if e.severity == "low"),
        "medium": sum(1 for e in events if e.severity == "medium"),
        "high": sum(1 for e in events if e.severity == "high")
    }
    
    return DistractionStats(
        session_id=session_id,
        total_distractions=total_distractions,
        phone_usage_count=phone_usage_count,
        user_absent_count=user_absent_count,
        total_distraction_time_seconds=total_distraction_time,
        avg_distraction_duration_seconds=avg_duration,
        severity_breakdown=severity_breakdown
    )


async def delete_session_distractions(
    db: AsyncSession,
    session_id: UUID,
    user_id: str
) -> int:
    """
    Delete all distraction events for a session.
    
    Args:
        db: Database session
        session_id: Session ID
        user_id: User ID
        
    Returns:
        Number of events deleted
    """
    result = await db.execute(
        select(DistractionEvent)
        .where(
            and_(
                DistractionEvent.session_id == session_id,
                DistractionEvent.user_id == UUID(user_id)
            )
        )
    )
    events = result.scalars().all()
    
    for event in events:
        await db.delete(event)
    
    await db.commit()
    return len(events)


def calculate_severity(duration_seconds: int, event_type: str) -> Severity:
    """
    Calculate severity based on distraction duration and type.
    
    Args:
        duration_seconds: Duration of the distraction
        event_type: Type of distraction
        
    Returns:
        Severity level
    """
    if event_type == "phone_usage":
        if duration_seconds < 15:
            return Severity.LOW
        elif duration_seconds < 60:
            return Severity.MEDIUM
        else:
            return Severity.HIGH
    elif event_type == "user_absent":
        if duration_seconds < 30:
            return Severity.LOW
        elif duration_seconds < 120:
            return Severity.MEDIUM
        else:
            return Severity.HIGH
    else:
        return Severity.LOW
