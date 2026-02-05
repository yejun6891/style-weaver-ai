import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { UsageChart } from '@/components/admin/UsageChart';
import { UsageTypeChart } from '@/components/admin/UsageTypeChart';
import { UserListTable } from '@/components/admin/UserListTable';
import { PromoCodeManagement } from '@/components/admin/PromoCodeManagement';
import FeedbackManagement from '@/components/admin/FeedbackManagement';
import BrandSurveyResults from '@/components/admin/BrandSurveyResults';
import Logo from '@/components/Logo';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, ClipboardList } from 'lucide-react';

// Helper: get today's date in YYYY-MM-DD format (Korea time)
const getTodayKST = () => {
  const now = new Date();
  const kstOffset = 9 * 60; // Korea is UTC+9
  const kst = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);
  return kst.toISOString().split('T')[0];
};

interface DailyUsage {
  date: string;
  usage_count: number;
  credits_used: number;
}

interface UsageTypeData {
  action_type: string;
  count: number;
  total_credits: number;
}

interface UserWithUsage {
  user_id: string;
  email: string | null;
  display_name: string | null;
  credits: number;
  created_at: string;
  usage_count: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalUsage: 0,
    totalCreditsRemaining: 0,
    todayVisitors: 0,
    totalVisitors: 0,
  });
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [usageByType, setUsageByType] = useState<UsageTypeData[]>([]);
  const [users, setUsers] = useState<UserWithUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchDailyUsage(),
        fetchUsageByType(),
        fetchUsersWithUsage(),
        fetchVisitorStats(),
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitorStats = async () => {
    const today = getTodayKST();
    
    // Fetch today's unique visitors
    const { data: todayData } = await supabase
      .from('visitor_logs')
      .select('session_id')
      .gte('created_at', `${today}T00:00:00+09:00`);
    
    // Count unique sessions for today
    const todayUniqueSessions = new Set(todayData?.map(v => v.session_id) || []);
    
    // Fetch total visitor count
    const { count: totalCount } = await supabase
      .from('visitor_logs')
      .select('*', { count: 'exact', head: true });
    
    setStats(prev => ({
      ...prev,
      todayVisitors: todayUniqueSessions.size,
      totalVisitors: totalCount || 0,
    }));
  };

  const fetchStats = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('credits');

    const { data: usage } = await supabase
      .from('usage_history')
      .select('credits_used');

    if (profiles) {
      setStats(prev => ({
        ...prev,
        totalUsers: profiles.length,
        activeUsers: profiles.filter((p) => p.credits > 0).length,
        totalUsage: usage?.length || 0,
        totalCreditsRemaining: profiles.reduce((sum, p) => sum + p.credits, 0),
      }));
    }
  };

  const fetchDailyUsage = async () => {
    const { data } = await supabase
      .from('usage_history')
      .select('created_at, credits_used')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (data) {
      const grouped = data.reduce((acc: Record<string, { count: number; credits: number }>, item) => {
        const date = item.created_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = { count: 0, credits: 0 };
        }
        acc[date].count += 1;
        acc[date].credits += item.credits_used;
        return acc;
      }, {});

      const dailyData = Object.entries(grouped)
        .map(([date, { count, credits }]) => ({
          date,
          usage_count: count,
          credits_used: credits,
        }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30);

      setDailyUsage(dailyData);
    }
  };

  const fetchUsageByType = async () => {
    const { data } = await supabase
      .from('usage_history')
      .select('action_type, credits_used');

    if (data) {
      const grouped = data.reduce((acc: Record<string, { count: number; credits: number }>, item) => {
        const type = item.action_type;
        if (!acc[type]) {
          acc[type] = { count: 0, credits: 0 };
        }
        acc[type].count += 1;
        acc[type].credits += item.credits_used;
        return acc;
      }, {});

      const typeData = Object.entries(grouped).map(([action_type, { count, credits }]) => ({
        action_type,
        count,
        total_credits: credits,
      }));

      setUsageByType(typeData);
    }
  };

  const fetchUsersWithUsage = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email, display_name, credits, created_at')
      .order('created_at', { ascending: false });

    const { data: usage } = await supabase
      .from('usage_history')
      .select('user_id');

    if (profiles) {
      const usageCountMap = (usage || []).reduce((acc: Record<string, number>, item) => {
        acc[item.user_id] = (acc[item.user_id] || 0) + 1;
        return acc;
      }, {});

      const usersWithUsage = profiles.map((profile) => ({
        ...profile,
        usage_count: usageCountMap[profile.user_id] || 0,
      }));

      setUsers(usersWithUsage);
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Admin</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">관리자 대시보드</h1>
          <p className="text-muted-foreground mt-1">서비스 현황 및 사용자 관리</p>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-[400px]" />
              <Skeleton className="h-[400px]" />
            </div>
            <Skeleton className="h-[500px]" />
          </div>
        ) : (
          <>
            <AdminStatsCards
              totalUsers={stats.totalUsers}
              activeUsers={stats.activeUsers}
              totalUsage={stats.totalUsage}
              totalCreditsRemaining={stats.totalCreditsRemaining}
              todayVisitors={stats.todayVisitors}
              totalVisitors={stats.totalVisitors}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <UsageChart data={dailyUsage} />
              <UsageTypeChart data={usageByType} />
            </div>

            <PromoCodeManagement />

            <FeedbackManagement />

            {/* Brand Survey Results */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">브랜드 선호도 조사 결과</h2>
              </div>
              <BrandSurveyResults />
            </div>

            <UserListTable users={users} onUserUpdated={fetchAllData} />
          </>
        )}
      </main>
    </div>
  );
};

export default Admin;
