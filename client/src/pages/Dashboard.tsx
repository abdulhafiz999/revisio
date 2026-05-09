import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import ProgressChart from '@/components/dashboard/ProgressChart';
import TopicStrength from '@/components/dashboard/TopicStrength';
import { useStudy } from '@/context/StudyContext';
import { courses } from '@/data/mockData';
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

const Dashboard: React.FC = () => {
  const { progress } = useStudy();
  const accuracy = progress.totalAttempted > 0 
    ? Math.round((progress.correctAnswers / progress.totalAttempted) * 100) 
    : 0;

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Welcome back! 👋</h1>
          <p className="text-muted-foreground">
            Track your progress and continue your learning journey.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Questions Attempted"
            value={progress.totalAttempted}
            subtitle="Total practice questions"
            icon={BookOpen}
            variant="primary"
          />
          <StatCard
            title="Correct Answers"
            value={progress.correctAnswers}
            subtitle={`${accuracy}% accuracy`}
            icon={CheckCircle}
            variant="success"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Wrong Answers"
            value={progress.wrongAnswers}
            subtitle="Review these topics"
            icon={XCircle}
            variant="warning"
          />
          <StatCard
            title="Study Streak"
            value={`${progress.streakDays} days`}
            subtitle="Keep it going!"
            icon={Flame}
            variant="accent"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProgressChart data={progress.recentActivity} />
          </div>
          <TopicStrength 
            weakTopics={progress.weakTopics}
            strongTopics={progress.strongTopics}
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Continue Learning</h2>
            <Link to="/practice">
              <Button variant="ghost" className="text-primary">
                View all courses
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {courses.map(course => (
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
                  Based on your performance, consider reviewing <strong>Sequences and Series</strong> and <strong>Algorithms</strong>.
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
                  Your accuracy has increased by 12% this week. Keep practicing to maintain this momentum!
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
