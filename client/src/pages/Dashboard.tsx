import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import StatCard from '@/components/dashboard/StatCard';
import ProgressChart from '@/components/dashboard/ProgressChart';

import { useStudy } from '@/context/StudyContext';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Flame, 
  ChevronRight,
  Target,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient, Course, UserProfile } from '@/services/api.client';
import { useApi } from '@/hooks/useApi';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { progress, weeklyActivity, loading: contextLoading } = useStudy();
  const { data: courses, execute: fetchCourses } = useApi(apiClient.getCourses);
  const { data: weakTopics } = useApi(apiClient.getWeakTopics);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    apiClient.getProfile().then(setProfile).catch(() => {});
  }, [user]);

  const welcomeName = profile?.display_name?.trim();

  const accuracy = progress && progress.total_attempted > 0 
    ? Math.round((progress.correct_answers / progress.total_attempted) * 100) 
    : 0;

  if (contextLoading || !progress) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            {welcomeName ? `Welcome back, ${welcomeName}! ` : 'Welcome back!'}
          </h1>
          <p className="text-muted-foreground">
            Track your progress and continue your learning journey.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Questions Attempted"
            value={progress.total_attempted}
            subtitle="Total practice questions"
            icon={BookOpen}
            variant="primary"
          />
          <StatCard
            title="Correct Answers"
            value={progress.correct_answers}
            subtitle={`${accuracy}% accuracy`}
            icon={CheckCircle}
            variant="success"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Wrong Answers"
            value={progress.wrong_answers}
            subtitle="Review these topics"
            icon={XCircle}
            variant="warning"
          />
          <StatCard
            title="Study Streak"
            value={`${progress.streak_days} days`}
            subtitle="Keep it going!"
            icon={Flame}
            variant="accent"
          />
        </div>

        {/* Charts Row */}
        <div>
          <ProgressChart data={weeklyActivity} />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Continue Learning</h2>
            <Link to="/notes">
              <Button variant="ghost" className="text-primary">
                Study Notes
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(courses || []).map(course => (
              <Link
                key={course.id}
                to={`/practice/${course.id}`}
                className="group p-4 rounded-xl border bg-card hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{course.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{course.code}</p>
                    <p className="font-medium truncate group-hover:text-primary transition-colors">
                      {course.name}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Focus on Weak Areas</h3>
                <p className="text-sm text-muted-foreground">
                  {weakTopics && weakTopics.length > 0 ? (
                    <>Based on your performance, consider reviewing <strong>{weakTopics[0].topic_name}</strong>{weakTopics.length > 1 && ` and ${weakTopics.length - 1} other topic${weakTopics.length > 2 ? 's' : ''}`}.</>
                  ) : (
                    'Keep practicing to identify areas for improvement.'
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">You're Improving!</h3>
                <p className="text-sm text-muted-foreground">
                  Your accuracy is {accuracy}%. Keep practicing to maintain this momentum!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
