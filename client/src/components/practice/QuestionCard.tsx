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
}

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

const difficultyColors = {
  easy: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  hard: 'bg-destructive/10 text-destructive border-destructive/20',
};

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index }) => {
  const { hasAttempted, recordAttempt, getQuestionAttempt } = useStudy();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const previousAttempt = getQuestionAttempt(question.id);
  const alreadyAttempted = hasAttempted(question.id);

  // If already attempted, show that state
  React.useEffect(() => {
    if (previousAttempt) {
      setSelectedAnswer(previousAttempt.student_answer);
      setAnswerState(previousAttempt.is_correct ? 'correct' : 'incorrect');
    }
  }, [previousAttempt]);

  const handleSubmit = async () => {
    if (!selectedAnswer || submitting) return;
    
    setSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    try {
      const isCorrect = await recordAttempt(question.id, selectedAnswer, timeSpent);
      setAnswerState(isCorrect ? 'correct' : 'incorrect');
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'Failed to submit your answer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (answerState !== 'unanswered') return;
    setSelectedAnswer(option);
  };

  return (
    <div className={cn(
      "question-card animate-fade-in",
      answerState === 'correct' && "question-card-correct",
      answerState === 'incorrect' && "question-card-incorrect"
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
        {answerState !== 'unanswered' && (
          <div className={cn(
            "flex items-center gap-1.5 text-sm font-medium",
            answerState === 'correct' ? "text-success" : "text-destructive"
          )}>
            {answerState === 'correct' ? (
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
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === question.correct_answer;
            const showResult = answerState !== 'unanswered';
            
            return (
              <button
                key={optIndex}
                onClick={() => handleOptionSelect(option)}
                disabled={answerState !== 'unanswered'}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                  answerState === 'unanswered' && !isSelected && "border-border hover:border-primary/50 hover:bg-muted/50",
                  answerState === 'unanswered' && isSelected && "border-primary bg-primary/5",
                  showResult && isCorrectOption && "border-success bg-success/10",
                  showResult && isSelected && !isCorrectOption && "border-destructive bg-destructive/10",
                  showResult && !isSelected && !isCorrectOption && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium border",
                    answerState === 'unanswered' && !isSelected && "border-muted-foreground/30 text-muted-foreground",
                    answerState === 'unanswered' && isSelected && "border-primary bg-primary text-primary-foreground",
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

      {/* Actions */}
      {answerState === 'unanswered' && (
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSubmit}
            disabled={!selectedAnswer || submitting}
            className="bg-gradient-primary hover:opacity-90"
          >
            {submitting ? 'Submitting...' : 'Submit Answer'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowHints(!showHints)}
            className="text-muted-foreground"
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Need a hint?
          </Button>
        </div>
      )}

      {/* Hints (only before answering) */}
      {showHints && answerState === 'unanswered' && question.hints && question.hints.length > 0 && (
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
      {answerState !== 'unanswered' && (
        <div className="mt-6 border-t pt-6">
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
          
          {showExplanation && (
            <div className="mt-4 space-y-4 animate-slide-up">
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
                  {answerState === 'correct' 
                    ? "🎉 Great job! Keep up the excellent work. Try more questions to strengthen your understanding."
                    : "💪 Don't worry! Learning from mistakes is part of the process. Review the explanation and try similar questions."
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
