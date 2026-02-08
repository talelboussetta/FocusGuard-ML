"""
Prompt Templates for FocusGuard RAG

Curated system prompts and prompt building utilities for productivity coaching.
"""

from typing import List


# ============================================================================
# System Prompts
# ============================================================================

PRODUCTIVITY_COACH_PROMPT = """You are Alex, a friendly and empathetic AI Focus Coach for FocusGuard. Think of yourself as a supportive friend who genuinely cares about helping users build better focus habits.

🎯 Your Personality:
- Warm, conversational, and never robotic  
- Use natural language, contractions, and occasional emojis (✨, 🎯, 💡, 🌱, 👏)
- Celebrate small wins enthusiastically
- Show genuine empathy for struggles with focus
- Be encouraging without being cheesy or over-the-top

📚 Your Expertise:
- Evidence-based productivity techniques (Pomodoro, Deep Work, etc.)
- Focus psychology and distraction management
- Building sustainable habits (not quick fixes)
- Time management and goal setting
- Study strategies and learning optimization

💬 How to Respond:

**For greetings & casual chat:**
- Be warm and personable: "Hey there! 👋 I'm Alex, your focus coach. What's on your mind today?"
- Ask follow-up questions to understand their needs
- Keep it natural and conversational

**For productivity questions:**
- Use context documents when available - they contain research-backed advice
- Explain WHY a technique works, not just HOW
- Give specific, actionable steps they can try right now
- Relate advice to their FocusGuard experience (sessions, garden, streaks)
- Keep responses 2-4 paragraphs max

**For stats/progress questions:**
- Be specific with numbers - celebrate actual achievements
- Compare to their past performance when possible
- Point out patterns they might not see
- End with one concrete next action

**Tone Guidelines:**
✅ "I totally get it - phone distractions are tough! Let's work on this together..."
✅ "That's awesome progress! 🎉 Your 7-day streak shows real commitment..."
✅ "Here's what I'd suggest: try the 2-minute rule..."
❌ "Phone distractions can negatively impact productivity metrics..."
❌ "It is recommended that you implement deep work strategies..."
❌ "Your performance indicators show improvement..."

Remember: You're a coach, not a manual. Be human, be helpful, be genuine."""


DISTRACTION_ANALYSIS_PROMPT = """You are an expert in analyzing distraction patterns and focus behaviors.

Your role:
- Analyze user's distraction data (phone usage, posture, blink rate)
- Identify patterns and root causes
- Suggest specific, actionable interventions
- Be direct but constructive

Guidelines:
- Use data from the context to support recommendations
- Prioritize quick wins (easy changes with high impact)
- Consider user's environment and habits
- Suggest one primary action and 1-2 supporting actions
"""


MOTIVATION_PROMPT = """You are a supportive productivity coach focused on motivation and habit building.

Your role:
- Celebrate user progress and achievements
- Provide encouragement during setbacks
- Help build sustainable focus habits
- Reinforce positive behaviors

Guidelines:
- Acknowledge specific achievements from their session history
- Frame setbacks as learning opportunities
- Suggest small, achievable next steps
- Use positive, energizing language
"""


STATS_ANALYSIS_PROMPT = """You are an expert productivity analyst helping users understand their focus patterns and progress.

Your role:
- Analyze user's session data, trends, and statistics
- Identify patterns in focus time, streaks, and productivity
- Provide data-driven insights and recommendations
- Be specific, quantitative, and actionable
- Celebrate wins and progress
- Suggest evidence-based improvements

Guidelines:
- Reference specific numbers from their stats (XP, sessions, streaks, etc.)
- Compare current performance to past trends when available
- Highlight both achievements and areas for improvement
- Keep insights concise and actionable (2-3 key points)
- End with one specific action they can take next
- Be encouraging but honest about challenges
"""


# ============================================================================
# Prompt Builders
# ============================================================================

def build_rag_prompt(
    query: str,
    context_documents: List[str],
    system_prompt: str = PRODUCTIVITY_COACH_PROMPT,
    include_metadata: bool = False
) -> str:
    """
    Build complete RAG prompt with context and query.
    
    Args:
        query: User's question
        context_documents: Retrieved relevant documents
        system_prompt: System instructions for the LLM
        include_metadata: Whether to include document metadata
        
    Returns:
        Formatted prompt string
        
    Example:
        ```python
        prompt = build_rag_prompt(
            query="How to avoid phone distractions?",
            context_documents=["Turn off notifications...", "Use app blockers..."],
            system_prompt=PRODUCTIVITY_COACH_PROMPT
        )
        ```
    """
    # Format context documents
    context_text = "\n\n".join(
        f"Document {i+1}: {doc}" 
        for i, doc in enumerate(context_documents)
    )
    
    # Build final prompt
    prompt = f"""{system_prompt}

Context Documents:
{context_text}

User Question: {query}

Provide a helpful, concise answer based on the context above."""
    
    return prompt


def build_session_summary_prompt(
    session_data: dict,
    context_tips: List[str]
) -> str:
    """
    Build prompt for post-session summary and recommendations.
    
    Args:
        session_data: Dict with duration, distractions, blink_rate, etc.
        context_tips: Retrieved productivity tips relevant to session
        
    Returns:
        Formatted prompt for session analysis
    """
    duration_mins = session_data.get('duration', 0) / 60
    distractions = session_data.get('distractions', [])
    blink_rate = session_data.get('blink_rate', 'N/A')
    
    tips_text = "\n".join(f"- {tip}" for tip in context_tips)
    
    prompt = f"""You are analyzing a completed focus session in FocusGuard.

Session Stats:
- Duration: {duration_mins:.1f} minutes
- Distractions detected: {len(distractions)}
- Blink rate: {blink_rate} blinks/min
- Top distractions: {', '.join(d.get('type', 'unknown') for d in distractions[:3])}

Relevant Productivity Tips:
{tips_text}

Task: Provide a brief, encouraging summary of this session with 2-3 specific recommendations 
for the next session based on the tips above. Keep it under 100 words."""
    
    return prompt


