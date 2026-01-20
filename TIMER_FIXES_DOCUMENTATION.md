# Timer System Integration - Issues & Solutions

## Overview
This document summarizes the major issues encountered during timer system integration, focusing on **recurring patterns** and their **root causes**.

---

## Core Problem Patterns

### Pattern 1: **State Management & React Lifecycle Issues**
Multiple problems stemmed from improper React state management and useEffect dependencies.

**Related Issues:**
- Timer cutting off randomly
- Background refresh interfering with active sessions
- Stats resetting on completion
- Stale closures in intervals

**Root Cause:**
Empty dependency arrays `[]` in useEffect caused stale closures, capturing old state values.

**Manifestations:**
1. **Timer instability:** Background refresh interval captured old `activeSession` value, continuing to run even after session started
2. **Stats flashing:** `stopTimer()` cleared session before new stats loaded, causing brief reset to 0
3. **Missing updates:** Components didn't re-render when state changed

**Solutions:**
```typescript
// ❌ BAD: Empty dependency array captures stale state
useEffect(() => {
  const interval = setInterval(loadActiveSession, 30000)
  return () => clearInterval(interval)
}, [])

// ✅ GOOD: Include dependencies, conditionally set interval
useEffect(() => {
  if (activeSession) return // Skip when session active
  const interval = setInterval(loadActiveSession, 30000)
  return () => clearInterval(interval)
}, [activeSession])
```

**Key Fixes:**
- Added `activeSession` to dependency arrays
- Prevent `loading=true` if data already exists
- Reorder operations: update data → wait → clear state
- Add 100ms delay for React state propagation

---

### Pattern 2: **Schema & Type Mismatches**
Data inconsistencies between frontend TypeScript interfaces and backend Pydantic schemas.

**Related Issues:**
- Stats not updating (xp vs xp_points)
- Analytics validation errors
- Plant creation failures

**Root Cause:**
Frontend and backend evolved separately, creating naming conflicts.

**Manifestations:**
1. **Field naming:** `xp` (frontend) ≠ `xp_points` (backend)
2. **Response structure:** Expected `stats` array, got `daily_stats`
3. **Data types:** Integer `plant_type` but VARCHAR in database
4. **Field groups:** Service returned `{sessions, total_minutes}`, schema expected `{sessions_completed, focus_min}`

**Solutions:**
```typescript
// Frontend: Match backend field names exactly
export interface User {
  xp_points: number;  // Was: xp
  lvl: number;
}

// Backend: Use schema-matching dict keys
daily_data[date_key] = {
  "sessions_completed": 0,  // Was: sessions
  "focus_min": 0           // Was: total_minutes
}
```

**Prevention Strategy:**
- Define shared types/schemas in single source
- Use code generation from OpenAPI spec
- Add validation tests for API contracts

---

### Pattern 3: **Datetime Timezone Mismatches**
Mixing naive and timezone-aware datetimes caused PostgreSQL errors.

**Root Cause:**
Database uses `TIMESTAMP WITHOUT TIME ZONE` but Python code mixed `datetime.now()` and `datetime.now(timezone.utc)`.

**Error:**
```
asyncpg.exceptions.DataError: can't subtract offset-naive and offset-aware datetimes
```

**Solution:**
```python
# ❌ BAD: Timezone-aware datetime
end_date = datetime.now(timezone.utc)

# ✅ GOOD: Naive datetime matching database
end_date = datetime.now()
```

**Lesson:** Choose ONE datetime strategy project-wide (prefer UTC-aware everywhere or naive everywhere).

---

### Pattern 4: **Aggressive Auto-Cleanup Logic**
Over-eager session abandonment interfered with user actions.

**Root Cause:**
Auto-abandon triggered on ANY session with <10s remaining, even if user about to complete it.

**Problem:**
User clicks "Complete" → Background refresh runs → Session auto-abandoned → "Session not found" error

**Solution:**
```python
# ❌ BAD: Abandon sessions near completion
if remainingSeconds < 10:
    await abandon(session)

# ✅ GOOD: Only abandon truly stale sessions
if elapsedSeconds > 7200:  # 2 hours
    await abandon(session)
```

**Key Principle:** Let users complete sessions at ANY time, only auto-cleanup abandoned work.

---

## Implementation Highlights

### Clock-Based Timer Architecture
Prevents drift and external interference:
```typescript
// Calculate remaining time from timestamp, not decrementing state
const elapsedSeconds = Math.floor((Date.now() - sessionStartMs) / 1000)
const remaining = Math.max(0, plannedSeconds - elapsedSeconds)
```

### Real-Time Stats Calculation
Computed values update on every render:
```typescript
const liveStats = {
  total_focus_min: (stats?.total_focus_min || 0) + 
    (activeSession ? Math.floor(elapsedMinutes) : 0)
}
```

### Completion Flow (Correct Order)
```typescript
1. pauseTimer()                    // Stop ticking
2. await complete(session)         // Update backend
3. await refreshData()             // Load new stats
4. await sleep(100)                // Wait for React state
5. stopTimer()                     // Clear session
```

---

## Quick Reference

### XP & Rewards Formulas
```python
# XP System
xp_earned = actual_duration * 10
level = (total_xp // 250) + 1

# Plant Rewards
plants_earned = actual_duration // 15  # 1 per 15 minutes
```

### Critical Files Modified
**Frontend:**
- `src/contexts/SessionContext.tsx` - Timer state management
- `src/pages/Dashboard.tsx` - UI and completion flow
- `src/services/api.ts` - Type definitions

**Backend:**
- `api/services/session_service.py` - XP and plant logic
- `api/services/stats_service.py` - Field name fixes
- `api/routes/stats.py` - Response structure

---

## Lessons Learned

1. **Empty dependency arrays are dangerous** - Always include reactive values
2. **Match schemas exactly** - Frontend types must mirror backend schemas
3. **Choose one datetime strategy** - Don't mix naive and aware
4. **Trust user intent** - Don't auto-abandon work in progress
5. **Test state transitions** - Verify order of async operations
6. **Log everything** - Console logs saved hours of debugging
7. **Prevent premature optimization** - Clock-based timer is simple and robust

---

## Status: ✅ Complete

All timer functionality working correctly:
- Timer stability and accuracy
- Real-time stats display  
- Database persistence
- XP and rewards system
- Analytics integration

**Next:** Garden visualization and plant growth mechanics
