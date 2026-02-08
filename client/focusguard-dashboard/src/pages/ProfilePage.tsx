import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { userAPI, teamAPI } from '../services/api'
import { motion } from 'framer-motion'
import moonImage from '../assets/images/moonjpg.jpg'

const quotes = [
  "Focus is the bridge between goals and accomplishment.",
  "Small consistent actions build extraordinary results.",
  "Discipline is choosing between what you want now and what you want most.",
  "You don't have to be perfect to make progress.",
  "The best way to predict the future is to create it."
]

function quoteOfDay() {
  const today = new Date()
  const idx = Math.abs((today.getFullYear() + today.getMonth() + today.getDate()) % quotes.length)
  return quotes[idx]
}

const ProfilePage = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [teamInfo, setTeamInfo] = useState<any>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<string | null>(null)
  const [attempting, setAttempting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [badgeExpanded, setBadgeExpanded] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const wheelRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()
  const [readyVisible, setReadyVisible] = useState(false)
  // START popup is shown on the Dashboard after navigation

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const s = await userAPI.getStats()
        if (mounted) setStats(s)
      } catch (e) {
        // ignore
      }
      
      // Fetch team info from backend
      try {
        const team = await teamAPI.getMyTeam()
        if (mounted) {
          setTeamInfo({
            name: team.team_name,
            members: team.total_members,
            total_xp: team.total_xp
          })
          setTeamId(team.team_id)
        }
      } catch (e) {
        // User not in a team
        if (mounted) {
          setTeamInfo({ name: 'No team yet', members: 0, total_xp: 0 })
          setTeamId(null)
        }
      }
    })()

    return () => { mounted = false }
  }, [])

  

  const challenges = [
    '25m no-distraction sprint',
    'Two 25m back-to-back sessions',
    '60m deep-focus block',
    'Lucky break',
    'No phone for 45m focus'
  ]
  const colors = [
    'rgba(148,163,184,0.18)',
    'rgba(100,116,139,0.18)',
    'rgba(148,163,184,0.22)',
    'rgba(71,85,105,0.18)',
    'rgba(203,213,225,0.18)'
  ]

  const startChallenge = () => {
    if (!challenge || attempting) return

    // Show "Get readyy!!" message with pop animation (longer for emphasis)
    setReadyVisible(true)
    setTimeout(() => setReadyVisible(false), 1400)

    // start progress after a short lead
    setTimeout(() => {
      setAttempting(true)
      setProgress(0)
      const total = 3400 // progress duration
      const start = Date.now()
      const t = setInterval(() => {
        const elapsed = Date.now() - start
        const pct = Math.min(100, Math.round((elapsed / total) * 100))
        setProgress(pct)
        if (pct >= 100) {
        clearInterval(t)
        setAttempting(false)
        setShowConfetti(true)
        // keep confetti visible longer for better feedback
        setTimeout(() => setShowConfetti(false), 2600)

        // navigate to dashboard after a short breather so user sees success
        setTimeout(() => {
          navigate('/dashboard', { state: { showChallengeStart: true, challenge } })
        }, 1000)
        }
      }, 60)
    }, 600)
  }

  const spinWheel = () => {
    if (spinning) return
    const slices = challenges.length
    const spins = 6 + Math.floor(Math.random() * 4) // 6..9 spins
    const target = Math.floor(Math.random() * slices)
    const degreesPer = 360 / slices

    // compute current rotation normalized
    const current = ((rotation % 360) + 360) % 360

    // center angle of the target slice (measured from top clockwise)
    const centerAngle = target * degreesPer + degreesPer / 2

    // delta needed to bring that center to the top (0deg)
    const deltaToTop = (360 - ((centerAngle + current) % 360)) % 360

    // small safe jitter that won't push selection to neighbor (<= degreesPer/6)
    const jitter = (Math.random() * (degreesPer / 3)) - (degreesPer / 6)

    const final = spins * 360 + deltaToTop + jitter

    setSpinning(true)
    setSelectedIndex(null)
    setRotation(prev => prev + final)

    // after animation ends, set chosen index exactly to target
    setTimeout(() => {
      setSpinning(false)
      setSelectedIndex(target)
      setChallenge(challenges[target])
    }, 3400)
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="relative z-10 p-8 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-display font-bold">{user?.username || 'Your Profile'}</h1>
                <p className="text-slate-400">Level {user?.lvl || 1} • {user?.xp_points || 0} XP</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="glass rounded-xl p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Total Focus</div>
              <div className="text-2xl font-semibold text-slate-100">
                {stats?.total_focus_min != null ? `${stats.total_focus_min} min` : '--'}
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Sessions</div>
              <div className="text-2xl font-semibold text-slate-100">
                {stats?.total_sessions != null ? stats.total_sessions : '--'}
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Best Streak</div>
              <div className="text-2xl font-semibold text-slate-100">
                {stats?.best_streak != null ? stats.best_streak : '--'}
              </div>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-2">Quote of the Day</h2>
              <p className="text-slate-200 italic">"{quoteOfDay()}"</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-2">Your Team</h2>
              <p className="text-slate-400 mb-3">{teamInfo?.name || '—'}</p>
              {teamId ? (
                <>
                  <div className="flex gap-3 mb-3">
                    <div className="p-3 bg-slate-900 rounded-md">
                      <p className="text-sm text-slate-400">Members</p>
                      <p className="text-xl font-bold">{teamInfo?.members ?? 0}</p>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-md">
                      <p className="text-sm text-slate-400">Team XP</p>
                      <p className="text-xl font-bold">{teamInfo?.total_xp ?? 0}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/teams/${teamId}`)}
                    className="btn-primary w-full text-sm"
                  >
                    View Team
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => navigate('/teams')}
                  className="btn-secondary w-full text-sm mt-3"
                >
                  Join a Team
                </button>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-2">Focus Badge</h2>
              <p className="text-slate-400 mb-3">A playful metric: your recent focus strength visualized.</p>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`w-6 h-6 rounded-full ${stats && (i < Math.min(5, Math.round((stats?.total_focus_min || 0) / 60))) ? 'bg-nature-500' : 'bg-slate-800/50'}`} />
                  ))}
                </div>
                <div className="text-sm text-slate-400">{stats ? `${stats.total_focus_min} min total` : 'Loading...'}</div>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-2xl p-6">
            <h3 className="font-medium mb-2">Creative Corner</h3>
            <p className="text-slate-400">Here's a playful area: grow a plant, spin a micro-challenge, and earn fun badges for completing tasks.</p>

            <div className="mt-6 grid md:grid-cols-1 gap-4">
              <div className="p-4 bg-slate-900 rounded-xl flex flex-col md:flex-row items-center gap-6">
                <div className="w-full md:w-1/2 flex flex-col items-center">
                  <h4 className="font-medium mb-2">Spin the Challenge Wheel</h4>
                  <div className="relative flex items-center justify-center">
                    <div className="w-72 h-72 md:w-80 md:h-80 rounded-full flex items-center justify-center shadow-xl relative">
                      {/* Moon Wheel */}
                      <div
                        ref={wheelRef}
                        style={{
                          transform: `rotate(${rotation}deg)`,
                          transition: spinning ? 'transform 3.2s cubic-bezier(0.22, 0.8, 0.32, 1)' : 'transform 0.6s ease-out',
                          backgroundImage: `url(${moonImage})`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover',
                        }}
                        className="w-64 h-64 md:w-72 md:h-72 rounded-full relative overflow-hidden flex items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(15,23,42,0.6)]"
                      >
                        {/* subtle radial segment lines */}
                        <div
                          className="absolute inset-2 rounded-full"
                          style={{
                            backgroundImage: `conic-gradient(${challenges.map((_, i) => `rgba(255,255,255,0.22) ${(i * (100 / challenges.length)).toFixed(2)}% ${((i * (100 / challenges.length)) + 0.6).toFixed(2)}%, transparent ${((i * (100 / challenges.length)) + 0.6).toFixed(2)}% ${((i + 1) * (100 / challenges.length)).toFixed(2)}%`).join(', ')})`,
                            mixBlendMode: 'screen',
                          }}
                        />
                        <div className="absolute inset-10 rounded-full border border-white/5 shadow-[inset_0_0_18px_rgba(255,255,255,0.06)]" />
                        {/* inner glow ring */}
                        <div className="absolute inset-6 rounded-full border border-white/10 shadow-[inset_0_0_30px_rgba(255,255,255,0.08)]" />
                        {/* center circle */}
                     
                      </div>

                      {/* top pointer - bigger SVG arrow for clarity */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3/4 pointer-events-none">
                        <motion.div animate={spinning ? { y: [0, -8, 0] } : { y: 0 }} transition={{ duration: 0.9, repeat: spinning ? Infinity : 0 }}>
                          <svg width="44" height="28" viewBox="0 0 44 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_6px_10px_rgba(2,6,23,0.6)]">
                            <path d="M22 28L0 0H44L22 28Z" fill="#0ea5a4" />
                            <path d="M22 24L6 4H38L22 24Z" fill="rgba(255,255,255,0.06)" />
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                  {/* slice labels around wheel */}
                  <div className="mt-4 grid grid-cols-1 gap-2 text-sm w-full">
                    {challenges.map((c, i) => (
                      <div key={i} className={`px-3 py-1 rounded-md flex items-center justify-between ${selectedIndex === i ? 'ring-1 ring-primary-500' : 'bg-slate-800'}`} style={selectedIndex === i ? { background: `${colors[i % colors.length]}20` } : undefined}>
                        <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full" style={{ background: colors[i % colors.length] }} />
                          <span className="truncate">{c}</span>
                        </div>
                        {selectedIndex === i && <span className="text-xs text-slate-200">Selected</span>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button onClick={spinWheel} disabled={spinning} className={`btn-primary ${spinning ? 'opacity-60 cursor-not-allowed' : ''}`}>Spin 🎡</button>
                    <button onClick={() => { setSelectedIndex(null); setChallenge(null); setRotation(0); }} className="btn-secondary">Reset</button>
                  </div>
                </div>

                <div className="flex-1 w-full md:w-1/2">
                  <h4 className="font-medium mb-2">Selected Challenge</h4>
                  <div className="min-h-[56px] flex items-center justify-center bg-slate-800 rounded-md text-slate-200 mb-3">{challenge ?? (selectedIndex !== null ? challenges[selectedIndex] : 'Spin to pick a challenge')}</div>
                  <div className="flex gap-3">
                    <button onClick={startChallenge} disabled={!challenge || attempting} className={`btn-primary ${!challenge || attempting ? 'opacity-60 cursor-not-allowed' : ''}`}>Attempt</button>
                    <button onClick={() => { setChallenge(null); setSelectedIndex(null); setProgress(0); }} className="btn-secondary">Clear</button>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div style={{ width: `${progress}%` }} className="h-2 bg-primary-500" transition={{ ease: 'linear' }} />
                    </div>
                    {showConfetti && (
                      <div className="relative mt-3 h-16">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <motion.div key={i} initial={{ y: 0, opacity: 1 }} animate={{ y: -60 - Math.random() * 80, x: (Math.random() - 0.5) * 120, rotate: Math.random() * 360, opacity: 0 }} transition={{ duration: 1.6, delay: i * 0.04 }} className={`w-2 h-2 rounded-full absolute`} style={{ left: `${10 + i * 6}%`, background: ['#F97316', '#F43F5E', '#06B6D4', '#84CC16'][i % 4] }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

              {/* Ready message */}
              {readyVisible && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 left-[5rem] z-40 flex items-center justify-center pointer-events-auto">
                  <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" />
                  <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }} className="relative glass px-8 py-6 rounded-3xl text-center max-w-xl mx-4">
                    <div className="text-2xl font-semibold">Get readyy!!</div>
                    <div className="text-sm text-slate-400 mt-1">Preparing your challenge...</div>
                  </motion.div>
                </motion.div>
              )}

              {/* START popup */}
              {/* START popup is now shown by Dashboard after navigation */}

            <div className="mt-6 flex items-center gap-4">
              <div>
                <motion.div onClick={() => setBadgeExpanded(b => !b)} whileTap={{ scale: 0.96 }} className="p-4 bg-gradient-to-br from-nature-500 to-emerald-600 rounded-full text-white cursor-pointer">
                  <div className="text-2xl">🏅</div>
                </motion.div>
              </div>
              <div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm">
                  <div className="font-medium">Focus Badge</div>
                  <div className="text-slate-400">Click the badge to expand details.</div>
                </motion.div>
                {badgeExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 p-3 bg-slate-900 rounded-md">
                    <p className="text-sm text-slate-300">Streak boost: +5% XP for today. Recent strength: {stats ? `${Math.min(5, Math.round((stats.total_focus_min || 0) / 60))}/5` : '—'}</p>
                    <div className="mt-2 text-xs text-slate-400">Collect badges to unlock team trophies and cute plant skins.</div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage




