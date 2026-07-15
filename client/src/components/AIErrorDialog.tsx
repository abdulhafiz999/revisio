import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, Wifi, RefreshCw, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Error type detection
// ============================================================================

export type AIErrorType = 'rate_limit' | 'service_unavailable' | 'network' | 'generic';

export function detectAIErrorType(message: string): AIErrorType {
  const m = message.toLowerCase();
  if (
    m.includes('429') ||
    m.includes('too many requests') ||
    m.includes('quota') ||
    m.includes('rate limit') ||
    m.includes('free-tier limit') ||
    m.includes('retry in')
  ) {
    return 'rate_limit';
  }
  if (
    m.includes('503') ||
    m.includes('502') ||
    m.includes('service unavailable') ||
    m.includes('high demand') ||
    m.includes('overloaded') ||
    m.includes('busy right now') ||
    m.includes('temporarily unavailable')
  ) {
    return 'service_unavailable';
  }
  if (m.includes('network') || m.includes('err_network') || m.includes('econnaborted')) {
    return 'network';
  }
  return 'generic';
}

/** Extract retry seconds from an error message like "retry in 45s" or "retry in 45.2s" */
function extractRetrySeconds(message: string): number | null {
  const match = message.match(/retry in ([\d.]+)s/i);
  if (match) return Math.ceil(parseFloat(match[1]));
  return null;
}

// ============================================================================
// Countdown timer sub-component
// ============================================================================

function CountdownTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    if (seconds <= 0) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const pct = Math.max(0, (remaining / seconds) * 100);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const label = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">Resets in</span>
        <span
          className={cn(
            'font-mono font-bold tabular-nums',
            remaining > 30 ? 'text-destructive' : remaining > 10 ? 'text-yellow-500' : 'text-emerald-500'
          )}
        >
          {label}
        </span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000 ease-linear',
            remaining > 30
              ? 'bg-destructive'
              : remaining > 10
              ? 'bg-yellow-500'
              : 'bg-emerald-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {remaining === 0 && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold text-center">
          ✅ Ready! Hit retry now.
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Config per error type
// ============================================================================

interface ErrorConfig {
  icon: React.ReactNode;
  iconBg: string;
  gradient: string;
  title: string;
  subtitle: string;
  tips: string[];
}

export function getFriendlyErrorMessage(message: string): string {
  const m = message.toLowerCase();
  
  if (
    m.includes('429') ||
    m.includes('too many requests') ||
    m.includes('quota') ||
    m.includes('rate limit') ||
    m.includes('free-tier limit') ||
    m.includes('retry in')
  ) {
    const match = message.match(/retry in ([\d.]+)s/i);
    const secsLabel = match ? ` in about ${Math.ceil(parseFloat(match[1]))}s` : ' shortly';
    return `You're studying hard! Revi needs a quick moment to recharge. We'll be ready to go again${secsLabel}. Grab a glass of water or stretch in the meantime! ☕`;
  }
  
  if (
    m.includes('503') ||
    m.includes('502') ||
    m.includes('service unavailable') ||
    m.includes('high demand') ||
    m.includes('overloaded') ||
    m.includes('busy right now') ||
    m.includes('temporarily unavailable')
  ) {
    return "Lots of students are revision-prepping right now! Revi's brain is a bit crowded. Let's wait a minute and try again.";
  }
  
  if (m.includes('network') || m.includes('err_network') || m.includes('econnaborted')) {
    return "We couldn't connect to Revi. Please check your internet connection and try again!";
  }
  
  return message || "Revi encountered an unexpected hiccup. Let's try again in a moment!";
}

