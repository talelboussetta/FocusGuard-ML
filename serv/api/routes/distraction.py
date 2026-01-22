"""
FocusGuard API - Distraction Detection Routes

WebSocket and HTTP endpoints for real-time distraction monitoring.
"""

import cv2
import base64
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

# Global detector instance (one per server)
detector_instance: Optional[object] = None
active_sessions: Dict[str, Dict] = {}  # user_id -> {session_id, websocket, detector_state}


def get_detector():
    """Get or create the global detector instance with lazy import.

    Avoid importing heavy ML libraries at app startup. If dependencies are
    missing, raise a clear error only when this feature is used.
    """
    global detector_instance
    if detector_instance is None:
        try:
            from AI_models_and_routes.distraction_detector import DistractionDetector  # type: ignore
        except ImportError as e:
            # Provide a helpful error message
            raise HTTPException(
                status_code=500,
                detail=f"Distraction detector dependencies not installed: {e}. Install 'ultralytics', 'torch', 'torchvision'."
            )
        detector_instance = DistractionDetector(
            model_name="yolov8n.pt",  # YOLOv8 Nano - faster than v11
            phone_alert_duration=10.0
        )
    return detector_instance


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
    
    detector = get_detector()
    
    # Track active session
    active_sessions[user_id] = {
        "session_id": session_id,
        "websocket": websocket,
        "started_at": datetime.utcnow(),
        "distraction_events": []
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
                # Decode base64 frame
                frame_data = data.get("frame")
                if not frame_data:
                    continue
                
                # Decode base64 to image
                try:
                    import numpy as np
                    frame_bytes = base64.b64decode(frame_data.split(',')[1] if ',' in frame_data else frame_data)
                    nparr = np.frombuffer(frame_bytes, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    
                    if frame is None:
                        continue
                    
                    # Detect distractions
                    annotated_frame, detection_info = detector.detect(frame)
                    
                    # Encode annotated frame back to base64
                    _, buffer = cv2.imencode('.jpg', annotated_frame)
                    annotated_base64 = base64.b64encode(buffer).decode('utf-8')
                    
                    # Send detection results
                    response = {
                        "type": "detection",
                        "data": {
                            **detection_info,
                            "timestamp": datetime.utcnow().isoformat()
                        },
                        "annotated_frame": f"data:image/jpeg;base64,{annotated_base64}"
                    }
                    
                    await websocket.send_json(response)
                    
                    # Send alert if needed
                    if detection_info["should_alert"]:
                        alert = AlertNotification(
                            alert_type="phone_usage",
                            message="Phone usage detected! Please focus on your work.",
                            severity=Severity.MEDIUM,
                            duration=detection_info["phone_usage_duration"],
                            play_sound=True
                        )
                        
                        await websocket.send_json({
                            "type": "alert",
                            "data": alert.model_dump()
                        })
                        
                        # Track event for later saving
                        active_sessions[user_id]["distraction_events"].append({
                            "event_type": "phone_usage",
                            "started_at": datetime.utcnow(),
                            "duration_seconds": int(detection_info["phone_usage_duration"])
                        })
                
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Frame processing error: {str(e)}"
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
        
        # Reset detector state
        detector.reset()


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
