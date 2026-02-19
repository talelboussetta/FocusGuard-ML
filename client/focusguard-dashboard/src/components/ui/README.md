# UI Components

Reusable UI components for consistent design across FocusGuard.

## Components

### Button
Multi-variant button with loading states.

```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

<Button variant="danger" isLoading>
  Deleting...
</Button>
```

**Variants:** primary, secondary, ghost, danger, success  
**Sizes:** sm, md, lg

### Input
Styled input with label, error states, and icons.

```tsx
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  icon={<Mail size={18} />}
  error={errors.email}
/>
```

### Card
Container with multiple variants and hover effects.

```tsx
<Card variant="gradient" hover>
  <h3>Card Title</h3>
  <p>Card content...</p>
</Card>
```

**Variants:** default, gradient, glass

### Modal
Accessible modal dialog with animations.

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Modal content...</p>
</Modal>
```

**Sizes:** sm, md, lg, xl

### Progress
Linear progress bar with variants.

```tsx
<Progress value={75} max={100} variant="success" showLabel />
```

**Variants:** primary, success, warning, danger

### Badge
Status indicators and labels.

```tsx
<Badge variant="success" size="md">
  Active
</Badge>
```

**Variants:** default, success, warning, danger, info

### Toast
Notification system (use with NotificationContext).

```tsx
const { success, error } = useNotificationContext()

success('Changes saved!')
error('Something went wrong')
```

## Usage

Import components from the index file:

```tsx
import { Button, Card, Modal } from '../components/ui'
```

## Styling

All components use Tailwind CSS and follow the FocusGuard color palette:
- Primary: Blue (#3b82f6)
- Success: Emerald (#22c55e)
- Warning: Yellow (#eab308)
- Danger: Red (#ef4444)

## Animations

Components use Framer Motion for smooth animations and transitions.
