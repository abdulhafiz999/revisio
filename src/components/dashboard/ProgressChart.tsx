import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface ProgressChartProps {
  data: {
    date: string;
    questionsAttempted: number;
    correctAnswers: number;
  }[];
}

const ProgressChart: React.FC<ProgressChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
  })).reverse();

  return (
    <div className="bg-card rounded-xl border p-6">
      <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAttempted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(175, 60%, 35%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(175, 60%, 35%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCorrect" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 88%)" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 15%, 45%)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 15%, 45%)', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(210, 20%, 88%)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area
              type="monotone"
              dataKey="questionsAttempted"
              stroke="hsl(175, 60%, 35%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAttempted)"
              name="Attempted"
            />
            <Area
              type="monotone"
              dataKey="correctAnswers"
              stroke="hsl(152, 60%, 40%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCorrect)"
              name="Correct"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Attempted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-sm text-muted-foreground">Correct</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;
