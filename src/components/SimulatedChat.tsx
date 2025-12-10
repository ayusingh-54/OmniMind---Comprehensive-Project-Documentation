import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles, Search, Database, Zap, Users, Briefcase, Code, Plane, Coffee } from 'lucide-react';

interface Message {
    id: number;
    role: string;
    content: string;
    delay: number;
    tool?: 'search' | 'rag' | 'analyze';
}

interface Agent {
    name: string;
    icon: any;
    color: string;
    gradient?: string;
}

interface Scenario {
    id: string;
    name: string;
    icon: any;
    script: Message[];
    agents: Record<string, Agent>;
}

const SCENARIOS: Scenario[] = [
    {
        id: 'research',
        name: "Research",
        icon: Briefcase,
        agents: {
            user: { name: 'Alex', icon: User, color: '#3b82f6' },
            researcher: { name: 'Dr. Chen', icon: User, color: '#6366f1' },
            ai_assistant: { name: 'Gradient AI', icon: Sparkles, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)' },
            manager: { name: 'Sarah', icon: User, color: '#10b981' },
        },
        script: [
            { id: 1, role: 'user', content: 'What were the key points from the Transformer paper we discussed last week?', delay: 500 },
            { id: 2, role: 'ai_assistant', content: 'Based on chat memory, you discussed "Attention Is All You Need". Key insight: entirely attention-based architecture, abandoning RNNs and CNNs.', delay: 2200, tool: 'rag' },
            { id: 3, role: 'researcher', content: 'Right! Can you analyze feasibility with our private data?', delay: 3600 },
            { id: 4, role: 'ai_assistant', content: 'This architecture is highly compatible with existing distributed training clusters, estimated 40% efficiency improvement. Recommend validating on small dataset first.', delay: 5200, tool: 'analyze' },
            { id: 5, role: 'manager', content: 'Great! Alex, can you have a demo ready by next week?', delay: 6600 },
            { id: 6, role: 'user', content: 'With AI assistance, no problem! @Gradient help me prepare environment config.', delay: 8000 },
            { id: 7, role: 'ai_assistant', content: 'Docker config and dependency manifest generated and sent to your email.', delay: 9600, tool: 'analyze' },
        ]
    },
    {
        id: 'marketing',
        name: "Marketing",
        icon: Coffee,
        agents: {
            user: { name: 'Emma', icon: User, color: '#f43f5e' },
            creative: { name: 'Copywriter', icon: User, color: '#f59e0b' },
            ai_assistant: { name: 'Gradient AI', icon: Sparkles, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)' },
            designer: { name: 'Designer', icon: User, color: '#14b8a6' },
        },
        script: [
            { id: 1, role: 'user', content: 'We need a slogan for our new "Cherry Blossom Latte" - spring limited edition!', delay: 500 },
            { id: 2, role: 'ai_assistant', content: 'Analyzed 3 years of spring beverage viral copy. Top keywords: "romance", "encounter", "pink healing", "first love"', delay: 2200, tool: 'search' },
            { id: 3, role: 'creative', content: 'How about: "One sip of cherry blossoms, encounter your spring romance"', delay: 3600 },
            { id: 4, role: 'ai_assistant', content: 'A/B test simulation shows 25% higher click rate than last year! Generated 3 poster drafts for selection.', delay: 5200, tool: 'analyze' },
            { id: 5, role: 'designer', content: 'Version 2 looks good, but can we change the background to Kyoto cherry blossom path?', delay: 6600 },
            { id: 6, role: 'ai_assistant', content: 'Regenerated with Kyoto Arashiyama cherry blossom tunnel elements, maintaining brand color consistency.', delay: 8200, tool: 'analyze' },
            { id: 7, role: 'user', content: 'Perfect! Send it to operations for scheduling.', delay: 9600 },
        ]
    },
    {
        id: 'coding',
        name: "Debugging",
        icon: Code,
        agents: {
            user: { name: 'Mike', icon: User, color: '#06b6d4' },
            senior: { name: 'Tech Lead', icon: User, color: '#475569' },
            ai_assistant: { name: 'Gradient AI', icon: Sparkles, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)' },
            qa: { name: 'QA Engineer', icon: User, color: '#eab308' },
        },
        script: [
            { id: 1, role: 'user', content: 'Production is down! RecursionError: maximum recursion depth exceeded', delay: 500 },
            { id: 2, role: 'ai_assistant', content: 'Stack overflow detected. Analyzed last 3 commits, located issue in utils.py parse_tree function.', delay: 2200, tool: 'analyze' },
            { id: 3, role: 'senior', content: 'Is the base case condition incorrect?', delay: 3600 },
            { id: 4, role: 'ai_assistant', content: 'Yes, line 42 is missing null node check. Generated fix patch and added boundary test cases.', delay: 5200, tool: 'rag' },
            { id: 5, role: 'qa', content: 'Let me run regression tests, one moment...', delay: 6600 },
            { id: 6, role: 'ai_assistant', content: 'Pre-ran tests in sandbox environment, all 147 test cases passed, no side effects.', delay: 8200, tool: 'analyze' },
            { id: 7, role: 'user', content: 'Amazing, submitting PR! @Tech Lead please review.', delay: 9600 },
        ]
    },
    {
        id: 'travel',
        name: "Travel",
        icon: Plane,
        agents: {
            user: { name: 'Mike', icon: User, color: '#f97316' },
            friend: { name: 'Amy', icon: User, color: '#ec4899' },
            ai_assistant: { name: 'Gradient AI', icon: Sparkles, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)' },
            friend2: { name: 'Tom', icon: User, color: '#22c55e' },
        },
        script: [
            { id: 1, role: 'user', content: 'Planning to visit Kyoto this holiday, any recommendations?', delay: 500 },
            { id: 2, role: 'ai_assistant', content: 'I recall Amy visited Kiyomizu-dera last year with great reviews. Mike, you love photography - I recommend Fushimi Inari Shrine\'s thousand torii gates!', delay: 2200, tool: 'rag' },
            { id: 3, role: 'friend', content: 'Wow AI has great memory! The sunset at Kiyomizu-dera is stunning, highly recommend!', delay: 3600 },
            { id: 4, role: 'friend2', content: 'I want to try kaiseki cuisine, any restaurant recommendations?', delay: 5000 },
            { id: 5, role: 'ai_assistant', content: 'Generated a 5-day "Photography + Dining" itinerary with 3 Michelin restaurant booking suggestions and optimal photo times.', delay: 6600, tool: 'search' },
            { id: 6, role: 'user', content: 'Help me check flights, direct only!', delay: 8000 },
            { id: 7, role: 'ai_assistant', content: 'United UA835 is best fit, 20% off if booked now. Synced to group calendar, want me to help book?', delay: 9600, tool: 'search' },
        ]
    }
];

