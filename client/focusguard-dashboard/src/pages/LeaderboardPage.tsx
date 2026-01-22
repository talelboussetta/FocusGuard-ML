import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Trophy, Medal, Crown, Loader2, AlertCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { statsAPI, getErrorMessage } from '../services/api'
import type { LeaderboardEntry } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const LeaderboardPage = () => {
  const { user } = useAuth()
  const [metric, setMetric] = useState<'xp' | 'sessions' | 'focus_time' | 'streak'>('xp')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [viewMode, setViewMode] = useState<'users' | 'teams'>('users')
  const [teamLeaderboard, setTeamLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamFilter, setTeamFilter] = useState<string>('')
  const [showTeamInput, setShowTeamInput] = useState(false)

  useEffect(() => {
    if (viewMode === 'users') loadLeaderboard()
    else loadTeamLeaderboard()
  }, [metric, teamFilter, viewMode])

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await statsAPI.getLeaderboard(metric, 20, teamFilter || undefined)
      setLeaderboard(data.leaderboard)
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load leaderboard'))
    } finally {
      setLoading(false)
    }
  }

  const loadTeamLeaderboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await statsAPI.getTeamLeaderboard(metric, 20)
      setTeamLeaderboard(data.leaderboard)
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load team leaderboard'))
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-300" />
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />
    return <span className="text-slate-400 font-bold">#{rank}</span>
  }

  const formatValue = (value: number, type: string) => {
    if (type === 'focus_time') {
      const hours = Math.floor(value / 60)
      const mins = value % 60
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }
    return value.toLocaleString()
  }

  const getMetricLabel = () => {
    if (metric === 'xp') return 'XP'
    if (metric === 'sessions') return 'Sessions'
    if (metric === 'streak') return 'Streak'
    return 'Focus Time'
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          <motion.div
            className="absolute top-20 left-20 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 p-10 max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-12 h-12 text-yellow-400" />
              <h1 className="text-5xl font-display font-bold gradient-text">Leaderboard</h1>
            </div>
            <p className="text-slate-400">
              See how you rank against other Focus Warriors
            </p>
          </motion.div>

          {/* Controls: metrics, view toggle and team filter (tidy) */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-800/30 p-1 rounded-xl">
                {[
                  { value: 'xp', label: 'XP' },
                  { value: 'sessions', label: 'Sessions' },
                  { value: 'focus_time', label: 'Focus' },
                  { value: 'streak', label: 'Streak' },
                ].map(o => (
                  <button key={o.value} onClick={() => setMetric(o.value as any)} className={`px-4 py-3 text-base rounded-lg font-medium transition ${metric === o.value ? 'bg-primary-500 text-white shadow' : 'text-slate-300 hover:bg-white/5'}`}>
                    {o.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('users')} className={`px-4 py-3 rounded-lg text-base font-medium ${viewMode === 'users' ? 'bg-primary-500 text-white' : 'glass text-slate-300'}`}>Users</button>
                <button onClick={() => setViewMode('teams')} className={`px-4 py-3 rounded-lg text-base font-medium ${viewMode === 'teams' ? 'bg-primary-500 text-white' : 'glass text-slate-300'}`}>Teams</button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {viewMode === 'teams' && (
                <>
                  {showTeamInput ? (
                    <div className="flex items-center gap-2">
                      <input value={teamFilter} onChange={e => setTeamFilter(e.target.value)} placeholder="Team ID or name" className="px-3 py-2 rounded-md bg-slate-900 border border-slate-800/40 text-sm" />
                      <button onClick={() => { setTeamFilter(''); setShowTeamInput(false); }} className="btn-secondary text-sm">Clear</button>
                    </div>
                  ) : (
                    <button onClick={() => setShowTeamInput(true)} className="btn-secondary text-sm">Filter Team</button>
                  )}
                </>
              )}

              {teamFilter && <div className="text-sm text-slate-400">Showing: <span className="text-slate-200 font-medium ml-2">{teamFilter}</span></div>}
            </div>
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300">{error}</p>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          )}

          {/* Leaderboard List */}
          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              {viewMode === 'users' ? (
                leaderboard.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    No data available yet. Be the first to climb the ranks!
                  </div>
                ) : (
                  leaderboard.map((entry, index) => {
                    const isCurrentUser = entry.user_id === user?.user_id
                    
                    return (
                      <motion.div
                        key={entry.user_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`glass rounded-xl p-7 flex items-center gap-6 ${
                          isCurrentUser ? 'ring-2 ring-primary-500 bg-primary-500/5' : ''
                        }`}
                      >
                        {/* Rank */}
                          <div className="flex-shrink-0 w-16 flex items-center justify-center">
                            {getRankIcon(entry.rank)}
                          </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-xl">
                              {entry.username}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-primary-400 font-normal">
                                  (You)
                                </span>
                              )}
                            </p>
                            {entry.lvl && (
                              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                                Level {entry.lvl}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <div className="text-4xl font-bold gradient-text">
                            {formatValue(entry.value, metric)}
                          </div>
                          <div className="text-xs text-slate-400">{getMetricLabel()}</div>
                        </div>
                      </motion.div>
                    )
                  })
                )
              ) : (
                teamLeaderboard.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">No team data available yet.</div>
                ) : (
                  teamLeaderboard.map((t, idx) => (
                      <motion.div key={t.team_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="glass rounded-xl p-7 flex items-center gap-6">
                        <div className="flex-shrink-0 w-16 flex items-center justify-center">{getRankIcon(t.rank)}</div>
                        <div className="flex-1">
                          <p className="font-semibold text-xl">{t.team_name}</p>
                          <div className="text-sm text-slate-400">{t.members ? `${t.members} members` : 'Members: —'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold gradient-text">{formatValue(t.value, metric)}</div>
                          <div className="text-xs text-slate-400">{getMetricLabel()}</div>
                        </div>
                      </motion.div>
                    ))
                )
              )}
            </motion.div>
          )}

          {/* Your Rank Card */}
          {!loading && !error && user && leaderboard.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 glass rounded-xl p-6"
            >
              <h3 className="text-lg font-display font-semibold mb-3">Your Rank</h3>
              {leaderboard.find(e => e.user_id === user.user_id) ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getRankIcon(leaderboard.find(e => e.user_id === user.user_id)!.rank)}
                    <div>
                      <p className="font-semibold">{user.username}</p>
                      <p className="text-sm text-slate-400">Level {user.lvl}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold gradient-text">
                      {formatValue(
                        leaderboard.find(e => e.user_id === user.user_id)!.value,
                        metric
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{getMetricLabel()}</div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400">
                  Complete more sessions to appear on the leaderboard!
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage
