import React, { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CourseCard from '@/components/practice/CourseCard';
import { BookOpen, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { apiClient, Course } from '@/services/api.client';
import { useApi } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';

const Practice: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const { data: courses, loading, error, execute } = useApi(apiClient.getCourses);

  useEffect(() => {
    execute();
  }, []);

  const filteredCourses = (courses || []).filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Practice Questions</h1>
            </div>
            <p className="text-muted-foreground">
              Select a course to start practicing past exam questions
            </p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Reminder Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <p className="text-sm text-center">
            📚 <strong>Learning Mode Active:</strong> You must attempt each question before viewing explanations. 
            This helps reinforce genuine understanding!
          </p>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No courses found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Practice;
