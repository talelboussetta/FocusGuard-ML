import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Brain, Target, TrendingUp, Lightbulb, Trash2, MessageCircle, BookOpen, AlertCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ragAPI, getErrorMessage, type SourceDocument } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: SourceDocument[]
  modelUsed?: string
}

interface Conversation {
  id: string
  messages: Message[]
  title?: string
}

const AITutorPage = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey there! 👋 I'm Alex, your AI Focus Coach at FocusGuard. I'm here to help you build better focus habits and crush those productivity goals. Whether you're struggling with distractions, want study tips, or just need some motivation - I've got your back! What's on your mind today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const quickPrompts = [
    { icon: Target, text: 'How can I stay more focused?', color: 'primary' },
    { icon: TrendingUp, text: 'Show me my productivity stats', color: 'purple' },
    { icon: Brain, text: 'Why am I getting distracted?', color: 'emerald' },
    { icon: Lightbulb, text: 'Give me a study tip', color: 'yellow' },
  ]

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)
    setError(null)

    try {
      // Call RAG API
      const ragResponse = await ragAPI.query({
        query: input,
        top_k: 3,
        include_sources: true,
      })

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: ragResponse.answer,
        timestamp: new Date(),
        sources: ragResponse.sources || [],
        modelUsed: ragResponse.model_used,
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      
      // Check if it's a knowledge base issue
      const isKBEmpty = errorMessage.includes('knowledge base is empty') || 
                        errorMessage.includes('ingestion')
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isKBEmpty 
          ? "Oops! 😅 Looks like my knowledge base needs to be set up first. The backend team needs to run the knowledge ingestion script. In the meantime, I can still chat with you and offer general productivity advice - just keep in mind I won't have access to the full research library until that's done!"
          : `Hmm, I hit a snag there... 🤔 ${errorMessage}\n\nMind trying that again? If the problem keeps happening, the dev team would love to know about it!`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
      setError(errorMessage)
    } finally {
      setIsTyping(false)
    }
  }

  const toggleSourceExpansion = (messageId: string) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const handleQuickPrompt = (text: string) => {
    setInput(text)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-display font-bold mb-2">
              AI <span className="gradient-text">Tutor</span>
            </h1>
            <p className="text-slate-400">
              Your personal focus coach and productivity mentor
            </p>
          </motion.div>

          {/* Quick Prompts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
          >
            {quickPrompts.map((prompt, index) => (
              <Card
                key={index}
                hover
                className="cursor-pointer group"
                onClick={() => handleQuickPrompt(prompt.text)}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`p-3 bg-${prompt.color}-500/20 rounded-xl group-hover:scale-110 transition-transform`}>
                    <prompt.icon className={`text-${prompt.color}-400`} size={20} />
                  </div>
                  <p className="text-xs text-slate-300 font-medium">{prompt.text}</p>
                </div>
              </Card>
            ))}
          </motion.div>

          {/* Chat Container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-[500px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white'
                            : 'bg-slate-800/50 backdrop-blur-sm text-slate-200 border border-slate-700/50'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={16} className="text-primary-400" />
                            <span className="text-xs font-semibold text-primary-400">Alex • AI Coach</span>
                            {message.modelUsed && (
                              <span className="text-xs text-slate-500 ml-auto">
                                {message.modelUsed.split('/').pop()?.slice(0, 20)}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        
                        {/* Enhanced Source Display */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <button
                              onClick={() => toggleSourceExpansion(message.id)}
                              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                            >
                              <BookOpen size={14} />
                              <span>
                                {expandedSources.has(message.id) ? 'Hide' : 'Show'} {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
                              </span>
                            </button>
                            
                            {expandedSources.has(message.id) && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 space-y-2"
                              >
                                {message.sources.map((source, idx) => (
                                  <div key={idx} className="p-2 bg-slate-900/50 rounded-lg border border-slate-700/30">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <span className="text-xs font-medium text-slate-300">
                                        {source.section_title}
                                      </span>
                                      <span className="text-xs text-emerald-400 font-mono">
                                        {Math.round(source.score * 100)}%
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2">
                                      {source.content}
                                    </p>
                                    {source.category && (
                                      <span className="inline-block mt-1 text-xs text-purple-400">
                                        #{source.category}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </div>
                        )}
                        
                        <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-slate-500'}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-primary-400 animate-pulse" />
                        <span className="text-xs font-semibold text-primary-400">Alex is typing</span>
                        <div className="flex gap-1 ml-2">
                          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-800 p-4">
                <div className="flex gap-3">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about productivity..."
                    className="flex-1"
                  />
                  <Button onClick={handleSend} disabled={!input.trim() || isTyping}>
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Info Card */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <Card variant="glass" className="border-yellow-500/30 bg-yellow-500/5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-500/20 rounded-xl">
                    <AlertCircle className="text-yellow-400" size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">Heads up!</h4>
                    <p className="text-sm text-slate-400">{error}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Card variant="glass">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-primary-500/20 rounded-xl">
                  <Brain className="text-purple-400" size={24} />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">
                    Context-Aware AI Coaching
                  </h4>
                  <p className="text-sm text-slate-400 mb-2">
                    Alex analyzes your focus patterns, session history, and productivity trends to give you personalized, evidence-based advice - not generic tips.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full">
                      40+ Research Docs
                    </span>
                    <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded-full">
                      Your Stats Integrated
                    </span>
                    <span className="text-xs px-2 py-1 bg-primary-500/10 text-primary-400 rounded-full">
                      Human-like Responses
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default AITutorPage
