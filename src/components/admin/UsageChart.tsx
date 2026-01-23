import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DailyUsage {
  date: string;
  usage_count: number;
  credits_used: number;
}

interface UsageChartProps {
  data: DailyUsage[];
}

export const UsageChart = ({ data }: UsageChartProps) => {
  const chartData = data
    .slice()
    .reverse()
    .map((item) => ({
      ...item,
      displayDate: format(new Date(item.date), 'M/d', { locale: ko }),
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>일별 사용량 (최근 30일)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="displayDate" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar 
                  dataKey="usage_count" 
                  name="사용 횟수" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              사용 기록이 없습니다
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
