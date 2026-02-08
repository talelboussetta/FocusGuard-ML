import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Brain, Target, TrendingUp, Lightbulb } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ragAPI, getErrorMessage, type SourceDocument } from '../services/api'
import moonImage from '../assets/images/moonjpg.jpg'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: { section_title: string; score: number }[]
}

const AITutorPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI Focus Coach in FocusGuard. 👋 I'm here to help you improve your focus, overcome distractions, and build better study habits. Feel free to ask me anything about productivity, study techniques, time management, or just chat with me! What would you like to work on today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const quickPrompts = [
    { icon: Target, text: 'How can I improve my focus?', color: 'primary' },
    { icon: TrendingUp, text: 'Analyze my productivity trends', color: 'purple' },
    { icon: Brain, text: 'Why do I get distracted?', color: 'emerald' },
    { icon: Lightbulb, text: 'Give me a study technique', color: 'yellow' },
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
        sources: ragResponse.sources?.map((s: SourceDocument) => ({
          section_title: s.section_title,
          score: s.score,
        })),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${getErrorMessage(error)}. Please try again.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
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
              <span className="gradient-text">AI Moon</span>
            </h1>
            <p className="text-slate-400">
              Your lunar focus coach for clarity, consistency, and momentum
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
            <Card className="h-[500px] flex flex-col relative overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-800/50 text-slate-200'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <img src={moonImage} alt="" className="w-4 h-4 rounded-full opacity-90" />
                          <span className="text-xs font-semibold text-primary-300">AI Moon</span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <p className="text-xs text-slate-400 mb-2">Sources:</p>
                          {message.sources.map((source, idx) => (
                            <div key={idx} className="text-xs text-slate-500 ml-2">
                              • {source.section_title} ({Math.round(source.score * 100)}% match)
                            </div>
                          ))}
                        </div>
                      )}
                      <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-slate-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-slate-800/50 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={moonImage} alt="" className="w-4 h-4 rounded-full opacity-90" />
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Card variant="glass">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Brain className="text-purple-400" size={24} />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">
                    AI-Powered Insights
                  </h4>
                  <p className="text-sm text-slate-400">
                    Your AI Focus Coach analyzes your focus patterns, session history, and productivity metrics to provide personalized recommendations and evidence-based productivity tips.
                  </p>
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
