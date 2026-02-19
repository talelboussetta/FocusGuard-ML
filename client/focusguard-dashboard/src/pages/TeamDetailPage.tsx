import { motion } from 'framer-motion'
import { Users, Crown, MessageSquare, Send, ArrowLeft, Trophy, Target, Copy, Check, LogOut } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { teamAPI, getErrorMessage, type TeamDetail, type TeamMessage } from '../services/api'
import { useNotificationContext } from '../contexts/NotificationContext'

const TeamDetailPage = () => {
	const navigate = useNavigate()
	const { user } = useAuth()
	const { success } = useNotificationContext()
	const { teamId } = useParams<{ teamId: string }>()
	const [team, setTeam] = useState<TeamDetail | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [message, setMessage] = useState('')
	const [messages, setMessages] = useState<TeamMessage[]>([])
	const [sendingMessage, setSendingMessage] = useState(false)
	const [messageError, setMessageError] = useState<string | null>(null)
	const [copiedTeamId, setCopiedTeamId] = useState(false)
	const [leavingTeam, setLeavingTeam] = useState(false)
	const chatEndRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		loadTeamDetails()
		if (teamId) {
			loadMessages()
			// Poll for new messages every 5 seconds
			const interval = setInterval(() => {
				loadMessages(true)
			}, 5000)
			return () => clearInterval(interval)
		}
	}, [teamId])

	useEffect(() => {
		chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	const loadTeamDetails = async () => {
		if (!teamId) return
		setLoading(true)
		setError(null)
		try {
			const teamData = await teamAPI.getTeam(teamId)
			setTeam(teamData)
		} catch (err: any) {
			setError(getErrorMessage(err, 'Failed to load team details'))
		} finally {
			setLoading(false)
		}
	}

	const loadMessages = async (silent: boolean = false) => {
		if (!teamId) return
		try {
			const response = await teamAPI.getMessages(teamId, 50, 0)
			setMessages(response.messages.reverse()) // Reverse to show oldest first
			setMessageError(null)
		} catch (err: any) {
			if (!silent) {
				setMessageError(getErrorMessage(err, 'Failed to load messages'))
			}
		}
	}

	const sendMessage = async () => {
		if (!message.trim() || !user || !teamId || sendingMessage) return
		
		setSendingMessage(true)
		setMessageError(null)
		
		try {
			await teamAPI.sendMessage(teamId, {
				content: message.trim(),
				type: 'text'
			})
			setMessage('')
			// Reload messages to show the new one
			await loadMessages()
		} catch (err: any) {
			const errorMsg = getErrorMessage(err, 'Failed to send message')
			setMessageError(errorMsg)
			
			// Show user-friendly error for rate limiting
			if (errorMsg.includes('rate limit') || errorMsg.includes('too many messages')) {
				setMessageError('You are sending messages too quickly. Please wait a moment.')
			} else if (errorMsg.includes('duplicate')) {
				setMessageError('This message was already sent recently.')
			}
		} finally {
			setSendingMessage(false)
		}
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			sendMessage()
		}
	}

	const copyTeamId = async () => {
		if (!teamId) return
		try {
			await navigator.clipboard.writeText(teamId)
			setCopiedTeamId(true)
			success('Team ID copied! Share it with friends to join.', 2000)
			setTimeout(() => setCopiedTeamId(false), 2000)
		} catch (e) {
			// ignore clipboard failures
		}
	}

	const handleLeaveTeam = async () => {
		if (!teamId || !team) return
		
		const confirmed = window.confirm(
			`Are you sure you want to leave "${team.team_name}"? You can rejoin later if you have the Team ID.`
		)
		
		if (!confirmed) return
		
		setLeavingTeam(true)
		try {
			await teamAPI.leaveTeam(teamId)
			success('Successfully left the team', 2000)
			// Navigate back to teams page (will show join/create options)
			setTimeout(() => {
				navigate('/teams')
			}, 500)
		} catch (err: any) {
			const errorMsg = getErrorMessage(err, 'Failed to leave team')
			setError(errorMsg)
		} finally {
			setLeavingTeam(false)
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen flex">
				<Sidebar />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-slate-400">Loading team details...</div>
				</div>
			</div>
		)
	}

	if (error || !team) {
		return (
			<div className="min-h-screen flex">
				<Sidebar />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<div className="text-red-400 mb-4">{error || 'Team not found'}</div>
						<button onClick={() => navigate('/teams')} className="btn-primary">
							Back to Teams
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen flex">
			<Sidebar />

			<div className="flex-1 overflow-y-auto">
				{/* Animated Background */}
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

				{/* Content */}
				<div className="relative z-10 p-8 max-w-7xl mx-auto">
					{/* Header */}
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="mb-6"
					>
						<button
							onClick={() => navigate('/teams')}
							className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-4 transition"
						>
							<ArrowLeft className="w-5 h-5" />
							Back to Teams
						</button>					
					{/* Team ID Display with Copy */}
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="mb-4 p-4 glass rounded-xl border border-primary-500/20"
					>
						<div className="flex items-center justify-between gap-4">
							<div className="flex-1">
								<p className="text-xs text-slate-400 mb-1">Team ID (Share with friends)</p>
								<p className="text-sm font-mono text-slate-200 break-all">{teamId}</p>
							</div>
							<motion.button
								onClick={copyTeamId}
								className="btn-secondary flex items-center gap-2 whitespace-nowrap"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								{copiedTeamId ? (
									<>
										<Check className="w-4 h-4" />
										Copied!
									</>
								) : (
									<>
										<Copy className="w-4 h-4" />
										Copy ID
									</>
								)}
							</motion.button>
						</div>
					</motion.div>
											<div className="flex items-start justify-between">
							<div>
								<div className="flex items-center gap-3 mb-2">
									<Users className="w-10 h-10 text-primary-500" />
									<h1 className="text-4xl font-display font-bold">{team.team_name}</h1>
								</div>
								<p className="text-slate-400">
									{team.total_members} {team.total_members === 1 ? 'member' : 'members'} • {team.total_xp.toLocaleString()} Total XP • {team.total_sessions_completed} Sessions
								</p>							<motion.button
								onClick={handleLeaveTeam}
								disabled={leavingTeam}
								className="mt-4 btn-secondary flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<LogOut className="w-4 h-4" />
								{leavingTeam ? 'Leaving...' : 'Leave Team'}
							</motion.button>							</div>
						</div>
					</motion.div>

					{/* Main Content Grid */}
					<div className="grid lg:grid-cols-3 gap-6">
						{/* Team Members - Left Side (2 columns) */}
						<div className="lg:col-span-2">
							<motion.div
								initial={{ opacity: 0, scale: 0.98 }}
								animate={{ opacity: 1, scale: 1 }}
								className="glass rounded-2xl p-6"
							>
								<h2 className="text-2xl font-display font-semibold mb-4 flex items-center gap-2">
									<Trophy className="w-6 h-6 text-yellow-500" />
									Team Members
								</h2>
								<div className="space-y-3">
									{team.members.map((member, idx) => (
										<motion.div
											key={member.user_id}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: idx * 0.05 }}
											className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800/40 hover:border-primary-500/30 transition"
										>
											<div className="flex items-center gap-4">
												<div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
													{member.username.charAt(0).toUpperCase()}
												</div>
												<div>
													<div className="flex items-center gap-2">
														<p className="font-semibold text-lg">{member.username}</p>
														{idx === 0 && (
															<span title="Team Creator">
																<Crown className="w-4 h-4 text-yellow-500" />
															</span>
														)}
													</div>
													<p className="text-sm text-slate-400">
														Joined {new Date(member.joined_at).toLocaleDateString()}
													</p>
												</div>
											</div>
										</motion.div>
									))}
								</div>
							</motion.div>
						</div>

						{/* Team Chat - Right Side (1 column) */}
						<div className="lg:col-span-1">
							<motion.div
								initial={{ opacity: 0, scale: 0.98 }}
								animate={{ opacity: 1, scale: 1 }}
								className="glass rounded-2xl p-6 flex flex-col h-[600px]"
							>
								<h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
									<MessageSquare className="w-5 h-5 text-primary-500" />
									Team Chat
								</h2>
								
								{/* Chat Messages */}
								<div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
									{messages.length === 0 ? (
										<div className="flex items-center justify-center h-full text-slate-400 text-sm">
											No messages yet. Start the conversation!
										</div>
									) : (
										messages.map((msg) => {
											// Find sender username from team members
											const sender = team.members.find(m => m.user_id === msg.sender_id)
											const senderUsername = sender?.username || 'Unknown'
											const isOwnMessage = msg.sender_id === user?.user_id
											
											return (
												<div
													key={msg.message_id}
													className={`p-3 rounded-lg ${
														isOwnMessage
															? 'bg-primary-500/20 ml-4'
															: 'bg-slate-800/50 mr-4'
													}`}
												>
													<div className="flex items-center gap-2 mb-1">
														<span className="font-semibold text-sm">{senderUsername}</span>
														<span className="text-xs text-slate-500">
															{new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
														</span>
													</div>
													<p className="text-sm text-slate-200">{msg.content}</p>
												</div>
											)
										})
									)}
									<div ref={chatEndRef} />
								</div>

								{/* Error Message */}
								{messageError && (
									<div className="mb-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400 text-center">
										{messageError}
									</div>
								)}

								{/* Chat Input */}
								<div className="flex gap-2">
									<input
										type="text"
										value={message}
										onChange={(e) => setMessage(e.target.value)}
										onKeyPress={handleKeyPress}
										placeholder="Type a message..."
										disabled={sendingMessage}
										className="flex-1 p-3 rounded-lg bg-slate-900 border border-slate-800/40 focus:border-primary-500/50 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
									/>
									<button
										onClick={sendMessage}
										disabled={!message.trim() || sendingMessage}
										className={`btn-primary px-4 ${
											!message.trim() || sendingMessage ? 'opacity-50 cursor-not-allowed' : ''
										}`}
									>
										{sendingMessage ? (
											<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										) : (
											<Send className="w-5 h-5" />
										)}
									</button>
								</div>
								
								<p className="text-xs text-slate-500 mt-2 text-center">
									Messages refresh every 5 seconds
								</p>
							</motion.div>
						</div>
					</div>

					{/* Team Stats Cards */}
					<div className="grid md:grid-cols-3 gap-6 mt-6">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
							className="glass rounded-xl p-6"
						>
							<div className="flex items-center gap-3 mb-2">
								<Trophy className="w-8 h-8 text-yellow-500" />
								<h3 className="text-lg font-semibold">Total XP</h3>
							</div>
							<p className="text-3xl font-bold gradient-text">{team.total_xp.toLocaleString()}</p>
							<p className="text-sm text-slate-400 mt-1">Combined team experience</p>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
							className="glass rounded-xl p-6"
						>
							<div className="flex items-center gap-3 mb-2">
								<Target className="w-8 h-8 text-primary-500" />
								<h3 className="text-lg font-semibold">Sessions Completed</h3>
							</div>
							<p className="text-3xl font-bold gradient-text">{team.total_sessions_completed}</p>
							<p className="text-sm text-slate-400 mt-1">Total focus sessions</p>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 }}
							className="glass rounded-xl p-6"
						>
							<div className="flex items-center gap-3 mb-2">
								<Users className="w-8 h-8 text-emerald-500" />
								<h3 className="text-lg font-semibold">Team Size</h3>
							</div>
							<p className="text-3xl font-bold gradient-text">{team.total_members}</p>
							<p className="text-sm text-slate-400 mt-1">Active members</p>
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default TeamDetailPage
