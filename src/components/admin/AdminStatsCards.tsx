import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, CreditCard, TrendingUp, Eye } from 'lucide-react';

interface AdminStatsCardsProps {
  totalUsers: number;
  activeUsers: number;
  totalUsage: number;
  totalCreditsRemaining: number;
  todayVisitors?: number;
  totalVisitors?: number;
}

export const AdminStatsCards = ({
  totalUsers,
  activeUsers,
  totalUsage,
  totalCreditsRemaining,
  todayVisitors = 0,
  totalVisitors = 0,
}: AdminStatsCardsProps) => {
  const stats = [
    {
      title: '오늘 방문자',
      value: todayVisitors,
      icon: Eye,
      description: '금일 순 방문자 수',
      highlight: true,
    },
    {
      title: '총 사용자',
      value: totalUsers,
      icon: Users,
      description: '가입한 전체 사용자 수',
    },
    {
      title: '활성 사용자',
      value: activeUsers,
      icon: TrendingUp,
      description: '크레딧 1개 이상 보유',
    },
    {
      title: '총 사용량',
      value: totalUsage,
      icon: Activity,
      description: '전체 Try-On 횟수',
    },
    {
      title: '잔여 크레딧',
      value: totalCreditsRemaining,
      icon: CreditCard,
      description: '시스템 내 총 크레딧',
    },
    {
      title: '총 방문',
      value: totalVisitors,
      icon: Eye,
      description: '전체 방문 세션 수',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.title} className={'highlight' in stat && stat.highlight ? 'border-primary/50 bg-primary/5' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${'highlight' in stat && stat.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
