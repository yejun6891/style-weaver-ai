import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface UsageTypeData {
  action_type: string;
  count: number;
  total_credits: number;
}

interface UsageTypeChartProps {
  data: UsageTypeData[];
}

// Vibrant, distinct colors for each action type
const COLORS = [
  'hsl(265 84% 58%)', // vibrant purple - 상의 피팅
  'hsl(199 89% 48%)', // bright blue - 하의 피팅  
  'hsl(145 80% 42%)', // vivid green - 전체 코디
  'hsl(340 82% 52%)', // bright pink - 기본 피팅
  'hsl(39 100% 50%)', // bright orange/yellow
];

// User-friendly labels matching the UI terminology
const ACTION_TYPE_LABELS: Record<string, string> = {
  virtual_tryon: '👕 기본 피팅',
  virtual_tryon_top: '👔 상의 피팅',
  virtual_tryon_bottom: '👖 하의 피팅',
  virtual_tryon_full: '👗 전체 코디',
};

export const UsageTypeChart = ({ data }: UsageTypeChartProps) => {
  const chartData = data.map((item) => ({
    name: ACTION_TYPE_LABELS[item.action_type] || item.action_type,
    value: item.count,
    credits: item.total_credits,
  }));

  const totalUsage = data.reduce((sum, item) => sum + item.count, 0);

  return (
<Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 피팅 모드별 사용량
          <span className="text-xs font-normal text-muted-foreground">
            (어떤 피팅을 가장 많이 사용했는지)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => 
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {chartData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value}회`, '사용 횟수']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              사용 기록이 없습니다
            </div>
          )}
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          총 {totalUsage.toLocaleString()}회 사용
        </div>
      </CardContent>
    </Card>
  );
};
