import React, { useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useStudy } from '@/context/StudyContext';
import { 
  BarChart3, 
  Target, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Zap,
  Calendar,
  Trophy,
  Medal,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { apiClient, WeeklyActivityDay } from '@/services/api.client';
import { useApi } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  isUnlocked: boolean;
  progressText: string;
  category: 'streak' | 'accuracy' | 'volume';
}

const Analytics: React.FC = () => {
  const { progress, refreshProgress } = useStudy();
  const { data: weeklyActivity, loading: loadingWeekly, execute: fetchWeekly } = useApi(apiClient.getWeeklyActivity);

  useEffect(() => {
    refreshProgress();
    fetchWeekly();
  }, []);

  const accuracy = progress && progress.total_attempted > 0
    ? Math.round((progress.correct_answers / progress.total_attempted) * 100)
    : 0;


  // Achievements calculation
  const achievements: Achievement[] = useMemo(() => {
    if (!progress) return [];

    const total = progress.total_attempted || 0;
    const streak = progress.streak_days || 0;

    return [
      {
        id: 'first_step',
        title: 'First Step',
        description: 'Completed your first practice question',
        icon: Zap,
        isUnlocked: total >= 1,
        progressText: total >= 1 ? 'Unlocked!' : `${total}/1 completed`,
        category: 'volume'
      },
      {
        id: 'getting_warm',
        title: 'Getting Warm',
        description: 'Maintained a 3-day study streak',
        icon: Flame,
        isUnlocked: streak >= 3,
        progressText: streak >= 3 ? 'Unlocked!' : `${streak}/3 days`,
        category: 'streak'
      },
      {
        id: 'on_fire',
        title: 'Unstoppable',
        description: 'Maintained a 7-day study streak',
        icon: Trophy,
        isUnlocked: streak >= 7,
        progressText: streak >= 7 ? 'Unlocked!' : `${streak}/7 days`,
        category: 'streak'
      },
      {
        id: 'sharpshooter',
        title: 'Sharpshooter',
        description: 'Achieved 80%+ accuracy with 10+ questions attempted',
        icon: Target,
        isUnlocked: accuracy >= 80 && total >= 10,
        progressText: accuracy >= 80 && total >= 10 ? 'Unlocked!' : `${accuracy}% / 80% accuracy`,
        category: 'accuracy'
      },
      {
        id: 'century',
        title: 'Century Club',
        description: 'Attempted 100 total practice questions',
        icon: Medal,
        isUnlocked: total >= 100,
        progressText: total >= 100 ? 'Unlocked!' : `${total}/100 attempted`,
        category: 'volume'
      },
      {
        id: 'mastermind',
        title: 'Mastermind',
        description: 'Attempted 250+ questions with over 75% accuracy',
        icon: Award,
        isUnlocked: total >= 250 && accuracy >= 75,
        progressText: total >= 250 && accuracy >= 75 ? 'Unlocked!' : `${total}/250 completed`,
        category: 'accuracy'
      }
    ];
  }, [progress, accuracy]);

  const unlockedCount = useMemo(() => achievements.filter(a => a.isUnlocked).length, [achievements]);

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-primary" />
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Performance Analytics</h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              Deep-dive metrics, practice history trends, and milestone badges
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border shadow-sm">
            <Trophy className="h-5 w-5 text-warning" />
            <span className="text-sm font-semibold">
              {unlockedCount} / {achievements.length} Badges Unlocked
            </span>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-card border shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overall Accuracy</span>
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">{accuracy}%</div>
            <p className="text-xs text-muted-foreground">
              Based on {progress?.total_attempted || 0} total attempts
            </p>
          </div>

          <div className="p-5 rounded-xl bg-card border shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Streak</span>
              <Flame className="h-5 w-5 text-warning" />
            </div>
            <div className="text-3xl font-bold">{progress?.streak_days || 0} Days</div>
            <p className="text-xs text-muted-foreground">
              {progress?.streak_days ? 'Keep the momentum going!' : 'Practice today to start a streak'}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-card border shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Correct Answers</span>
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div className="text-3xl font-bold text-success">{progress?.correct_answers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Mastered concepts
            </p>
          </div>

          <div className="p-5 rounded-xl bg-card border shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Needs Review</span>
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="text-3xl font-bold text-destructive">{progress?.wrong_answers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Learning opportunities
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div>
          {/* Practice Volume Chart */}
          <div className="p-6 rounded-xl bg-card border shadow-sm flex flex-col justify-between">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Weekly Practice Volume
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Questions attempted over the last 7 days
              </p>
            </div>

            <div className="h-64 w-full">
              {loadingWeekly ? (
                <Skeleton className="w-full h-full rounded-lg" />
              ) : weeklyActivity && weeklyActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Bar dataKey="attempted" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" name="Attempted" />
                    <Bar dataKey="correct" radius={[6, 6, 0, 0]} fill="hsl(var(--success))" name="Correct" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No activity recorded yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Milestone & Achievements Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Study Milestones & Achievements</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((item) => {
              const IconComp = item.icon;
              return (
                <div 
                  key={item.id}
                  className={cn(
                    "p-5 rounded-xl border transition-all duration-200 flex items-start gap-4",
                    item.isUnlocked 
                      ? "bg-card border-primary/30 shadow-sm" 
                      : "bg-muted/30 border-border/60 opacity-60"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-xl flex-shrink-0",
                    item.isUnlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <IconComp className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-base truncate">{item.title}</h4>
                      {item.isUnlocked && (
                        <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                          Unlocked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                    <div className="pt-2 text-xs font-medium text-muted-foreground">
                      {item.progressText}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Analytics;
