# Custom React Hooks

This folder contains reusable React hooks for the FocusGuard application.

## Available Hooks

### useLocalStorage
Persist state to localStorage with automatic sync.

```tsx
const [name, setName] = useLocalStorage<string>('userName', 'Guest')
```

### useTimer
Pomodoro timer with start, pause, resume, and reset functionality.

```tsx
const timer = useTimer({
  duration: 1500, // 25 minutes in seconds
  onComplete: () => console.log('Timer done!'),
  autoStart: false
})

// Access: timer.minutes, timer.seconds, timer.progress, timer.status
// Methods: timer.start(), timer.pause(), timer.resume(), timer.reset()
```

### useFocusSession
Manage focus sessions with stats tracking.

```tsx
const { startSession, completeSession, getSessionStats } = useFocusSession()

startSession('focus', 1500)
completeSession(85, 20, 2) // quality, blinkCount, distractionCount
```

### useNotification
Toast notification system.

```tsx
const { success, error, info, warning } = useNotification()

success('Session completed!')
error('Camera access denied')
```

### useKeyPress
Detect specific keyboard keys.

```tsx
const escapePressed = useKeyPress('Escape')
```

### useInterval
setInterval with automatic cleanup.

```tsx
useInterval(() => {
  console.log('Tick')
}, 1000)
```

### useWindowSize
Get current window dimensions (responsive).

```tsx
const { width, height } = useWindowSize()
```

### useSound
Play sound effects.

```tsx
const { play, playNotification } = useSound()

play('/sounds/complete.mp3', 0.5)
playNotification() // Simple beep
```

## Usage

Import hooks from the index file:

```tsx
import { useTimer, useLocalStorage, useFocusSession } from '../hooks'
```

## TypeScript

All hooks are fully typed with TypeScript for better DX and type safety.
