import { motion, AnimatePresence } from 'framer-motion'
import { Users, PlusCircle, UserPlus } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

const TeamPage = () => {
	const navigate = useNavigate()
	const { user } = useAuth()
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [showJoinModal, setShowJoinModal] = useState(false)
	const [teamName, setTeamName] = useState('')
	const [teamIdInput, setTeamIdInput] = useState('')

	const submitCreate = () => {
		// placeholder: will call backend to create team and return uuid
		// for now just close modal and reset
		setShowCreateModal(false)
		setTeamName('')
	}

	const submitJoin = () => {
		// placeholder: will call backend to join by ID
		setShowJoinModal(false)
		setTeamIdInput('')
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
									<motion.button onClick={() => setShowJoinModal(true)} className="btn-primary flex items-center space-x-2" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
										<UserPlus className="w-5 h-5" />
										<span>Join a Team</span>
									</motion.button>

									<motion.button onClick={() => setShowCreateModal(true)} className="btn-secondary flex items-center space-x-2" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
										<PlusCircle className="w-5 h-5" />
										<span>Create a Team</span>
									</motion.button>
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
							<motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
								<div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
								<motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative glass rounded-2xl p-6 w-full max-w-md">
									<h3 className="text-lg font-semibold mb-2">Create a Team</h3>
									<p className="text-sm text-slate-400 mb-4">Choose a name for your team. After creation we'll provide the team's UUID.</p>
									<input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Team name" className="w-full p-3 rounded-md bg-slate-900 border border-slate-800/40 mb-4" />
									<div className="flex justify-end gap-3">
										<button onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
										<button onClick={submitCreate} className="btn-primary">Create</button>
									</div>
								</motion.div>
							</motion.div>
						)}

						{showJoinModal && (
							<motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
								<div className="absolute inset-0 bg-black/50" onClick={() => setShowJoinModal(false)} />
								<motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative glass rounded-2xl p-6 w-full max-w-md">
									<h3 className="text-lg font-semibold mb-2">Join a Team</h3>
									<p className="text-sm text-slate-400 mb-4">Enter the Team ID (UUID) you received from the team owner.</p>
									<input value={teamIdInput} onChange={e => setTeamIdInput(e.target.value)} placeholder="Team ID (UUID)" className="w-full p-3 rounded-md bg-slate-900 border border-slate-800/40 mb-4" />
									<div className="flex justify-end gap-3">
										<button onClick={() => setShowJoinModal(false)} className="btn-secondary">Cancel</button>
										<button onClick={submitJoin} className="btn-primary">Join</button>
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
