import React from 'react';
import { Link } from 'react-router-dom';
import { Course, getQuestionsByCourse, getTopicsByCourse } from '@/data/mockData';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseCardProps {
  course: Course;
}

const colorStyles = {
  primary: 'from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40',
  accent: 'from-accent/10 to-accent/5 border-accent/30 hover:border-accent/50',
  success: 'from-success/10 to-success/5 border-success/20 hover:border-success/40',
  warning: 'from-warning/10 to-warning/5 border-warning/20 hover:border-warning/40',
};

const iconBgStyles = {
  primary: 'bg-primary/10',
  accent: 'bg-accent/20',
  success: 'bg-success/10',
  warning: 'bg-warning/10',
};

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const topics = getTopicsByCourse(course.id);
  const questions = getQuestionsByCourse(course.id);
  const color = course.color as keyof typeof colorStyles;

  return (
    <Link 
      to={`/practice/${course.id}`}
      className={cn(
        "block p-6 rounded-xl border-2 bg-gradient-to-br transition-all duration-300 hover:shadow-lg group",
        colorStyles[color] || colorStyles.primary
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className={cn(
            "inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl",
            iconBgStyles[color] || iconBgStyles.primary
          )}>
            {course.icon}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {course.code}
            </p>
            <h3 className="text-lg font-semibold mt-1 group-hover:text-primary transition-colors">
              {course.name}
            </h3>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
      
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
        <div className="text-sm">
          <span className="font-semibold text-foreground">{topics.length}</span>
          <span className="text-muted-foreground ml-1">Topics</span>
        </div>
        <div className="text-sm">
          <span className="font-semibold text-foreground">{questions.length}</span>
          <span className="text-muted-foreground ml-1">Questions</span>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
