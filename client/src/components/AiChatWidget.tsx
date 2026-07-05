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

const ONBOARDING_SUGGESTIONS = [
  { text: 'How do I get started?', emoji: '🚀' },
  { text: 'How do I upload study slides?', emoji: '📄' },
  { text: 'How do I start a practice quiz?', emoji: '🎯' },
  { text: 'What is the Analytics dashboard?', emoji: '📊' },
];

const MOBILE_BREAKPOINT = 1024;
const DEFAULT_SHEET_HEIGHT_VH = 80;
const MIN_SHEET_HEIGHT_VH = 40;
const MAX_SHEET_HEIGHT_VH = 95;
const DISMISS_SHEET_HEIGHT_VH = 32;

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
  const [isMobileView, setIsMobileView] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [sheetHeightVh, setSheetHeightVh] = useState(DEFAULT_SHEET_HEIGHT_VH);
  const [isSheetResizing, setIsSheetResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const sheetDragRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const sheetHeightVhRef = useRef(sheetHeightVh);
  const { toast } = useToast();

  useEffect(() => {
    sheetHeightVhRef.current = sheetHeightVh;
  }, [sheetHeightVh]);

  const getMobileSheetHeight = (vh: number) =>
    keyboardOffset > 0
      ? `calc(${vh}vh - ${keyboardOffset}px)`
      : `${vh}vh`;

  const snapSheetHeight = (heightVh: number) => {
    if (heightVh < 55) return 50;
    if (heightVh < 86) return DEFAULT_SHEET_HEIGHT_VH;
    return MAX_SHEET_HEIGHT_VH;
  };

  const handleSheetResizeStart = (clientY: number) => {
    setIsSheetResizing(true);
    sheetDragRef.current = { startY: clientY, startHeight: sheetHeightVhRef.current };
  };

  const handleSheetResizeMove = (clientY: number) => {
    if (!sheetDragRef.current) return;
    const deltaY = sheetDragRef.current.startY - clientY;
    const deltaVh = (deltaY / window.innerHeight) * 100;
    const nextHeight = Math.min(
      MAX_SHEET_HEIGHT_VH,
      Math.max(MIN_SHEET_HEIGHT_VH, sheetDragRef.current.startHeight + deltaVh)
    );
    setSheetHeightVh(nextHeight);
  };

  const handleSheetResizeEnd = () => {
    if (!sheetDragRef.current) return;
    setIsSheetResizing(false);
    sheetDragRef.current = null;

    const current = sheetHeightVhRef.current;
    if (current < DISMISS_SHEET_HEIGHT_VH) {
      setIsOpen(false);
      setSheetHeightVh(DEFAULT_SHEET_HEIGHT_VH);
      return;
    }
    setSheetHeightVh(snapSheetHeight(current));
  };

  const handleSheetPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobileView || e.button > 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    handleSheetResizeStart(e.clientY);
  };

  const handleSheetPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sheetDragRef.current) return;
    e.preventDefault();
    handleSheetResizeMove(e.clientY);
  };

  const handleSheetPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sheetDragRef.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    handleSheetResizeEnd();
  };

  // Match MainLayout mobile breakpoint (lg = 1024px)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => setIsMobileView(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Hide mobile nav & lock scroll while sheet is open
  useEffect(() => {
    if (isOpen && isMobileView) {
      document.body.classList.add('revi-chat-open');
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.classList.remove('revi-chat-open');
        document.body.style.overflow = '';
      };
    }
    document.body.classList.remove('revi-chat-open');
    return undefined;
  }, [isOpen, isMobileView]);

  // Keep sheet above mobile keyboard
  useEffect(() => {
    if (!isOpen || !isMobileView) {
      setKeyboardOffset(0);
      return;
    }

    const vv = window.visualViewport;
    if (!vv) return;

    const handleViewportChange = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardOffset(Math.max(0, offset));
    };

    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);
    handleViewportChange();

    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, [isOpen, isMobileView]);

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
    setSheetHeightVh(DEFAULT_SHEET_HEIGHT_VH);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSheetHeightVh(DEFAULT_SHEET_HEIGHT_VH);
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

  const handleSuggestionClick = async (suggestionText: string) => {
    if (isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: suggestionText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
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

      {/* Mobile backdrop */}
      {isOpen && isMobileView && (
        <div
          className="fixed inset-0 z-[55] bg-black/40 lg:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          ref={chatPanelRef}
          id="revi-chat-panel"
          className={cn(
            'fixed z-[60]',
            !isSheetResizing && 'transition-all duration-300 ease-out animate-slide-up',
            // Mobile: full-width bottom sheet covering nav
            'inset-x-0 bottom-0 w-full',
            // Desktop: floating panel
            'lg:inset-x-auto lg:bottom-6 lg:right-6 lg:left-auto lg:top-auto lg:max-h-none',
            isExpanded
              ? 'lg:w-[calc(100vw-48px)] lg:w-[800px]'
              : 'lg:w-[360px] lg:max-w-[calc(100vw-24px)]',
            isMinimized
              ? 'lg:h-14'
              : isExpanded
                ? 'lg:h-[80vh] lg:max-h-[85vh]'
                : 'lg:h-[520px] lg:max-h-[calc(100vh-100px)]',
            isDragging && 'lg:transition-none'
          )}
          style={
            isMobileView
              ? {
                  bottom: keyboardOffset > 0 ? keyboardOffset : 0,
                  height: getMobileSheetHeight(sheetHeightVh),
                  maxHeight: getMobileSheetHeight(sheetHeightVh),
                }
              : {
                  bottom: position.y === 0 ? undefined : 'auto',
                  right: position.x === 0 && position.y === 0 ? undefined : 'auto',
                  top: position.y !== 0 ? `calc(50vh - 260px + ${position.y}px)` : 'auto',
                  left: position.x !== 0 ? `calc(100vw - 1.5rem - 360px + ${position.x}px)` : 'auto',
                }
          }
        >
          {/* Inner shell — rounded corners + overflow clip (separate from transform animation) */}
          <div
            className={cn(
              'flex h-full w-full flex-col overflow-hidden bg-card shadow-2xl',
              'rounded-t-xl lg:rounded-2xl lg:border lg:border-border'
            )}
          >
          {/* Header — drag handle lives inside so top corners match the sheet */}
          <div
            className={cn(
              'flex flex-shrink-0 flex-col bg-gradient-to-r from-[hsl(175,60%,35%)] to-[hsl(175,55%,45%)]',
              isMobileView && 'rounded-t-xl',
              !isMobileView && (isDragging ? 'cursor-grabbing' : 'cursor-grab')
            )}
            onMouseDown={!isMobileView ? handleDragStart : undefined}
          >
            {isMobileView && (
              <div
                className={cn(
                  'flex justify-center py-3 lg:hidden touch-none select-none',
                  isSheetResizing ? 'cursor-grabbing' : 'cursor-grab'
                )}
                onPointerDown={handleSheetPointerDown}
                onPointerMove={handleSheetPointerMove}
                onPointerUp={handleSheetPointerEnd}
                onPointerCancel={handleSheetPointerEnd}
                aria-label="Drag to resize chat"
              >
                <div className="h-1 w-10 rounded-full bg-white/40" />
              </div>
            )}
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm leading-tight">Revi</p>
              <p className="text-white/70 text-xs">AI Study Assistant</p>
            </div>
            {!isMobileView && (
              <>
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
              </>
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
          </div>

          {/* Messages area — always visible on mobile; desktop respects minimize */}
          {(!isMinimized || isMobileView) && (
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

                {messages.length === 1 && !isLoading && (
                  <div className="pl-9 pr-2 pt-2 animate-slide-up">
                    <p className="text-xs text-muted-foreground mb-3 font-semibold tracking-wide uppercase opacity-75">
                      Need help getting started? Ask me:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ONBOARDING_SUGGESTIONS.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(sug.text)}
                          className={cn(
                            'flex items-center gap-2.5 px-3.5 py-2.5 text-left rounded-xl text-xs font-semibold',
                            'border border-primary/20 bg-primary/5 text-foreground hover:bg-primary/10 hover:border-primary/45',
                            'hover:text-primary transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm',
                            'active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary/30'
                          )}
                        >
                          <span className="text-sm select-none">{sug.emoji}</span>
                          <span className="flex-1 leading-normal">{sug.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
              <div className="flex-shrink-0 border-t bg-card px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
                <p className="hidden lg:block text-center text-xs text-muted-foreground mt-2 opacity-60">
                  Press Enter to send · Shift+Enter for new line
                </p>
              </div>
            </>
          )}
          </div>
        </div>
      )}
    </>
  );
}

export default AiChatWidget;
