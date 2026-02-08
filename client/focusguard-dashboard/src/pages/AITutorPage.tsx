import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Brain, Target, TrendingUp, Lightbulb, BookOpen, AlertCircle, Copy, Check, RotateCcw, MessageSquare, Trash2, Menu, X, Plus, Edit2, ChevronDown, ChevronUp } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { conversationAPI, getErrorMessage, type SourceDocument, type Conversation, type ConversationMessage } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: SourceDocument[]
  modelUsed?: string
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
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      setLoadingConversations(true)
      const response = await conversationAPI.list(0, 50)
      setConversations(response.conversations)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoadingConversations(false)
    }
  }

  const loadConversation = async (conversationId: string) => {
    try {
      const conversation = await conversationAPI.get(conversationId)
      
      // Convert backend messages to UI messages
      const uiMessages: Message[] = conversation.messages.map((msg: ConversationMessage) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        sources: msg.sources_used ? JSON.parse(msg.sources_used) : undefined,
        modelUsed: msg.model_used || undefined,
      }))
      
      setMessages(uiMessages)
      setCurrentConversationId(conversationId)
      setError(null)
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent loading the conversation when clicking delete
    
    if (!confirm('Delete this conversation? This cannot be undone.')) return
    
    try {
      await conversationAPI.delete(conversationId)
      
      // Remove from list
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      
      // If we deleted the current conversation, start a new one
      if (currentConversationId === conversationId) {
        startNewChat()
      }
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const startNewChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Fresh start! 🎯 I'm ready to help you tackle new challenges. What would you like to focus on today?",
        timestamp: new Date(),
      },
    ])
    setCurrentConversationId(null)
    setError(null)
    // Close sidebar on mobile after starting new chat
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  const startEditingConversation = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingConversationId(conversation.id)
    setEditingTitle(conversation.title || '')
  }

  const saveConversationTitle = async (conversationId: string) => {
    if (!editingTitle.trim()) {
      setEditingConversationId(null)
      return
    }

    try {
      // Update locally immediately for responsive feel
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, title: editingTitle } : c
      ))
      setEditingConversationId(null)
      
      // Note: Conversation title updates are local-only for now
      // Future: Add API endpoint conversationAPI.update(conversationId, { title })
    } catch (error) {
      console.error('Failed to update conversation title:', error)
    }
  }

  const cancelEditingTitle = () => {
    setEditingConversationId(null)
    setEditingTitle('')
  }

  const quickPrompts = [
    { icon: Target, text: 'How can I stay more focused?', color: 'primary' },
    { icon: TrendingUp, text: 'Show me my productivity stats', color: 'purple' },
    { icon: Brain, text: 'Why am I getting distracted?', color: 'emerald' },
    { icon: Lightbulb, text: 'Give me a study tip', color: 'yellow' },
  ]

  const handleQuickPrompt = (text: string) => {
    setInput(text)
    setTimeout(() => handleSend(), 100)
  }

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
      // Call Conversation API (with or without conversation ID)
      const response = await conversationAPI.query({
        query: input,
        conversation_id: currentConversationId || undefined,
        top_k: 3,
        include_sources: true,
      })

      // If this was a new conversation, update the ID and add to sidebar immediately
      if (!currentConversationId) {
        setCurrentConversationId(response.conversation_id)
        
        // Add optimistic conversation to sidebar
        const newConversation: Conversation = {
          id: response.conversation_id,
          user_id: user?.username || '',
          title: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          message_count: 2, // User + Assistant
        }
        setConversations(prev => [newConversation, ...prev])
      } else {
        // Update message count for existing conversation
        setConversations(prev => prev.map(c => 
          c.id === currentConversationId 
            ? { ...c, message_count: c.message_count + 2, updated_at: new Date().toISOString() }
            : c
        ))
      }

      const aiMessage: Message = {
        id: response.message_id,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources || [],
        modelUsed: response.model_used,
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      
      // Check if it's a knowledge base issue
      const isKBEmpty = errorMessage.includes('knowledge base is empty') || 
                        errorMessage.includes('ingestion')
      
      // Check if it's a warmup issue
      const isWarmingUp = errorMessage.includes('starting up') || 
                          errorMessage.includes('initialization') ||
                          errorMessage.includes('currently starting')
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isWarmingUp
          ? "Hey! I'm still warming up (loading AI models). ⏳ This takes about 30-60 seconds on first startup. Give me a moment and try again!"
          : isKBEmpty 
            ? "Hmm, looks like my knowledge base isn't set up yet. 📚 I need some documents to learn from first. Have your admin run the knowledge ingestion script, and I'll be ready to help!"
            : `Oops! I hit a snag: ${errorMessage}. Mind trying that again? 🔄`,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMsg])
      setError(errorMessage)
    } finally {
      setIsTyping(false)
    }
  }

  const toggleSourceExpansion = (messageId: string) => {
    setExpandedSources((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const copyToClipboard = async (messageId: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedMessageId(messageId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatConversationDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="min-h-screen flex relative">
      <Sidebar />
      
      {/* Mobile Overlay */}
      {sidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Conversation History Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed lg:relative inset-y-0 left-16 lg:left-0 w-80 lg:w-80 transition-transform duration-300 border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm flex flex-col overflow-hidden z-50 lg:z-auto lg:translate-x-0`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-primary-400" />
            <h2 className="font-semibold text-white">Conversations</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 hover:bg-slate-800 rounded transition-colors lg:hidden"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 border-b border-slate-800">
          <Button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            New Conversation
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loadingConversations ? (
            // Loading skeleton
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-3 rounded-lg bg-slate-800/30 animate-pulse">
                  <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-700/30 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            // Enhanced empty state
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="p-4 bg-primary-500/10 rounded-2xl mb-4">
                <MessageSquare size={32} className="text-primary-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">No conversations yet</h3>
              <p className="text-slate-500 text-sm text-center mb-4">
                Start chatting with Alex to build your conversation history
              </p>
              <Button
                onClick={startNewChat}
                className="flex items-center gap-2"
                size="sm"
              >
                <Plus size={16} />
                Start Conversation
              </Button>
            </div>
          ) : (
            conversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg cursor-pointer group transition-all ${
                  currentConversationId === conversation.id
                    ? 'bg-primary-500/20 border border-primary-500/30'
                    : 'hover:bg-slate-800/50 border border-transparent'
                }`}
                onClick={() => {
                  if (editingConversationId !== conversation.id) {
                    loadConversation(conversation.id)
                    // Close sidebar on mobile after selecting conversation
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false)
                    }
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editingConversationId === conversation.id ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              saveConversationTitle(conversation.id)
                            } else if (e.key === 'Escape') {
                              cancelEditingTitle()
                            }
                          }}
                          onBlur={() => saveConversationTitle(conversation.id)}
                          className="w-full bg-slate-900 border border-primary-500 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <p className="text-sm text-white font-medium truncate flex-1">
                          {conversation.title || 'New conversation'}
                        </p>
                        <button
                          onClick={(e) => startEditingConversation(conversation, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700/50 rounded transition-all"
                          title="Rename conversation"
                        >
                          <Edit2 size={12} className="text-slate-400" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        {conversation.message_count} messages
                      </span>
                      <span className="text-xs text-slate-600">•</span>
                      <span className="text-xs text-slate-500">
                        {formatConversationDate(conversation.updated_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conversation.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                    title="Delete conversation"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Menu size={20} className="text-slate-400" />
                  </button>
                )}
                <div>
                  <h1 className="text-4xl font-display font-bold mb-2">
                    AI <span className="gradient-text">Tutor</span>
                  </h1>
                  <p className="text-slate-400">
                    Your personal focus coach and productivity mentor
                  </p>
                </div>
              </div>
              <Button
                onClick={startNewChat}
                className="flex items-center gap-2"
              >
                <RotateCcw size={16} />
                New Chat
              </Button>
            </div>
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
                            <button
                              onClick={() => copyToClipboard(message.id, message.content)}
                              className="ml-auto p-1 hover:bg-slate-700/50 rounded transition-colors"
                              title="Copy response"
                            >
                              {copiedMessageId === message.id ? (
                                <Check size={14} className="text-emerald-400" />
                              ) : (
                                <Copy size={14} className="text-slate-500 hover:text-slate-300" />
                              )}
                            </button>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        
                        {/* Enhanced Source Display with Inline Top Source */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-700/50">
                            {/* Top source shown inline */}
                            <div className="mb-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700/30">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5">
                                  <BookOpen size={12} className="text-primary-400 flex-shrink-0" />
                                  <span className="text-xs font-medium text-slate-300">
                                    {message.sources[0].section_title}
                                  </span>
                                </div>
                                <span className="text-xs text-emerald-400 font-mono">
                                  {Math.round(message.sources[0].score * 100)}%
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2">
                                {message.sources[0].content}
                              </p>
                              {message.sources[0].category && (
                                <span className="inline-block mt-1 text-xs text-purple-400">
                                  #{message.sources[0].category}
                                </span>
                              )}
                            </div>
                            
                            {/* Show more sources button if there are additional sources */}
                            {message.sources.length > 1 && (
                              <>
                                <button
                                  onClick={() => toggleSourceExpansion(message.id)}
                                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300 transition-colors w-full justify-center"
                                >
                                  {expandedSources.has(message.id) ? (
                                    <>
                                      <ChevronUp size={14} />
                                      <span>Hide {message.sources.length - 1} more source{message.sources.length > 2 ? 's' : ''}</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown size={14} />
                                      <span>Show {message.sources.length - 1} more source{message.sources.length > 2 ? 's' : ''}</span>
                                    </>
                                  )}
                                </button>
                                
                                {expandedSources.has(message.id) && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-2 space-y-2"
                                  >
                                    {message.sources.slice(1).map((source, idx) => (
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
                              </>
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

              {/* Input with Multi-line Support */}
              <div className="border-t border-slate-800 p-4">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask me anything about productivity... (Shift+Enter for new line)"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none transition-all"
                      rows={input.includes('\n') ? Math.min(input.split('\n').length + 1, 5) : 1}
                      style={{ minHeight: '48px', maxHeight: '160px' }}
                    />
                  </div>
                  <Button onClick={handleSend} disabled={!input.trim() || isTyping} className="h-12 px-4">
                    <Send size={18} />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs">Enter</kbd> to send, 
                  <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs ml-1">Shift+Enter</kbd> for new line
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Error Card */}
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

          {/* Info Card */}
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
                    Context-Aware AI Coaching with Memory
                  </h4>
                  <p className="text-sm text-slate-400 mb-2">
                    Alex remembers your conversations and analyzes your focus patterns, session history, and productivity trends to give you personalized, evidence-based advice - not generic tips.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full">
                      40+ Research Docs
                    </span>
                    <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded-full">
                      Your Stats Integrated
                    </span>
                    <span className="text-xs px-2 py-1 bg-primary-500/10 text-primary-400 rounded-full">
                      Conversation Memory
                    </span>
                    <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded-full">
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
