import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useStudy } from '@/context/StudyContext';
import { getTopicById, getCourseById, topics, courses } from '@/data/mockData';
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

const Recommendations: React.FC = () => {
  const { progress } = useStudy();

  // Generate AI-style recommendations based on performance
  const generateRecommendations = () => {
    const recommendations = [];

    // Weak topic recommendations
    progress.weakTopics.forEach(({ topicId, score }) => {
      const topic = getTopicById(topicId);
      if (topic) {
        const course = getCourseById(topic.courseId);
        recommendations.push({
          type: 'weak',
          priority: 'high',
          title: `Focus on ${topic.name}`,
          description: `Your accuracy in this topic is ${score}%. Review the fundamentals and practice more questions.`,
          action: `/practice/${topic.courseId}`,
          actionLabel: 'Practice Now',
          course: course?.name
        });
      }
    });

    // Strength building recommendations
    progress.strongTopics.slice(0, 2).forEach(({ topicId, score }) => {
      const topic = getTopicById(topicId);
      if (topic) {
        const course = getCourseById(topic.courseId);
        recommendations.push({
          type: 'strong',
          priority: 'medium',
          title: `Challenge yourself in ${topic.name}`,
          description: `You're doing great at ${score}%! Try harder questions to deepen your mastery.`,
          action: `/practice/${topic.courseId}`,
          actionLabel: 'Try Harder Questions',
          course: course?.name
        });
      }
    });

    return recommendations;
  };

  const recommendations = generateRecommendations();

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
        <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Your Learning Summary</h3>
              <p className="text-muted-foreground mb-4">
                You've attempted <strong>{progress.totalAttempted}</strong> questions with{' '}
                <strong>{Math.round((progress.correctAnswers / Math.max(progress.totalAttempted, 1)) * 100)}%</strong> accuracy.
                {progress.streakDays > 0 && (
                  <span> You're on a <strong>{progress.streakDays}-day streak</strong> — keep it up!</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
                  {progress.strongTopics.length} Strong Topics
                </span>
                <span className="px-3 py-1 rounded-full bg-warning/10 text-warning text-sm font-medium">
                  {progress.weakTopics.length} Topics to Improve
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Personalized Recommendations */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recommended Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, index) => (
              <div 
                key={index}
                className={cn(
                  "p-6 rounded-xl border transition-all hover:shadow-md",
                  rec.type === 'weak' 
                    ? "bg-warning/5 border-warning/20" 
                    : "bg-success/5 border-success/20"
                )}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    rec.type === 'weak' ? "bg-warning/10" : "bg-success/10"
                  )}>
                    {rec.type === 'weak' ? (
                      <TrendingUp className="h-5 w-5 text-warning" />
                    ) : (
                      <Target className="h-5 w-5 text-success" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className={cn(
                      "text-xs font-medium uppercase tracking-wide",
                      rec.type === 'weak' ? "text-warning" : "text-success"
                    )}>
                      {rec.priority} priority
                    </span>
                    <h3 className="font-semibold mt-1">{rec.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rec.course}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {rec.description}
                </p>
                <Link to={rec.action}>
                  <Button size="sm" variant="outline" className="w-full group">
                    {rec.actionLabel}
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
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
              <span className="text-sm">Current: {Math.round(progress.totalAttempted / 4)}/week</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm">Goal: 20/week</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Recommendations;
