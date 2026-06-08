import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader2, ChevronDown, Bot, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient, ChatMessage } from '@/services/api.client';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// Simple markdown renderer — bold, bullet lists, inline code
// ============================================================================
function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    elements.push(
      <ul key={key} className="list-disc pl-5 space-y-1 my-1">
        {listBuffer.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed">
            <InlineText text={item} />
          </li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listBuffer.push(trimmed.slice(2));
    } else {
      flushList(`list-${idx}`);
      if (trimmed === '') {
        elements.push(<div key={idx} className="h-2" />);
      } else if (trimmed.startsWith('### ')) {
        elements.push(
          <p key={idx} className="text-sm font-bold mt-2 mb-1">
            <InlineText text={trimmed.slice(4)} />
          </p>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <p key={idx} className="text-sm font-bold mt-2 mb-1">
            <InlineText text={trimmed.slice(3)} />
          </p>
        );
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        elements.push(
          <p key={idx} className="text-sm font-semibold leading-relaxed">
            <InlineText text={trimmed.slice(2, -2)} />
          </p>
        );
      } else {
        elements.push(
          <p key={idx} className="text-sm leading-relaxed">
            <InlineText text={trimmed} />
          </p>
        );
      }
    }
  });
  flushList('list-final');

  return <div className="space-y-1">{elements}</div>;
}

function InlineText({ text }: { text: string }) {
  // Handle **bold** and `code` inline
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ============================================================================
// Main Widget
// ============================================================================
const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    "Hey there! 👋 I'm **Revi**, your AI study assistant. I'm here to help you understand concepts, prepare for exams, and answer your academic questions.\n\nWhat would you like to know?",
};

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when chat opens (desktop only to avoid keyboard popup on mobile)
  useEffect(() => {
    if (isOpen && !isMinimized) {
      // Only auto-focus on desktop (width > 1024px)
      const isDesktop = window.innerWidth > 1024;
      if (isDesktop) {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    }
  }, [isOpen, isMinimized]);

  // Listen for custom event to open chat and pre-fill input
  useEffect(() => {
    const handleOpenChatEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      if (customEvent.detail && customEvent.detail.message) {
        setIsOpen(true);
        setIsMinimized(false);
        setIsExpanded(false);
        setInput(customEvent.detail.message);

        // Auto-focus and adjust height of input (desktop only)
        const isDesktop = window.innerWidth > 1024;
        if (isDesktop) {
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
              inputRef.current.style.height = 'auto';
              inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
            }
          }, 200);
        } else {
          // On mobile, just adjust height without focusing
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.style.height = 'auto';
              inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
            }
          }, 200);
        }
      }
    };

    window.addEventListener('open-revi-chat', handleOpenChatEvent);
    return () => {
      window.removeEventListener('open-revi-chat', handleOpenChatEvent);
    };
  }, []);

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, dragStart]);

  const handleDragStart = (e: React.MouseEvent) => {
    // Only allow dragging from the header
    const target = e.target as HTMLElement;
    if (target.closest('button')) return; // Don't drag when clicking buttons

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Send only the conversation history (excluding the initial welcome message)
      const conversationToSend = updatedMessages.slice(1); // skip welcome
      const reply = await apiClient.sendChatMessage(conversationToSend);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.error ||
        error?.message ||
        'Something went wrong. Please try again.';
      toast({
        title: 'Revi is unavailable',
        description: errMsg,
        variant: 'destructive',
      });
      // Remove the user message on error so they can retry
      setMessages((prev) => prev.slice(0, -1));
      setInput(trimmed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          id="revi-chat-open-btn"
          onClick={handleOpen}
          aria-label="Open Revi AI Chat"
          className={cn(
            'fixed bottom-24 lg:bottom-6 right-6 z-50',
            'w-14 h-14 rounded-full shadow-lg',
            'bg-gradient-to-br from-[hsl(175,60%,35%)] to-[hsl(175,55%,45%)]',
            'flex items-center justify-center',
            'transition-all duration-300 hover:scale-110 hover:shadow-xl',
            'focus:outline-none focus:ring-4 focus:ring-[hsl(175,55%,45%)]/40',
            'group'
          )}
        >
          <Sparkles className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-[hsl(175,60%,35%)] animate-ping opacity-20" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          ref={chatPanelRef}
          id="revi-chat-panel"
          className={cn(
            'fixed z-50',
            isExpanded ? 'w-[calc(100vw-48px)] md:w-[600px] lg:w-[800px]' : 'w-[360px] max-w-[calc(100vw-24px)]',
            'rounded-2xl shadow-2xl border border-border',
            'bg-card flex flex-col overflow-hidden',
            'transition-all duration-300 ease-out',
            'animate-slide-up',
            isMinimized ? 'h-14' : isExpanded ? 'h-[80vh] max-h-[85vh]' : 'h-[520px] max-h-[calc(100vh-100px)]',
            isDragging && 'transition-none'
          )}
          style={{
            bottom: position.y === 0 ? 'calc(6rem + 1.5rem)' : 'auto',
            right: position.x === 0 && position.y === 0 ? '1.5rem' : 'auto',
            top: position.y !== 0 ? `calc(50vh - 260px + ${position.y}px)` : 'auto',
            left: position.x !== 0 ? `calc(100vw - 1.5rem - 360px + ${position.x}px)` : 'auto',
          }}
        >
          {/* Header */}
          <div
            className={cn(
              "flex items-center gap-3 px-4 py-3 border-b bg-gradient-to-r from-[hsl(175,60%,35%)] to-[hsl(175,55%,45%)] flex-shrink-0",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            onMouseDown={handleDragStart}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm leading-tight">Revi</p>
              <p className="text-white/70 text-xs">AI Study Assistant</p>
            </div>
            <button
              id="revi-chat-minimize-btn"
              onClick={() => setIsMinimized(!isMinimized)}
              aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
              className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-white transition-transform duration-200',
                  isMinimized ? 'rotate-180' : ''
                )}
              />
            </button>
            {!isMinimized && (
              <button
                id="revi-chat-expand-btn"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? 'Shrink chat' : 'Expand chat'}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4 text-white" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-white" />
                )}
              </button>
            )}
            <button
              id="revi-chat-close-btn"
              onClick={handleClose}
              aria-label="Close chat"
              className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Messages area */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scroll-smooth">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex gap-2',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(175,60%,35%)] to-[hsl(175,55%,45%)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[82%] rounded-2xl px-4 py-2.5',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      )}
                    >
                      {msg.role === 'assistant' ? (
                        <RenderMarkdown text={msg.content} />
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(175,60%,35%)] to-[hsl(175,55%,45%)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="flex-shrink-0 border-t bg-card px-3 py-3">
                <div className="flex items-end gap-2 bg-muted rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/40 transition-shadow">
                  <textarea
                    ref={inputRef}
                    id="revi-chat-input"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Revi anything academic..."
                    rows={1}
                    disabled={isLoading}
                    className={cn(
                      'flex-1 bg-transparent resize-none text-sm text-foreground',
                      'placeholder:text-muted-foreground outline-none',
                      'min-h-[24px] max-h-[120px] leading-6',
                      'disabled:opacity-50'
                    )}
                    style={{ height: '24px' }}
                  />
                  <button
                    id="revi-chat-send-btn"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    aria-label="Send message"
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      'transition-all duration-200',
                      input.trim() && !isLoading
                        ? 'bg-primary text-primary-foreground hover:opacity-90 hover:scale-105'
                        : 'bg-muted-foreground/20 text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2 opacity-60">
                  Press Enter to send · Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default AiChatWidget;
