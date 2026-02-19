import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Trophy, Medal, Crown, Loader2, AlertCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { statsAPI, teamAPI, getErrorMessage } from '../services/api'
import type { LeaderboardEntry, UserTeam } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const LeaderboardPage = () => {
  const { user } = useAuth()
  const [metric, setMetric] = useState<'xp' | 'sessions' | 'focus_time' | 'streak'>('xp')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [viewMode, setViewMode] = useState<'users' | 'teams'>('users')
  const [teamLeaderboard, setTeamLeaderboard] = useState<any[]>([])
  const [myTeam, setMyTeam] = useState<UserTeam | null>(null)
  const [myTeamRank, setMyTeamRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamFilter, setTeamFilter] = useState<string>('')
  const [showTeamInput, setShowTeamInput] = useState(false)

  useEffect(() => {
    if (viewMode === 'users') {
      loadLeaderboard()
    } else {
      loadTeamLeaderboard()
      loadMyTeam()
    }
  }, [metric, teamFilter, viewMode])

  useEffect(() => {
    if (viewMode !== 'teams') return
    if (!myTeam || teamLeaderboard.length === 0) {
      setMyTeamRank(null)
      return
    }
    const found = teamLeaderboard.find((t: any) => t.team_id === myTeam.team_id)
    setMyTeamRank(found ? found.rank : null)
  }, [viewMode, myTeam, teamLeaderboard])

  const loadMyTeam = async () => {
    try {
      const team = await teamAPI.getMyTeam()
      setMyTeam(team)
    } catch {
      setMyTeam(null)
    }
  }

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
      if (myTeam) {
        const found = data.leaderboard.find((t: any) => t.team_id === myTeam.team_id)
        setMyTeamRank(found ? found.rank : null)
      } else {
        setMyTeamRank(null)
      }
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
              scale: [1, 1.1, 1],
              opacity: [0.08, 0.18, 0.08],
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
              <Trophy className="w-10 h-10 text-slate-300" />
              <h1 className="text-4xl font-display font-bold text-slate-100">Leaderboard</h1>
            </div>
            <p className="text-slate-400">
              See how you rank against other Focus Warriors
            </p>
          </motion.div>

          {/* Controls: metrics, view toggle and team filter (tidy) */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800/70 p-1 rounded-lg">
                {[
                  { value: 'xp', label: 'XP' },
                  { value: 'sessions', label: 'Sessions' },
                  { value: 'focus_time', label: 'Focus' },
                  { value: 'streak', label: 'Streak' },
                ].map(o => (
                  <button key={o.value} onClick={() => setMetric(o.value as any)} className={`px-3 py-2 text-sm rounded-md font-medium transition ${metric === o.value ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800/60'}`}>
                    {o.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('users')} className={`px-3 py-2 rounded-md text-sm font-medium ${viewMode === 'users' ? 'bg-slate-700 text-white' : 'bg-slate-900/60 text-slate-300 border border-slate-800/70'}`}>Users</button>
                <button onClick={() => setViewMode('teams')} className={`px-3 py-2 rounded-md text-sm font-medium ${viewMode === 'teams' ? 'bg-slate-700 text-white' : 'bg-slate-900/60 text-slate-300 border border-slate-800/70'}`}>Teams</button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {viewMode === 'teams' && (
                <>
                  {showTeamInput ? (
                    <div className="flex items-center gap-2">
                      <input value={teamFilter} onChange={e => setTeamFilter(e.target.value)} placeholder="Team ID or name" className="px-3 py-2 rounded-md bg-slate-900/70 border border-slate-800/70 text-sm text-slate-200" />
                      <button onClick={() => { setTeamFilter(''); setShowTeamInput(false); }} className="px-3 py-2 rounded-md text-sm bg-slate-900/70 border border-slate-800/70 text-slate-300 hover:bg-slate-900/90">Clear</button>
                    </div>
                  ) : (
                    <button onClick={() => setShowTeamInput(true)} className="px-3 py-2 rounded-md text-sm bg-slate-900/70 border border-slate-800/70 text-slate-300 hover:bg-slate-900/90">Filter Team</button>
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
              {/* Top 3 Strip */}
              {viewMode === 'users' && leaderboard.length > 0 && (
                <div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">Top 3</div>
                  <div className="grid md:grid-cols-3 gap-3">
                    {leaderboard.slice(0, 3).map((entry) => (
                      <div key={entry.user_id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-800/60 bg-slate-950/60">
                        <div className="flex items-center gap-2">
                          {getRankIcon(entry.rank)}
                          <span className="text-sm text-slate-200 font-medium">{entry.username}</span>
                        </div>
                        <span className="text-sm text-slate-300 font-semibold">{formatValue(entry.value, metric)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewMode === 'teams' && teamLeaderboard.length > 0 && (
                <div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">Top 3 Teams</div>
                  <div className="grid md:grid-cols-3 gap-3">
                    {teamLeaderboard.slice(0, 3).map((entry) => (
                      <div key={entry.team_id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-800/60 bg-slate-950/60">
                        <div className="flex items-center gap-2">
                          {getRankIcon(entry.rank)}
                          <span className="text-sm text-slate-200 font-medium">{entry.team_name}</span>
                        </div>
                        <span className="text-sm text-slate-300 font-semibold">{formatValue(entry.value, metric)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewMode === 'users' ? (
                leaderboard.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    No data available yet. Be the first to climb the ranks!
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800/70 bg-slate-900/60">
                    <div className="sticky top-0 z-10 grid grid-cols-4 text-xs uppercase tracking-wider text-slate-500 px-4 py-3 bg-slate-950/80 border-b border-slate-800/70">
                      <span>Rank</span>
                      <span>Name</span>
                      <span>Level</span>
                      <span className="text-right">{getMetricLabel()}</span>
                    </div>
                    {leaderboard.map((entry, index) => {
                    const isCurrentUser = entry.user_id === user?.user_id
                    
                    return (
                      <motion.div
                        key={entry.user_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`grid grid-cols-4 items-center px-4 py-3 text-sm border-b border-slate-800/60 ${
                          isCurrentUser ? 'ring-1 ring-slate-500/70' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {getRankIcon(entry.rank)}
                        </div>
                        <div className="text-slate-200 font-medium">
                          {entry.username}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-slate-400 font-normal">(You)</span>
                          )}
                        </div>
                        <div className="text-slate-400">
                          {entry.lvl ? `Level ${entry.lvl}` : '--'}
                        </div>
                        <div className="text-right text-slate-100 font-semibold">
                          {formatValue(entry.value, metric)}
                        </div>
                      </motion.div>
                    )
                    })}
                  </div>
                )
              ) : (
                teamLeaderboard.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">No team data available yet.</div>
                ) : (
                  <div className="rounded-xl border border-slate-800/70 bg-slate-900/60">
                    <div className="sticky top-0 z-10 grid grid-cols-4 text-xs uppercase tracking-wider text-slate-500 px-4 py-3 bg-slate-950/80 border-b border-slate-800/70">
                      <span>Rank</span>
                      <span>Team</span>
                      <span>Members</span>
                      <span className="text-right">{getMetricLabel()}</span>
                    </div>
                    {teamLeaderboard.map((t, idx) => (
                      <motion.div
                        key={t.team_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="grid grid-cols-4 items-center px-4 py-3 text-sm border-b border-slate-800/60"
                      >
                        <div className="flex items-center gap-2">
                          {getRankIcon(t.rank)}
                        </div>
                        <div className="text-slate-200 font-medium">{t.team_name}</div>
                        <div className="text-slate-400">{t.members ? `${t.members}` : '--'}</div>
                        <div className="text-right text-slate-100 font-semibold">
                          {formatValue(t.value, metric)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
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
              className="mt-8 rounded-xl p-6 border border-slate-800/70 bg-slate-900/60"
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
                    <div className="text-2xl font-bold text-slate-100">
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

          {/* Your Team Card */}
          {!loading && !error && viewMode === 'teams' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 rounded-xl p-6 border border-slate-800/70 bg-slate-900/60"
            >
              <h3 className="text-lg font-display font-semibold mb-3">Your Team</h3>
              {myTeam ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-slate-100 font-semibold">{myTeam.team_name}</div>
                    <div className="text-sm text-slate-400">
                      {myTeam.total_members} members
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Rank</div>
                    <div className="text-2xl font-bold text-slate-100">
                      {myTeamRank ? `#${myTeamRank}` : '--'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-slate-400 text-sm">
                    You're not in a team yet. Join or create one to see your team rank.
                  </p>
                  <button
                    onClick={() => window.location.assign('/teams')}
                    className="px-3 py-2 rounded-md text-sm bg-slate-900/70 border border-slate-800/70 text-slate-300 hover:bg-slate-900/90"
                  >
                    Go to Teams
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage
