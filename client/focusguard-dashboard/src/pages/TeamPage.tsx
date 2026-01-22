import { motion } from 'framer-motion'
import { Users, PlusCircle, UserPlus } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const TeamPage = () => {
	const navigate = useNavigate()
	const { user } = useAuth()

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
								<h1 className="text-4xl font-display font-bold mb-2">
									Guilds & Teams
								</h1>
								<p className="text-slate-400 max-w-2xl">
									Bring your friends and study together in guilds — compete, share progress, and motivate each other to stay focused. Join an existing team or create a new one to get started.
								</p>
							</div>
							<div className="flex gap-3">
								<button
									onClick={() => navigate('/dashboard')}
									className="btn-secondary flex items-center space-x-2"
								>
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
									<motion.button
										onClick={() => {/* placeholder for join team action */}}
										className="btn-primary flex items-center space-x-2"
										whileHover={{ scale: 1.03 }}
										whileTap={{ scale: 0.97 }}
									>
										<UserPlus className="w-5 h-5" />
										<span>Join a Team</span>
									</motion.button>

									<motion.button
										onClick={() => {/* placeholder for create team action */}}
										className="btn-secondary flex items-center space-x-2"
										whileHover={{ scale: 1.03 }}
										whileTap={{ scale: 0.97 }}
									>
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
				</div>
			</div>
		</div>
	)
}

export default TeamPage