function getErrorConfig(type: AIErrorType, rawMessage: string): ErrorConfig {
  const friendlyMsg = getFriendlyErrorMessage(rawMessage);
  
  switch (type) {
    case 'rate_limit':
      return {
        icon: <Zap className="h-7 w-7" />,
        iconBg: 'bg-orange-500/15 text-orange-500 border border-orange-500/20',
        gradient: 'from-orange-500/8 via-muted/40 to-background',
        title: 'Revi is taking a quick breath ☕',
        subtitle: friendlyMsg,
        tips: [
          'Grab a quick glass of water or stretch while the timer resets!',
          'To save time later, try asking for fewer quiz questions (e.g. 10 instead of 25).',
          'Shorter, focused notes help Revi compile responses much faster.',
        ],
      };
    case 'service_unavailable':
      return {
        icon: <AlertTriangle className="h-7 w-7" />,
        iconBg: 'bg-yellow-500/15 text-yellow-500 border border-yellow-500/20',
        gradient: 'from-yellow-500/8 via-muted/40 to-background',
        title: "Revi's brain is a bit crowded 🧠",
        subtitle: friendlyMsg,
        tips: [
          'Wait about 30–60 seconds, then try again.',
          'Many students are preparing for exams at this very hour!',
          'Revi is already attempting backup paths to process your query.',
        ],
      };
    case 'network':
      return {
        icon: <Wifi className="h-7 w-7" />,
        iconBg: 'bg-blue-500/15 text-blue-500 border border-blue-500/20',
        gradient: 'from-blue-500/8 via-muted/40 to-background',
        title: 'Connection Lost 📡',
        subtitle: friendlyMsg,
        tips: [
          'Make sure your Wi-Fi or mobile data is active and working.',
          'Try refreshing the browser page if you still cannot connect.',
        ],
      };
    default:
      return {
        icon: <AlertTriangle className="h-7 w-7" />,
        iconBg: 'bg-destructive/15 text-destructive border border-destructive/20',
        gradient: 'from-destructive/8 via-muted/40 to-background',
        title: 'Unexpected Hiccup ⚙️',
        subtitle: friendlyMsg,
        tips: [
          'If this keeps happening, try refreshing the page.',
          'Ensure your study note contains readable text content.',
        ],
      };
  }
}

// ============================================================================
// Main Dialog
// ============================================================================

export interface AIErrorDialogProps {
  open: boolean;
  onClose: () => void;
  onRetry?: () => void;
  errorMessage: string;
  /** Context label shown on the retry button, e.g. "Generate Quiz" */
  actionLabel?: string;
}

export function AIErrorDialog({
  open,
  onClose,
  onRetry,
  errorMessage,
  actionLabel = 'Try again',
}: AIErrorDialogProps) {
  const type = detectAIErrorType(errorMessage);
  const config = getErrorConfig(type, errorMessage);
  const retrySeconds = type === 'rate_limit' ? extractRetrySeconds(errorMessage) : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden rounded-2xl border border-border/60 shadow-2xl"
        onPointerDownOutside={onClose}
      >
        {/* Gradient header */}
        <div
          className={cn(
            'w-full px-6 pt-7 pb-6 flex flex-col items-center text-center gap-3',
            `bg-gradient-to-b ${config.gradient}`,
            'border-b border-border/40'
          )}
        >
          {/* Animated icon */}
          <div
            className={cn(
              'p-4 rounded-2xl flex items-center justify-center',
              'shadow-sm',
              config.iconBg
            )}
            style={{ animation: 'subtle-bounce 2s ease-in-out infinite' }}
          >
            {config.icon}
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              {config.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[300px]">
              {config.subtitle}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Countdown (rate limit with known seconds) */}
          {retrySeconds && retrySeconds > 0 && (
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Quota reset timer
                </span>
              </div>
              <CountdownTimer seconds={retrySeconds} />
            </div>
          )}

          {/* Tips */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              What you can do
            </p>
            {config.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-[5px] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary/50" />
                <span className="leading-snug">{tip}</span>
              </div>
            ))}
          </div>

          {/* Technical details (collapsible) */}
          {errorMessage && (
            <details className="text-[11px] text-muted-foreground/50 group cursor-pointer">
              <summary className="select-none hover:text-muted-foreground transition-colors list-none flex items-center gap-1">
                <span className="text-[10px] font-mono border border-border/50 px-1.5 py-0.5 rounded">
                  details
                </span>
              </summary>
              <p className="mt-2 pl-2 border-l-2 border-border font-mono leading-relaxed break-all text-[10px]">
                {errorMessage}
              </p>
            </details>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-2.5">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Dismiss
          </Button>
          {onRetry && (
            <Button
              className="flex-1 bg-gradient-primary hover:opacity-90 font-semibold"
              onClick={() => {
                onClose();
                onRetry();
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              {actionLabel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
