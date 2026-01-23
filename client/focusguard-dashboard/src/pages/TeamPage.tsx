import { motion, AnimatePresence } from 'framer-motion'
import { Users, PlusCircle, UserPlus, X, Copy } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useRef, useEffect } from 'react'
import { teamAPI, getErrorMessage } from '../services/api'

// Animation variants
const overlayVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
	exit: { opacity: 0 }
}

const cardVariants = {
	hidden: { opacity: 0, scale: 0.98, y: 8 },
	visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
	exit: { opacity: 0, scale: 0.98, y: 8 }
}

const successPulse = {
	hidden: { opacity: 0, scale: 0.98 },
	visible: { opacity: 1, scale: [1, 1.03, 1], transition: { duration: 0.6 } }
}

const TeamPage = () => {
	const navigate = useNavigate()
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [showJoinModal, setShowJoinModal] = useState(false)
	const [teamName, setTeamName] = useState('')
	const [teamIdInput, setTeamIdInput] = useState('')
	const [createdTeamId, setCreatedTeamId] = useState<string | null>(null)
	const [joinSuccess, setJoinSuccess] = useState(false)
	const [createSuccess, setCreateSuccess] = useState(false)
	const createInputRef = useRef<HTMLInputElement | null>(null)
	const joinInputRef = useRef<HTMLInputElement | null>(null)
	const [createFocused, setCreateFocused] = useState(false)
	const [joinFocused, setJoinFocused] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [currentTeamId, setCurrentTeamId] = useState<string | null>(null)

	useEffect(() => {
		// Check if user is already in a team
		const checkUserTeam = async () => {
			try {
				const team = await teamAPI.getMyTeam()
				setCurrentTeamId(team.team_id)
			} catch (err) {
				// User not in a team
				setCurrentTeamId(null)
			}
		}
		checkUserTeam()
	}, [])

	useEffect(() => {
		if (showCreateModal) {
			setTimeout(() => createInputRef.current?.focus(), 50)
		}
	}, [showCreateModal])

	useEffect(() => {
		if (showJoinModal) {
			setTimeout(() => joinInputRef.current?.focus(), 50)
		}
	}, [showJoinModal])

	const submitCreate = async () => {
		if (!teamName.trim()) return
		setLoading(true)
		setError(null)
		
		try {
			const team = await teamAPI.createTeam(teamName.trim())
			setCreatedTeamId(team.team_id)
			setCreateSuccess(true)
			// Navigate to team detail after short delay
			setTimeout(() => {
				navigate(`/teams/${team.team_id}`)
			}, 2000)
		} catch (err: any) {
			setError(getErrorMessage(err, 'Failed to create team'))
		} finally {
			setLoading(false)
		}
	}

	const copyCreatedId = async () => {
		if (!createdTeamId) return
		try {
			await navigator.clipboard.writeText(createdTeamId)
		} catch (e) {
			// ignore clipboard failures silently
		}
	}

	const submitJoin = async () => {
		if (!teamIdInput.trim()) return
		setLoading(true)
		setError(null)
		
		try {
			const team = await teamAPI.joinTeam(teamIdInput.trim())
			setJoinSuccess(true)
			setTimeout(() => {
				// Navigate to team detail page
				navigate(`/teams/${team.team_id}`)
			}, 1200)
		} catch (err: any) {
			setError(getErrorMessage(err, 'Failed to join team'))
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex">
			<Sidebar />

			<div className="flex-1 overflow-y-auto">
				<div className="fixed inset-0 z-0 pointer-events-none">
					<div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
					<motion.div
						className="absolute top-20 right-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"
						animate={{
							scale: [1, 1.15, 1],
							opacity: [0.15, 0.35, 0.15]
						}}
						transition={{ duration: 8, repeat: Infinity }}
					/>
				</div>

				<div className="relative z-10 p-8 max-w-5xl mx-auto">
					<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
						<div className="flex justify-between items-start">
							<div>
								<h1 className="text-4xl font-display font-bold mb-2">Guilds & Teams</h1>
								<p className="text-slate-400 max-w-2xl">Bring your friends and study together in guilds — compete, share progress, and motivate each other to stay focused. Join an existing team or create a new one to get started.</p>
							</div>
							<div className="flex gap-3">
								<button onClick={() => navigate('/dashboard')} className="btn-secondary flex items-center space-x-2">
									<Users className="w-5 h-5" />
									<span>Back</span>
								</button>
							</div>
						</div>
					</motion.div>

					<motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="glass rounded-2xl p-8">
						<div className="flex flex-col md:flex-row items-center justify-between gap-6">
							<div className="flex-1">
								<h2 className="text-2xl font-display font-semibold mb-2">Study together, level up together</h2>
								<p className="text-slate-400 mb-4">Form guilds to create friendly competition and collaborate during study sessions. Teams can earn collective XP and climb the leaderboard.</p>
								<div className="flex gap-3">
									{currentTeamId ? (
										<motion.button 
											onClick={() => navigate(`/teams/${currentTeamId}`)} 
											className="btn-primary flex items-center space-x-2" 
											whileHover={{ scale: 1.03 }} 
											whileTap={{ scale: 0.97 }}
										>
											<Users className="w-5 h-5" />
											<span>View My Team</span>
										</motion.button>
									) : (
										<>
											<motion.button onClick={() => setShowJoinModal(true)} className="btn-primary flex items-center space-x-2" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
												<UserPlus className="w-5 h-5" />
												<span>Join a Team</span>
											</motion.button>

											<motion.button onClick={() => setShowCreateModal(true)} className="btn-secondary flex items-center space-x-2" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
												<PlusCircle className="w-5 h-5" />
												<span>Create a Team</span>
											</motion.button>
										</>
									)}
								</div>
							</div>

							<div className="w-full md:w-1/3">
								<div className="p-4 bg-slate-900 rounded-xl border border-slate-800/50">
									<h3 className="text-sm text-slate-300 font-medium mb-2">Quick Tips</h3>
									<ul className="text-slate-400 text-sm space-y-2">
										<li>- Invite friends via profile → Teams (coming soon)</li>
										<li>- Coordinate session times for group focus</li>
										<li>- Earn team XP when members complete sessions</li>
									</ul>
								</div>
							</div>
						</div>
					</motion.div>

					{/* Modals */}
					<AnimatePresence>
						{showCreateModal && (
							<motion.div className="fixed inset-0 z-50 flex items-center justify-center" variants={overlayVariants} initial="hidden" animate="visible" exit="exit">
								<motion.div className="absolute inset-0 bg-black/50" variants={overlayVariants} onClick={() => { setShowCreateModal(false); setCreatedTeamId(null); setCreateSuccess(false); setError(null); }} />
								<motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="relative glass rounded-2xl p-6 w-full max-w-md">
									<button aria-label="Close" onClick={() => { setShowCreateModal(false); setCreatedTeamId(null); setCreateSuccess(false); setError(null); }} className="absolute top-3 right-3 text-slate-400 hover:text-slate-200">
										<X className="w-5 h-5" />
									</button>
									<h3 className="text-lg font-semibold mb-2">Create a Team</h3>
									<p className="text-sm text-slate-400 mb-4">Choose a name for your team. After creation we'll provide the team's UUID.</p>

									{error && (
										<div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
											{error}
										</div>
									)}

									{!createSuccess ? (
										<>
											<motion.div animate={createFocused ? { boxShadow: '0 8px 24px rgba(59,130,246,0.06)' } : { boxShadow: 'none' }} transition={{ duration: 0.18 }} className="mb-4 rounded-md">
												<input ref={createInputRef} value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Team name" onFocus={() => setCreateFocused(true)} onBlur={() => setCreateFocused(false)} className="w-full p-3 rounded-md bg-slate-900 border border-slate-800/40" />
											</motion.div>
											<div className="flex justify-end gap-3">
												<motion.button whileHover={{ scale: 1.02 }} onClick={() => { setShowCreateModal(false); setTeamName(''); setError(null); }} className="btn-secondary">Cancel</motion.button>
												<motion.button whileTap={{ scale: 0.98 }} onClick={submitCreate} disabled={!teamName.trim() || loading} className={`btn-primary ${(!teamName.trim() || loading) ? 'opacity-60 cursor-not-allowed' : ''}`}>{loading ? 'Creating...' : 'Create'}</motion.button>
											</div>
										</>
									) : (
										<motion.div initial="hidden" animate="visible" variants={successPulse} className="space-y-3">
											<div className="p-3 bg-slate-900 rounded-md border border-slate-800/40">
												<p className="text-sm text-slate-300 break-all">{createdTeamId}</p>
											</div>
											<div className="flex justify-between items-center">
												<p className="text-sm text-slate-400">Team created (UUID placeholder). Copy and share with members.</p>
												<div className="flex items-center gap-2">
													<motion.button whileHover={{ scale: 1.03 }} onClick={copyCreatedId} className="btn-secondary flex items-center gap-2"><Copy className="w-4 h-4" /> Copy</motion.button>
													<motion.button whileHover={{ scale: 1.03 }} onClick={() => { setShowCreateModal(false); setCreatedTeamId(null); setCreateSuccess(false); setTeamName(''); setError(null); }} className="btn-primary">Done</motion.button>
												</div>
											</div>
										</motion.div>
									)}
								</motion.div>
							</motion.div>
						)}

						{showJoinModal && (
							<motion.div className="fixed inset-0 z-50 flex items-center justify-center" variants={overlayVariants} initial="hidden" animate="visible" exit="exit">
								<motion.div className="absolute inset-0 bg-black/50" variants={overlayVariants} onClick={() => { setShowJoinModal(false); setJoinSuccess(false); setTeamIdInput(''); setError(null); }} />
								<motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="relative glass rounded-2xl p-6 w-full max-w-md">
									<button aria-label="Close" onClick={() => { setShowJoinModal(false); setJoinSuccess(false); setTeamIdInput(''); setError(null); }} className="absolute top-3 right-3 text-slate-400 hover:text-slate-200">
										<X className="w-5 h-5" />
									</button>
									<h3 className="text-lg font-semibold mb-2">Join a Team</h3>
									<p className="text-sm text-slate-400 mb-4">Enter the Team ID (UUID) you received from the team owner.</p>
									
									{error && (
										<div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
											{error}
										</div>
									)}
									
									<motion.div animate={joinFocused ? { boxShadow: '0 8px 24px rgba(99,102,241,0.06)' } : { boxShadow: 'none' }} transition={{ duration: 0.18 }} className="mb-4 rounded-md">
										<input ref={joinInputRef} value={teamIdInput} onChange={e => setTeamIdInput(e.target.value)} placeholder="Team ID (UUID)" onFocus={() => setJoinFocused(true)} onBlur={() => setJoinFocused(false)} className="w-full p-3 rounded-md bg-slate-900 border border-slate-800/40" />
									</motion.div>

									<div className="flex justify-between items-center">
										<div className="flex gap-3">
											<motion.button whileHover={{ scale: 1.02 }} onClick={() => { setShowJoinModal(false); setTeamIdInput(''); setError(null); }} className="btn-secondary">Cancel</motion.button>
											<motion.button whileTap={{ scale: 0.98 }} onClick={submitJoin} disabled={!teamIdInput.trim() || loading} className={`btn-primary ${(!teamIdInput.trim() || loading) ? 'opacity-60 cursor-not-allowed' : ''}`}>{loading ? 'Joining...' : 'Join'}</motion.button>
										</div>
										{joinSuccess && (
											<motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: [1.02, 0.98, 1], opacity: 1 }} transition={{ duration: 0.6 }} className="text-sm text-nature-400">Joined ✔</motion.div>
										)}
									</div>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>

				</div>
			</div>
		</div>
	)
}

export default TeamPage
