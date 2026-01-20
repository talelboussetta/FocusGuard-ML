# Frontend-Backend Integration Status

## ✅ Completed

1. **API Service Layer** (`src/services/api.ts`)
   - All backend endpoints wrapped
   - Type-safe API calls
   - Auth header management
   - Error handling

2. **Auth Context** (`src/contexts/AuthContext.tsx`)
   - User state management
   - Token storage
   - Auto-login on refresh
   - Protected routes

3. **App Routing** (`src/App.tsx`)
   - Protected route wrapper
   - Auth provider integration
   - Loading states

4. **Environment Config** (`.env`)
   - API base URL configuration

## 🔄 Needs Integration

### Pages Requiring Backend Integration

#### 1. **AuthPage.tsx** - CRITICAL
**Current**: Hardcoded navigation, no API calls
**Needed**:
- ✅ Username field (backend uses username or email for login)
- ✅ Connect register to `authAPI.register()`
- ✅ Connect login to `authAPI.login()`
- ✅ Error handling & display
- ✅ Loading states
- ✅ Form validation (8+ char password, valid email)

**Implementation**:
```tsx
const { register, login } = useAuth();
const [username, setUsername] = useState('');
const [error, setError] = useState('');
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);
  
  try {
    if (isSignUp) {
      await register(username, email, password, name);
    } else {
      await login(username, password);
    }
  } catch (err: any) {
    setError(err.message || 'Authentication failed');
  } finally {
    setIsLoading(false);
  }
};
```

---

#### 2. **Dashboard.tsx** - HIGH PRIORITY
**Current**: Hardcoded stats, mock timer
**Needed**:
- ✅ Display real user data (`useAuth().user`)
- ✅ Fetch user stats (`userAPI.getStats()`)
- ✅ Fetch active session (`sessionAPI.getActive()`)
- ✅ Create new session (`sessionAPI.create()`)
- ✅ Timer integration with backend session
- ✅ Complete session when timer ends
- ✅ Real-time stats update

**Features to Add**:
```tsx
// Fetch real stats
useEffect(() => {
  const loadStats = async () => {
    const stats = await userAPI.getStats();
    const activeSession = await sessionAPI.getActive();
    setStats(stats);
    setActiveSession(activeSession);
  };
  loadStats();
}, []);

// Start session
const startSession = async (duration: number) => {
  const session = await sessionAPI.create(duration);
  setActiveSession(session);
  startTimer(duration * 60);
};

// Complete session
const completeSession = async () => {
  if (activeSession) {
    await sessionAPI.complete(
      activeSession.session_id,
      elapsedMinutes,
      focusScore
    );
    refreshUserStats();
  }
};
```

---

#### 3. **AnalyticsPage.tsx** - HIGH PRIORITY
**Current**: Mock chart data
**Needed**:
- ✅ Fetch daily stats (`statsAPI.getDailyStats(30)`)
- ✅ Fetch trends (`statsAPI.getTrends()`)
- ✅ Real weekly data for charts
- ✅ Session history (`sessionAPI.list({ limit: 50 })`)
- ✅ Performance insights

**Implementation**:
```tsx
const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
const [trends, setTrends] = useState(null);

useEffect(() => {
  const loadAnalytics = async () => {
    const [daily, trendsData] = await Promise.all([
      statsAPI.getDailyStats(30),
      statsAPI.getTrends(),
    ]);
    setDailyStats(daily.stats);
    setTrends(trendsData);
  };
  loadAnalytics();
}, []);
```

---

#### 4. **GardenPage.tsx** - MEDIUM PRIORITY
**Current**: Static plant display
**Needed**:
- ✅ Fetch garden state (`gardenAPI.get()`)
- ✅ Display actual plant counts
- ✅ Grow plant button after completing session
- ✅ Plant rarity display
- ✅ Last plant timestamp

