"""
FocusGuard API - Distraction Detection Routes

WebSocket and HTTP endpoints for real-time distraction monitoring.
NOTE: Backend ML processing disabled for production (all ML runs in browser).
"""

import asyncio
import json
from typing import Dict, Optional
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..config import Settings
from ..schemas.distraction import (
    DistractionEventCreate,
    DistractionEventResponse,
    DistractionEventList,
    DistractionStats,
    DetectionFrame,
    AlertNotification,
    EventType,
    Severity
)
from ..services import distraction_service
from ..middleware.auth_middleware import get_current_user_id
from ..utils.jwt_handler import decode_token
from ..utils.exceptions import TokenExpiredException, InvalidTokenException
from fastapi import HTTPException

# Load config
settings = Settings()


router = APIRouter(prefix="/distraction", tags=["Distraction Detection"])

# Active WebSocket sessions tracker
active_sessions: Dict[str, Dict] = {}  # user_id -> {session_id, websocket, started_at, events}


@router.websocket("/ws/monitor")
async def websocket_monitor(
    websocket: WebSocket,
    session_id: str = Query(..., description="Active session ID to monitor"),
    token: str = Query(..., description="JWT access token")
):
    """
    WebSocket endpoint for real-time distraction monitoring.
    
    Flow:
    1. Client connects with session_id and token
    2. Server validates token and session
    3. Client sends webcam frames (base64 encoded)
    4. Server processes frames with YOLO
    5. Server sends back detection results
    6. Server sends alerts when distractions detected
    """
    await websocket.accept()
    
    # Validate token and get user_id
    try:
        payload = decode_token(
            token,
            secret_key=settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm
        )
        user_id = payload.get("sub")
        
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token: missing user ID")
            return
            
    except (TokenExpiredException, InvalidTokenException) as e:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason=f"Authentication failed: {str(e)}")
        return
    
    # Track active session
    active_sessions[user_id] = {
        "session_id": session_id,
        "websocket": websocket,
        "started_at": datetime.utcnow()
    }
    
    try:
        await websocket.send_json({
            "type": "connection",
            "message": "Connected to distraction monitoring",
            "session_id": session_id
        })
        
        while True:
            # Receive frame from client
            data = await websocket.receive_json()
            
            if data.get("type") == "frame":
                # Backend ML processing disabled (all ML runs in browser via MediaPipe)
                # This route is kept for future backend analytics but doesn't process images
                await websocket.send_json({
                    "type": "info",
                    "message": "Backend ML disabled. Use browser-based MediaPipe detection."
                })
            
            elif data.get("type") == "stop":
                # Client requested to stop monitoring
                break
    
    except WebSocketDisconnect:
        print(f"Client disconnected: {user_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        # Cleanup
        if user_id in active_sessions:
            del active_sessions[user_id]


@router.post(
    "/events",
    response_model=DistractionEventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create distraction event",
    description="Manually create a distraction event"
)
async def create_event(
    event_data: DistractionEventCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new distraction event.
    
    Used for manual event creation or batch processing.
    """
    event = await distraction_service.create_distraction_event(db, user_id, event_data)
    return DistractionEventResponse.model_validate(event)


@router.get(
    "/sessions/{session_id}/events",
    response_model=DistractionEventList,
    summary="Get session distractions",
    description="Get all distraction events for a session"
)
async def get_session_events(
    session_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all distraction events for a session.
    """
    events = await distraction_service.get_session_distractions(db, session_id, user_id)
    
    return DistractionEventList(
        events=[DistractionEventResponse.model_validate(e) for e in events],
        total=len(events),
        session_id=session_id
    )


@router.get(
    "/sessions/{session_id}/stats",
    response_model=DistractionStats,
    summary="Get distraction statistics",
    description="Get distraction statistics for a session"
)
async def get_session_stats(
    session_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get distraction statistics for a session.
    
    Returns aggregated metrics like total distractions, types, severity, etc.
    """
    stats = await distraction_service.get_distraction_stats(db, session_id, user_id)
    return stats


@router.delete(
    "/sessions/{session_id}/events",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete session distractions",
    description="Delete all distraction events for a session"
)
async def delete_session_events(
    session_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete all distraction events for a session.
    """
    await distraction_service.delete_session_distractions(db, session_id, user_id)
    return None
