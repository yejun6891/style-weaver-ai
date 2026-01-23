import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, CreditCard, TrendingUp } from 'lucide-react';

interface AdminStatsCardsProps {
  totalUsers: number;
  activeUsers: number;
  totalUsage: number;
  totalCreditsRemaining: number;
}

export const AdminStatsCards = ({
  totalUsers,
  activeUsers,
  totalUsage,
  totalCreditsRemaining,
}: AdminStatsCardsProps) => {
  const stats = [
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
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
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
