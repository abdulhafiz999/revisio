import React from 'react';
import { getTopicById } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TopicStrengthProps {
  weakTopics: { topicId: string; score: number }[];
  strongTopics: { topicId: string; score: number }[];
}

const TopicStrength: React.FC<TopicStrengthProps> = ({ weakTopics, strongTopics }) => {
  return (
    <div className="bg-card rounded-xl border p-6">
      <h3 className="text-lg font-semibold mb-6">Topic Analysis</h3>
      
      <div className="space-y-6">
        {/* Strong Topics */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-success" />
            <h4 className="text-sm font-medium text-success">Strong Topics</h4>
          </div>
          <div className="space-y-3">
            {strongTopics.slice(0, 3).map(({ topicId, score }) => {
              const topic = getTopicById(topicId);
              return (
                <div key={topicId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{topic?.name || topicId}</span>
                    <span className="font-medium text-success">{score}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill bg-gradient-success"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weak Topics */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-warning" />
            <h4 className="text-sm font-medium text-warning">Needs Improvement</h4>
          </div>
          <div className="space-y-3">
            {weakTopics.slice(0, 3).map(({ topicId, score }) => {
              const topic = getTopicById(topicId);
              return (
                <div key={topicId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{topic?.name || topicId}</span>
                    <span className="font-medium text-warning">{score}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill bg-warning"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicStrength;