**Implementation**:
```tsx
const [garden, setGarden] = useState<Garden | null>(null);
const [canGrowPlant, setCanGrowPlant] = useState(false);

useEffect(() => {
  const loadGarden = async () => {
    const gardenData = await gardenAPI.get();
    setGarden(gardenData);
    
    // Check if user has completed sessions without planting
    const sessions = await sessionAPI.list({ status: 'completed' });
    const unplantedSessions = sessions.filter(/* logic */);
    setCanGrowPlant(unplantedSessions.length > 0);
  };
  loadGarden();
}, []);

const growPlant = async (sessionId: string) => {
  const result = await gardenAPI.growPlant(sessionId);
  setGarden(result.garden);
  showNotification(result.message, result.plant_type);
};
```

---

#### 5. **CameraPage.tsx** - LOW PRIORITY (AI not implemented yet)
**Current**: Mock camera feed
**Needed**:
- Keep as is for now (AI backend not ready)
- Can add session integration when camera is active
- Track blink rate in session

---

#### 6. **AITutorPage.tsx** - LOW PRIORITY (AI not implemented yet)
**Current**: Mock chat
**Needed**:
- Keep as is for now
- Future: Connect to AI tutor endpoint

---

### Missing Pages to Create

#### 7. **LeaderboardPage.tsx** - NEW PAGE NEEDED
**Purpose**: Display global rankings
**Features**:
- Tabs for XP, Focus Time, Streak leaderboards
- User's current rank highlight
- Top 10/50/100 toggle
- User search

**API Calls**:
```tsx
const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
const [metric, setMetric] = useState<'xp' | 'focus_time' | 'streak'>('xp');

useEffect(() => {
  const loadLeaderboard = async () => {
    const data = await statsAPI.getLeaderboard(metric, 50);
    setLeaderboard(data.leaderboard);
  };
  loadLeaderboard();
}, [metric]);
```

---

#### 8. **ProfilePage.tsx** - NEW PAGE NEEDED
**Purpose**: User settings and profile management
**Features**:
- View/edit profile (full_name, bio)
- Change password
- Delete account
- Logout button
- View stats summary

**API Calls**:
```tsx
const updateProfile = async (data: { full_name?: string; bio?: string }) => {
  const updatedUser = await userAPI.updateProfile(data);
  updateUser(updatedUser);
};

const changePassword = async (current: string, newPass: string) => {
  await userAPI.changePassword(current, newPass);
  showNotification('Password changed successfully');
};
```

---

#### 9. **SessionHistoryPage.tsx** - NEW PAGE NEEDED
**Purpose**: View all past sessions
**Features**:
- Paginated session list
- Filter by status (completed/abandoned)
- Delete session option
- Session details modal
- XP earned display

**API Calls**:
```tsx
const [sessions, setSessions] = useState<Session[]>([]);
const [page, setPage] = useState(0);
const LIMIT = 20;

useEffect(() => {
  const loadSessions = async () => {
    const data = await sessionAPI.list({
      limit: LIMIT,
      offset: page * LIMIT,
      status: selectedFilter,
    });
    setSessions(data);
  };
  loadSessions();
}, [page, selectedFilter]);
```

---

## 🎨 UI Components Needed

### 1. **Leaderboard Card Component**
```tsx
interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}
```

### 2. **Session Card Component**
```tsx
interface SessionCardProps {
  session: Session;
  onDelete?: () => void;
}
```

### 3. **Profile Edit Form**
```tsx
interface ProfileFormProps {
  user: User;
  onUpdate: (data: any) => Promise<void>;
}
```

### 4. **Stats Dashboard Widget**
```tsx
interface StatsWidgetProps {
  stats: UserStats;
  loading?: boolean;
}
```

---

## 📱 Navigation Updates Needed

Add to Sidebar.tsx:
- Leaderboard icon/link (`/leaderboard`)
- Profile icon/link (`/profile`)
- Session History icon/link (`/sessions`)

Update App.tsx routes:
```tsx
<Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
<Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
<Route path="/sessions" element={<ProtectedRoute><SessionHistoryPage /></ProtectedRoute>} />
```

---

##  Integration Priorities

### Phase 1 (CRITICAL - Do First)
1. ✅ AuthPage - Connect login/register
2. ✅ Dashboard - Real stats & session management
3. ✅ User display in sidebar/header