const ToolIcon: React.FC<{ tool: string }> = ({ tool }) => {
    const icons: Record<string, any> = {
        search: Search,
        rag: Database,
        analyze: Zap,
    };
    const Icon = icons[tool];
    return Icon ? <Icon size={10} /> : null;
};

export const SimulatedChat: React.FC = () => {
    const [scenarioIndex, setScenarioIndex] = useState(0);
    const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const chatContainerRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [visibleMessages, isTyping]);

    const currentScenario = SCENARIOS[scenarioIndex];
    const onlineCount = Object.keys(currentScenario.agents).length;

    const switchScenario = useCallback((index: number) => {
        setScenarioIndex(index);
        setVisibleMessages([]);
        setIsTyping(false);
        setActiveTool(null);
        setIsAutoPlaying(true);
    }, []);

    useEffect(() => {
        let timeouts: ReturnType<typeof setTimeout>[] = [];

        const playScript = () => {
            setVisibleMessages([]);
            setActiveTool(null);

            currentScenario.script.forEach((msg, index) => {
                const typingDelay = msg.delay - 1000;
                if (typingDelay > 0 && msg.role === 'ai_assistant') {
                    timeouts.push(setTimeout(() => {
                        setIsTyping(true);
                        if (msg.tool) setActiveTool(msg.tool);
                    }, typingDelay));
                }

                timeouts.push(setTimeout(() => {
                    setIsTyping(false);
                    setActiveTool(null);
                    setVisibleMessages(prev => [...prev, msg]);

                    if (index === currentScenario.script.length - 1 && isAutoPlaying) {
                        timeouts.push(setTimeout(() => {
                            setScenarioIndex(prev => (prev + 1) % SCENARIOS.length);
                        }, 4000));
                    }
                }, msg.delay));
            });
        };

        playScript();
        return () => timeouts.forEach(clearTimeout);
    }, [scenarioIndex, isAutoPlaying]);

    return (
        <div className="simulated-chat-card">
            {/* Tab Bar */}
            <div className="tab-bar">
                {SCENARIOS.map((scenario, idx) => {
                    const TabIcon = scenario.icon;
                    return (
                        <motion.button
                            key={scenario.id}
                            className={`tab-item ${idx === scenarioIndex ? 'active' : ''}`}
                            onClick={() => switchScenario(idx)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <TabIcon size={14} />
                            <span>{scenario.name}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Header */}
            <div className="chat-header">
                <div className="header-left">
                    <div className="window-controls">
                        <div className="dot red" />
                        <div className="dot yellow" />
                        <div className="dot green" />
                    </div>
                </div>
                <div className="header-center">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={scenarioIndex}
                            className="chat-title"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {currentScenario.name}
                        </motion.span>
                    </AnimatePresence>
                </div>
                <div className="header-right">
                    <div className="online-indicator">
                        <Users size={12} />
                        <span>{onlineCount}</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="chat-messages" ref={chatContainerRef}>
                <AnimatePresence mode="popLayout">
                    {visibleMessages.map((msg) => {
                        const config = currentScenario.agents[msg.role];
                        if (!config) return null;

                        const Icon = config.icon;
                        const isAI = msg.role === 'ai_assistant';
                        const isUser = msg.role === 'user';

                        return (
                            <motion.div
                                key={`${scenarioIndex}-${msg.id}`}
                                className={`message-row ${isUser ? 'user-row' : 'agent-row'}`}
                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                layout
                            >
                                {!isUser && (
                                    <motion.div
                                        className="avatar"
                                        style={{ background: config.gradient || config.color }}
                                        whileHover={{ scale: 1.1 }}
                                    >
                                        <Icon size={12} color="white" />
                                        {isAI && <div className="ai-ring" />}
                                    </motion.div>
                                )}
                                <div className={`message-bubble ${isUser ? 'user-bubble' : isAI ? 'ai-bubble' : 'agent-bubble'}`}>
                                    {!isUser && (
                                        <div className="bubble-header">
                                            <span className="agent-name" style={{ color: config.color }}>{config.name}</span>
                                            {msg.tool && (
                                                <span className="tool-badge">
                                                    <ToolIcon tool={msg.tool} />
                                                    {msg.tool === 'search' ? 'Search' : msg.tool === 'rag' ? 'Memory' : 'Analyze'}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <div className="message-content">{msg.content}</div>
                                </div>
                                {isUser && (
                                    <motion.div
                                        className="avatar"
                                        style={{ background: config.color }}
                                        whileHover={{ scale: 1.1 }}
                                    >
                                        <Icon size={12} color="white" />
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                    {isTyping && (
                        <motion.div
                            className="message-row agent-row"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="avatar ai-avatar">
                                <Sparkles size={12} color="white" />
                                <div className="ai-ring" />
                            </div>
                            <div className="typing-bubble">
                                {activeTool && (
                                    <span className="typing-tool">
                                        <ToolIcon tool={activeTool} />
                                        {activeTool === 'search' ? 'Searching...' : activeTool === 'rag' ? 'Retrieving memory...' : 'Analyzing...'}
                                    </span>
                                )}
                                <div className="typing-dots">
                                    <span /><span /><span />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style>{`
                .simulated-chat-card {
                    width: 100%;
                    max-width: 450px;
                    min-height: 0;
                    box-sizing: border-box;
                    background: linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.5) 100%);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 20px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow:
                        0 20px 40px -10px rgba(0,0,0,0.1),
                        0 0 0 1px rgba(255,255,255,0.2) inset;
                    font-family: 'Inter', sans-serif;
                }

                .tab-bar {
                    display: flex;
                    gap: 4px;
                    padding: 10px 12px;
                    background: rgba(255, 255, 255, 0.5);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
                    overflow-x: auto;
                    scrollbar-width: none;
                    flex-shrink: 0;
                }

                .tab-bar::-webkit-scrollbar {
                    display: none;
                }

                .tab-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 10px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: #64748b;
                    background: transparent;
                    border: 1px solid transparent;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.2s;
                }

                .tab-item:hover {
                    background: rgba(139, 92, 246, 0.08);
                    color: #8b5cf6;
                }

                .tab-item.active {
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.1));
                    color: #8b5cf6;
                    border-color: rgba(139, 92, 246, 0.3);
                    font-weight: 600;
                }

                .chat-header {
                    padding: 10px 16px;
                    background: rgba(255, 255, 255, 0.3);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-shrink: 0;
                }

                .header-left, .header-right {
                    flex: 1;
                }

                .header-center {
                    flex: 2;
                    text-align: center;
                }

                .header-right {
                    display: flex;
                    justify-content: flex-end;
                }

                .window-controls {
                    display: flex;
                    gap: 6px;
                }

                .dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    transition: transform 0.2s;
                }
                .dot:hover { transform: scale(1.2); }
                .red { background: #ff5f56; }
                .yellow { background: #ffbd2e; }
                .green { background: #27c93f; }

                .chat-title {
                    font-size: 0.8rem;
                    color: #475569;
                    font-weight: 600;
                }

                .online-indicator {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.7rem;
                    color: #10b981;
                    background: rgba(16, 185, 129, 0.1);
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-weight: 500;
                }

                .chat-messages {
                    flex: 1;
                    min-height: 0;
                    padding: 14px;
                    overflow-y: auto;
                    overflow-x: hidden;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .message-row {
                    display: flex;
                    gap: 8px;
                    align-items: flex-end;
                    width: 100%;
                    flex-shrink: 0;
                }

                .user-row {
                    justify-content: flex-end;
                }

                .avatar {
                    width: 26px;
                    height: 26px;
                    border-radius: 9px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    position: relative;
                    cursor: pointer;
                }

                .ai-avatar {
                    background: linear-gradient(135deg, #8b5cf6, #6366f1);
                }

                .ai-ring {
                    position: absolute;
                    inset: -3px;
                    border-radius: 11px;
                    border: 2px solid rgba(139, 92, 246, 0.3);
                    animation: pulse-ring 2s infinite;
                }

                @keyframes pulse-ring {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.05); }
                }

                .message-bubble {
                    padding: 8px 12px;
                    border-radius: 14px;
                    font-size: 0.8rem;
                    line-height: 1.45;
                    max-width: 82%;
                    position: relative;
                }

                .user-bubble {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                    border-bottom-right-radius: 5px;
                    box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
                }

                .agent-bubble {
                    background: rgba(255, 255, 255, 0.9);
                    color: #1e293b;
                    border-bottom-left-radius: 5px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                }

                .ai-bubble {
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(99, 102, 241, 0.05));
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    color: #1e293b;
                    border-bottom-left-radius: 5px;
                }

                .bubble-header {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 3px;
                }

                .agent-name {
                    font-size: 0.65rem;
                    font-weight: 700;
                }

                .tool-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    font-size: 0.55rem;
                    color: #8b5cf6;
                    background: rgba(139, 92, 246, 0.1);
                    padding: 2px 5px;
                    border-radius: 5px;
                    font-weight: 500;
                }

                .message-content {
                    white-space: pre-wrap;
                }

                .typing-bubble {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    padding: 8px 12px;
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(99, 102, 241, 0.05));
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    border-radius: 14px;
                    border-bottom-left-radius: 5px;
                }

                .typing-tool {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.65rem;
                    color: #8b5cf6;
                    font-weight: 500;
                }

                .typing-dots {
                    display: flex;
                    gap: 4px;
                }

                .typing-dots span {
                    width: 5px;
                    height: 5px;
                    background: #8b5cf6;
                    border-radius: 50%;
                    animation: bounce 1.4s infinite ease-in-out both;
                }

                .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
                .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
                    40% { transform: scale(1); opacity: 1; }
                }

                /* Responsive adaptation */
                @media (max-width: 1200px) {
                    .simulated-chat-card {
                        max-width: 400px;
                    }
                }

                @media (max-width: 1024px) {
                    .simulated-chat-card {
                        max-width: 100%;
                        min-height: 350px;
                    }

                    .message-bubble {
                        font-size: 0.78rem;
                    }

                    .chat-messages {
                        padding: 10px;
                        gap: 8px;
                    }

                    .tab-item {
                        padding: 5px 10px;
                        font-size: 0.7rem;
                    }

                    .tab-item span {
                        display: none;
                    }
                }

                @media (max-width: 480px) {
                    .tab-bar {
                        padding: 8px 10px;
                    }

                    .tab-item {
                        padding: 6px 10px;
                    }

                    .tab-item span {
                        display: inline;
                    }
                }
            `}</style>
        </div>
    );
};
