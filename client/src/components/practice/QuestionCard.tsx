import React, { useState } from 'react';
import { Question } from '@/services/api.client';
import { useStudy } from '@/context/StudyContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuestionCardProps {
  question: Question;
  index: number;
  /** When true, hides the per-question Submit button and uses controlled answer selection */
  bulkMode?: boolean;
  /** Controlled selected answer — used in bulk mode */
  externalAnswer?: string | null;
  /** Called when user selects an option in bulk mode */
  onAnswerSelect?: (questionId: string, answer: string) => void;
  /** When true (after bulk submit), reveals correct/incorrect state for each card */
  revealed?: boolean;
  /**
   * One-at-a-time instant-feedback mode.
   * When true: selecting an option immediately submits the answer and reveals the result.
   * onAnswerReveal is called with (questionId, isCorrect) after the API responds.
   */
  instantFeedback?: boolean;
  onAnswerReveal?: (questionId: string, isCorrect: boolean) => void;
}

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

const difficultyColors = {
  easy: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  hard: 'bg-destructive/10 text-destructive border-destructive/20',
};

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  bulkMode = false,
  externalAnswer = null,
  onAnswerSelect,
  revealed = false,
  instantFeedback = false,
  onAnswerReveal,
}) => {
  const { recordAttempt, getQuestionAttempt } = useStudy();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // In bulk mode or instant-feedback mode, ignore previous attempts (fresh quiz)
  const previousAttempt = (bulkMode || instantFeedback) ? undefined : getQuestionAttempt(question.id);

  // Restore state from a previous attempt (non-bulk, non-instant mode only)
  React.useEffect(() => {
    if (!bulkMode && !instantFeedback && previousAttempt) {
      setSelectedAnswer(previousAttempt.student_answer);
      setAnswerState(previousAttempt.is_correct ? 'correct' : 'incorrect');
    }
  }, [previousAttempt, bulkMode, instantFeedback]);

  // Collapse explanation when answers are freshly revealed (bulk mode)
  React.useEffect(() => {
    if (revealed) setShowExplanation(false);
  }, [revealed]);

  // Derived display values:
  //   bulk mode         → controlled by parent props
  //   instant-feedback  → local state (selectedAnswer / answerState)
  //   normal mode       → local state
  const effectiveSelectedAnswer = bulkMode ? externalAnswer : selectedAnswer;
  const effectiveAnswerState: AnswerState = bulkMode
    ? revealed && externalAnswer
      ? externalAnswer === question.correct_answer
        ? 'correct'
        : 'incorrect'
      : 'unanswered'
    : answerState;

  const handleSubmit = async () => {
    if (!selectedAnswer || submitting || bulkMode) return;
    setSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    try {
      const isCorrect = await recordAttempt(question.id, selectedAnswer, timeSpent);
      setAnswerState(isCorrect ? 'correct' : 'incorrect');
    } catch {
      toast({
        title: 'Submission failed',
        description: 'Failed to submit your answer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  /** Instant-feedback: tap an option → immediately submit and reveal result */
  const handleInstantSelect = async (option: string) => {
    if (answerState !== 'unanswered' || submitting) return;
    setSelectedAnswer(option);
    setSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    try {
      const isCorrect = await recordAttempt(question.id, option, timeSpent);
      const newState: AnswerState = isCorrect ? 'correct' : 'incorrect';
      setAnswerState(newState);
      setShowExplanation(true);
      onAnswerReveal?.(question.id, isCorrect);
    } catch {
      // Still reveal locally even if API fails
      const isCorrect = option === question.correct_answer;
      const newState: AnswerState = isCorrect ? 'correct' : 'incorrect';
      setAnswerState(newState);
      setShowExplanation(true);
      onAnswerReveal?.(question.id, isCorrect);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (instantFeedback) {
      handleInstantSelect(option);
      return;
    }
    if (effectiveAnswerState !== 'unanswered') return;
    if (bulkMode) {
      onAnswerSelect?.(question.id, option);
    } else {
      setSelectedAnswer(option);
    }
  };

  return (
    <div className={cn(
      "question-card animate-fade-in",
      effectiveAnswerState === 'correct' && "question-card-correct",
      effectiveAnswerState === 'incorrect' && "question-card-incorrect"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold">
            {index + 1}
          </span>
          <div className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium border",
            difficultyColors[question.difficulty]
          )}>
            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
          </div>
          {question.year && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {question.year}
            </div>
          )}
        </div>
        {effectiveAnswerState !== 'unanswered' && (
          <div className={cn(
            "flex items-center gap-1.5 text-sm font-medium",
            effectiveAnswerState === 'correct' ? "text-success" : "text-destructive"
          )}>
            {effectiveAnswerState === 'correct' ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Correct!
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                Incorrect
              </>
            )}
          </div>
        )}
      </div>

      {/* Question */}
      <p className="text-lg font-medium mb-6">{question.question_text}</p>

      {/* Options */}
      {question.options && (
        <div className="space-y-3 mb-6">
          {question.options.map((option, optIndex) => {
            const isSelected = effectiveSelectedAnswer === option;
            const isCorrectOption = option === question.correct_answer;
            const showResult = effectiveAnswerState !== 'unanswered';

            return (
              <button
                key={optIndex}
                onClick={() => handleOptionSelect(option)}
                disabled={effectiveAnswerState !== 'unanswered' || submitting}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                  effectiveAnswerState === 'unanswered' && !isSelected && "border-border hover:border-primary/50 hover:bg-muted/50",
                  effectiveAnswerState === 'unanswered' && isSelected && "border-primary bg-primary/5",
                  // Loading shimmer when submitting in instant mode
                  submitting && isSelected && "animate-pulse border-primary/60 bg-primary/5",
                  showResult && isCorrectOption && "border-success bg-success/10",
                  showResult && isSelected && !isCorrectOption && "border-destructive bg-destructive/10",
                  showResult && !isSelected && !isCorrectOption && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium border",
                    effectiveAnswerState === 'unanswered' && !isSelected && "border-muted-foreground/30 text-muted-foreground",
                    effectiveAnswerState === 'unanswered' && isSelected && "border-primary bg-primary text-primary-foreground",
                    showResult && isCorrectOption && "border-success bg-success text-success-foreground",
                    showResult && isSelected && !isCorrectOption && "border-destructive bg-destructive text-destructive-foreground"
                  )}>
                    {String.fromCharCode(65 + optIndex)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {showResult && isCorrectOption && (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  )}
                  {showResult && isSelected && !isCorrectOption && (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Actions row — per-question Submit (non-bulk, non-instant) + Hint button */}
      {effectiveAnswerState === 'unanswered' && !instantFeedback && (
        <div className="flex items-center gap-3">
          {!bulkMode && (
            <Button
              onClick={handleSubmit}
              disabled={!selectedAnswer || submitting}
              className="bg-gradient-primary hover:opacity-90"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </Button>
          )}
          {question.hints && question.hints.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowHints(!showHints)}
              className={cn(
                "text-muted-foreground transition-all duration-200",
                showHints && "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 hover:text-warning"
              )}
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              {showHints ? 'Hide Hint' : 'Need a hint?'}
            </Button>
          )}
        </div>
      )}

      {/* Hint button in instant-feedback mode (before answering) */}
      {effectiveAnswerState === 'unanswered' && instantFeedback && question.hints && question.hints.length > 0 && (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowHints(!showHints)}
            className={cn(
              "text-muted-foreground transition-all duration-200",
              showHints && "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 hover:text-warning"
            )}
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            {showHints ? 'Hide Hint' : 'Need a hint?'}
          </Button>
        </div>
      )}

      {/* Hints (only before answering) */}
      {showHints && effectiveAnswerState === 'unanswered' && question.hints && question.hints.length > 0 && (
        <div className="mt-4 p-4 rounded-lg bg-warning/10 border border-warning/20 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            <h4 className="font-medium text-warning">Hints</h4>
          </div>
          <ul className="space-y-2">
            {question.hints.map((hint, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-warning">•</span>
                {hint}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Explanation (only after answering) */}
      {effectiveAnswerState !== 'unanswered' && (
        <div className="mt-6 border-t pt-6">
          {/* In instant-feedback mode, explanation is auto-expanded */}
          {!instantFeedback && (
            <Button
              variant="ghost"
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full justify-between hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium">AI-Powered Explanation</span>
              </span>
              {showExplanation ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}

          {(showExplanation || instantFeedback) && (
            <div className={cn("space-y-4 animate-slide-up", !instantFeedback && "mt-4")}>
              {/* Step-by-step explanation */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <h4 className="font-medium text-primary mb-2">Step-by-Step Explanation</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {question.explanation}
                </p>
              </div>

              {/* Common mistakes */}
              {question.common_mistakes && question.common_mistakes.length > 0 && (
                <div className="p-4 rounded-lg bg-warning/5 border border-warning/10">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <h4 className="font-medium text-warning">Common Mistakes to Avoid</h4>
                  </div>
                  <ul className="space-y-2">
                    {question.common_mistakes.map((mistake, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-warning">•</span>
                        {mistake}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Encouragement */}
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-sm text-muted-foreground">
                  {effectiveAnswerState === 'correct'
                    ? "🎉 Great job! Keep up the excellent work. Try more questions to strengthen your understanding."
                    : "💪 Don't worry! Learning from mistakes is part of the process. Review the explanation and try similar questions."
                  }
                </p>
              </div>

              {/* Ask Revi Button — only in non-instant mode (instant mode renders it externally) */}
              {!instantFeedback && (
                <div className="flex justify-center pt-2">
                  <Button
                    id="ask-revi-btn"
                    onClick={() => {
                      const isCorrect = effectiveAnswerState === 'correct';
                      const promptText = isCorrect
                        ? `I correctly answered "${effectiveSelectedAnswer}" to the question: "${question.question_text}". Can you expand on this concept and provide deeper insights or real-world applications?`
                        : `I answered "${effectiveSelectedAnswer}" to the question: "${question.question_text}" but the correct answer is "${question.correct_answer}". Can you explain my mistake and why the correct answer is right?`;

                      window.dispatchEvent(
                        new CustomEvent('open-revi-chat', {
                          detail: { message: promptText }
                        })
                      );
                    }}
                    className={cn(
                      "w-full bg-gradient-to-r from-[hsl(175,60%,35%)] to-[hsl(175,55%,45%)]",
                      "text-white shadow-md hover:scale-[1.02] transition-all duration-300",
                      "flex items-center justify-center gap-2"
                    )}
                  >
                    <Sparkles className="h-4 w-4 text-white" />
                    {effectiveAnswerState === 'correct'
                      ? "Ask Revi to expand on this"
                      : "Ask Revi to explain my mistake"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