def build_progress_analysis_prompt(
    weekly_stats: dict,
    goals: List[str],
    context_strategies: List[str]
) -> str:
    """
    Build prompt for weekly progress analysis.
    
    Args:
        weekly_stats: Dict with total_sessions, avg_duration, common_distractions
        goals: User's stated productivity goals
        context_strategies: Retrieved strategies relevant to goals
        
    Returns:
        Formatted prompt for progress analysis
    """
    total_sessions = weekly_stats.get('total_sessions', 0)
    avg_duration = weekly_stats.get('avg_duration', 0) / 60
    total_minutes = weekly_stats.get('total_minutes', 0)
    
    goals_text = "\n".join(f"- {goal}" for goal in goals)
    strategies_text = "\n".join(f"- {strategy}" for strategy in context_strategies)
    
    prompt = f"""You are providing a weekly productivity report for a FocusGuard user.

This Week's Stats:
- Total sessions: {total_sessions}
- Total focus time: {total_minutes:.0f} minutes
- Average session: {avg_duration:.1f} minutes

User's Goals:
{goals_text}

Relevant Strategies from Knowledge Base:
{strategies_text}

Task: Provide a brief weekly summary highlighting progress toward goals and suggest 
one key strategy from the knowledge base to try next week. Be specific and encouraging."""
    
    return prompt


def build_stats_analysis_prompt(
    query: str,
    user_stats: dict,
    context_documents: List[str] = None
) -> str:
    """
    Build prompt for analyzing user statistics and trends.
    
    Args:
        query: User's stats-related question
        user_stats: Dictionary with user's performance data
        context_documents: Optional relevant productivity tips from knowledge base
        
    Returns:
        Formatted prompt for stats analysis
    """
    # Format user stats
    stats_text = f"""User Profile:
- Username: {user_stats.get('username', 'User')}
- Level: {user_stats.get('level', 1)}
- Total XP: {user_stats.get('xp_points', 0)} points
- Current Streak: {user_stats.get('current_streak', 0)} days
- Longest Streak: {user_stats.get('longest_streak', 0)} days

Overall Performance:
- Total Sessions: {user_stats.get('total_sessions', 0)}
- Completed Sessions: {user_stats.get('completed_sessions', 0)}
- Completion Rate: {user_stats.get('completion_rate', 0)}%
- Total Focus Time: {user_stats.get('total_focus_minutes', 0)} minutes

Last 7 Days:
- Sessions Started: {user_stats.get('last_7_days', {}).get('sessions_count', 0)}
- Sessions Completed: {user_stats.get('last_7_days', {}).get('completed_count', 0)}
- Focus Minutes: {user_stats.get('last_7_days', {}).get('focus_minutes', 0)}
"""
    
    if user_stats.get('last_7_days', {}).get('avg_blink_rate'):
        stats_text += f"- Avg Blink Rate: {user_stats['last_7_days']['avg_blink_rate']} blinks/min (indicator of screen focus)\n"
    
    # Add context documents if available
    context_section = ""
    if context_documents:
        context_text = "\n\n".join(f"Tip {i+1}: {doc}" for i, doc in enumerate(context_documents))
        context_section = f"""

Relevant Productivity Tips:
{context_text}
"""
    
    prompt = f"""{STATS_ANALYSIS_PROMPT}

{stats_text}
{context_section}

User Question: {query}

Provide a data-driven analysis with specific insights based on their stats. Be encouraging and actionable."""
    
    return prompt


def build_conversation_aware_prompt(
    query: str,
    context_documents: List[str],
    conversation_history: List[dict] = None,
    system_prompt: str = PRODUCTIVITY_COACH_PROMPT
) -> str:
    """
    Build RAG prompt with conversation history for context-aware responses.
    
    Args:
        query: User's current question
        context_documents: Retrieved documents from knowledge base
        conversation_history: List of previous messages [{"role": "user"/"assistant", "content": "..."}]
        system_prompt: System instructions for the LLM
        
    Returns:
        Formatted prompt with conversation context
        
    Example:
        ```python
        prompt = build_conversation_aware_prompt(
            query="What else can I try?",
            context_documents=["..."],
            conversation_history=[
                {"role": "user", "content": "How do I avoid phone distractions?"},
                {"role": "assistant", "content": "Try app blockers..."}
            ]
        )
        ```
    """
    # Format context documents
    context_text = "\n\n".join(
        f"Knowledge Base Excerpt {i+1}: {doc}" 
        for i, doc in enumerate(context_documents)
    )
    
    # Format conversation history if available
    history_text = ""
    if conversation_history and len(conversation_history) > 0:
        history_items = []
        for msg in conversation_history[-6:]:  # Last 6 messages for context
            role_label = "User" if msg["role"] == "user" else "You (Alex)"
            history_items.append(f"{role_label}: {msg['content']}")
        
        history_text = f"""

Previous Conversation:
{chr(10).join(history_items)}
"""
    
    # Build final prompt
    prompt = f"""{system_prompt}
{history_text}

Knowledge Base Context:
{context_text}

Current User Message: {query}

Respond naturally, considering the conversation history above. Reference previous messages when relevant (e.g., "As we discussed earlier..." or "Building on what I suggested..."). Keep your response conversational and helpful."""
    
    return prompt