### Phase 2 (HIGH - Do Second)
4. ✅ AnalyticsPage - Real charts
5. ✅ GardenPage - Real garden data
6. ✅ Create LeaderboardPage

### Phase 3 (MEDIUM - Do Third)
7. ✅ Create ProfilePage
8. ✅ Create SessionHistoryPage
9. ✅ Logout functionality

### Phase 4 (LOW - Future)
10. ⏳ CameraPage - AI integration
11. ⏳ AITutorPage - Chat integration

---

## 🔧 Implementation Checklist

### AuthPage.tsx
- [ ] Add username field
- [ ] Connect to useAuth hook
- [ ] Implement error display
- [ ] Add loading spinner
- [ ] Form validation
- [ ] Password strength indicator

### Dashboard.tsx
- [ ] Fetch user stats on mount
- [ ] Display real username/level/XP
- [ ] Check for active session
- [ ] Create session button
- [ ] Timer controls (start/pause/stop)
- [ ] Complete session integration
- [ ] Refresh stats after completion

### AnalyticsPage.tsx
- [ ] Fetch daily stats (last 30 days)
- [ ] Fetch weekly/monthly trends
- [ ] Real chart data binding
- [ ] Calculate percentages
- [ ] Session quality metrics

### GardenPage.tsx
- [ ] Fetch garden state
- [ ] Display plant counts by rarity
- [ ] Fetch completed sessions
- [ ] Grow plant button
- [ ] Plant animation on grow
- [ ] Last plant timestamp

### NEW: LeaderboardPage.tsx
- [ ] Create page file
- [ ] Metric tabs (XP/Focus/Streak)
- [ ] Fetch leaderboard data
- [ ] Display top users
- [ ] Highlight current user
- [ ] Rank medals/badges
- [ ] User avatars/icons

### NEW: ProfilePage.tsx
- [ ] Create page file
- [ ] Display user info
- [ ] Edit profile form
- [ ] Change password section
- [ ] Delete account modal
- [ ] Logout button
- [ ] Stats summary

### NEW: SessionHistoryPage.tsx
- [ ] Create page file
- [ ] Fetch sessions
- [ ] Pagination controls
- [ ] Status filters
- [ ] Session cards
- [ ] Delete confirmation
- [ ] Details modal

### Sidebar.tsx
- [ ] Add Leaderboard link
- [ ] Add Profile link
- [ ] Add Sessions link
- [ ] Display user avatar/name
- [ ] Active route highlighting
- [ ] Logout option

---

## 🧪 Testing Checklist

After implementation, test:
- [ ] Register new account
- [ ] Login with username
- [ ] Login with email
- [ ] Wrong password error
- [ ] Duplicate username error
- [ ] Start focus session
- [ ] Complete session
- [ ] XP increases
- [ ] Level up works
- [ ] Grow plant
- [ ] View leaderboard
- [ ] Change profile
- [ ] View session history
- [ ] Logout
- [ ] Token refresh on page reload
- [ ] Protected routes redirect

---

## 📦 Package Dependencies

Already installed:
- ✅ react-router-dom
- ✅ framer-motion
- ✅ lucide-react

May need:
- recharts (for better charts)
- date-fns (for date formatting)

---

## 🎯 Summary

**Backend Features Available:**
- ✅ Authentication (register, login, logout, token refresh)
- ✅ User management (profile, stats, delete)
- ✅ Session tracking (create, complete, abandon, list, delete)
- ✅ Garden system (get, grow, reset)
- ✅ Statistics (daily, trends, leaderboards)
- ✅ Rate limiting
- ✅ CORS configured

**Frontend Status:**
- ✅ Basic UI/UX complete
- ❌ No backend integration yet
- ❌ Hardcoded mock data
- ❌ Missing: Leaderboard, Profile, Session History pages

**Next Steps:**
1. Update AuthPage with real API calls
2. Update Dashboard with session management
3. Create missing pages
4. Add navigation links
5. Test full user journey
