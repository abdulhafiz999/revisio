import React, { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useStudy } from '@/context/StudyContext';
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  BookOpen, 
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { apiClient, Recommendation } from '@/services/api.client';
import { useApi } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';

const Recommendations: React.FC = () => {
  const { progress } = useStudy();
  const { data: recommendations, loading, execute: fetchRecommendations } = useApi(apiClient.getRecommendations);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const studyTips = [
    {
      icon: Clock,
      title: 'Space Your Practice',
      description: 'Study in short, focused sessions spread across multiple days rather than cramming.'
    },
    {
      icon: Target,
      title: 'Active Recall',
      description: 'Test yourself on concepts before reviewing the material. This strengthens memory.'
    },
    {
      icon: BookOpen,
      title: 'Understand, Don\'t Memorize',
      description: 'Focus on understanding the "why" behind concepts. This makes application easier.'
    },
    {
      icon: CheckCircle2,
      title: 'Review Mistakes',
      description: 'Spend extra time on questions you got wrong. These are your biggest learning opportunities.'
    }
  ];

  const accuracy = progress && progress.total_attempted > 0
    ? Math.round((progress.correct_answers / progress.total_attempted) * 100)
    : 0;

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-accent" />
            <h1 className="text-2xl font-bold">AI Study Recommendations</h1>
          </div>
          <p className="text-muted-foreground">
            Personalized suggestions based on your learning progress
          </p>
        </div>

        {/* Performance Summary */}
        {progress && (
          <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Your Learning Summary</h3>
                <p className="text-muted-foreground mb-4">
                  You've attempted <strong>{progress.total_attempted}</strong> questions with{' '}
                  <strong>{accuracy}%</strong> accuracy.
                  {progress.streak_days > 0 && (
                    <span> You're on a <strong>{progress.streak_days}-day streak</strong> - keep it up!</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Personalized Recommendations */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recommended Actions</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className="p-6 rounded-xl border bg-warning/5 border-warning/20 transition-all hover:shadow-md"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <TrendingUp className="h-5 w-5 text-warning" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-warning">
                        High priority
                      </span>
                      <h3 className="font-semibold mt-1">{rec.topic_name}</h3>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Focus Areas:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {rec.suggested_focus_areas.map((area, i) => (
                          <li key={i}>• {area}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Study Tips:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {rec.study_tips.map((tip, i) => (
                          <li key={i}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Estimated time:</strong> {rec.estimated_time}
                    </p>
                  </div>
                  <Link to="/practice">
                    <Button size="sm" variant="outline" className="w-full group">
                      Practice Now
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Keep practicing to get personalized recommendations!
              </p>
            </div>
          )}
        </div>

        {/* Study Tips */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Study Tips for Better Learning</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studyTips.map((tip, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-5 rounded-xl border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="p-2 rounded-lg bg-muted">
                  <tip.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tip.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Goal Suggestion */}
        {progress && (
          <div className="p-6 rounded-xl border bg-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/20">
                <Target className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="font-semibold">Suggested Weekly Goal</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Based on your current pace, we recommend practicing <strong>20 questions</strong> per week 
              with at least <strong>75% accuracy</strong> to steadily improve your weak areas.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm">Current: {Math.round(progress.total_attempted / 4)}/week</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm">Goal: 20/week</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Recommendations;
