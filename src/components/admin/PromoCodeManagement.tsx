import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Ticket, Percent, Gift, Coins, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PromoCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_purchase: number | null;
  max_uses: number | null;
  uses_count: number;
  per_user_limit: number;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}

interface PromoCodeUsage {
  id: string;
  code: string;
  users_claimed: number;
  users_used: number;
}

export const PromoCodeManagement = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [promoUsage, setPromoUsage] = useState<PromoCodeUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    max_uses: null as number | null,
    per_user_limit: 1,
    valid_from: '',
    valid_until: '',
  });

  useEffect(() => {
    fetchPromoCodes();
    fetchPromoUsage();
  }, []);

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast.error('프로모 코드 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const fetchPromoUsage = async () => {
    try {
      const { data: userPromoCodes, error } = await supabase
        .from('user_promo_codes')
        .select('promo_code_id, used');

      if (error) throw error;

      const usageMap = new Map<string, { claimed: number; used: number }>();
      
      (userPromoCodes || []).forEach((upc: { promo_code_id: string; used: boolean }) => {
        const current = usageMap.get(upc.promo_code_id) || { claimed: 0, used: 0 };
        current.claimed++;
        if (upc.used) current.used++;
        usageMap.set(upc.promo_code_id, current);
      });

      const usage = Array.from(usageMap.entries()).map(([id, { claimed, used }]) => ({
        id,
        code: '',
        users_claimed: claimed,
        users_used: used,
      }));

      setPromoUsage(usage);
    } catch (error) {
      console.error('Error fetching promo usage:', error);
    }
  };

  const handleCreatePromo = async () => {
    if (!newCode.code.trim()) {
      toast.error('코드명을 입력해주세요');
      return;
    }

    try {
      const { error } = await supabase.from('promo_codes').insert({
        code: newCode.code.toUpperCase(),
        discount_type: newCode.discount_type,
        discount_value: newCode.discount_value,
        max_uses: newCode.max_uses || null,
        per_user_limit: newCode.per_user_limit,
        valid_from: newCode.valid_from || null,
        valid_until: newCode.valid_until || null,
      });

      if (error) throw error;

      toast.success('프로모 코드가 생성되었습니다');
      setIsDialogOpen(false);
      setNewCode({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        max_uses: null,
        per_user_limit: 1,
        valid_from: '',
        valid_until: '',
      });
      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error creating promo code:', error);
      if (error.code === '23505') {
        toast.error('이미 존재하는 코드입니다');
      } else {
        toast.error('프로모 코드 생성에 실패했습니다');
      }
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      setPromoCodes((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !currentActive } : p))
      );
      toast.success(currentActive ? '프로모 코드가 비활성화되었습니다' : '프로모 코드가 활성화되었습니다');
    } catch (error) {
      console.error('Error toggling promo code:', error);
      toast.error('상태 변경에 실패했습니다');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase.from('promo_codes').delete().eq('id', id);

      if (error) throw error;

      setPromoCodes((prev) => prev.filter((p) => p.id !== id));
      toast.success('프로모 코드가 삭제되었습니다');
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast.error('삭제에 실패했습니다');
    }
  };

  const getUsageForPromo = (promoId: string) => {
    return promoUsage.find((u) => u.id === promoId) || { users_claimed: 0, users_used: 0 };
  };

  const getDiscountTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-4 w-4" />;
      case 'fixed':
        return <Coins className="h-4 w-4" />;
      case 'credits':
        return <Gift className="h-4 w-4" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  const getDiscountLabel = (code: PromoCode) => {
    switch (code.discount_type) {
      case 'percentage':
        return `${code.discount_value}% 할인`;
      case 'fixed':
        return `${code.discount_value.toLocaleString()}원 할인`;
      case 'credits':
        return `${code.discount_value} 크레딧`;
      default:
        return code.discount_value.toString();
    }
  };

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          프로모 코드 관리
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              새 프로모 코드
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 프로모 코드 생성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="code">코드명</Label>
                <Input
                  id="code"
                  placeholder="예: WELCOME2024"
                  value={newCode.code}
                  onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_type">할인 유형</Label>
                <Select
                  value={newCode.discount_type}
                  onValueChange={(value) => setNewCode({ ...newCode, discount_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">% 할인</SelectItem>
                    <SelectItem value="fixed">고정 금액 할인</SelectItem>
                    <SelectItem value="credits">크레딧 추가</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_value">
                  {newCode.discount_type === 'percentage'
                    ? '할인율 (%)'
                    : newCode.discount_type === 'fixed'
                    ? '할인 금액 (원)'
                    : '추가 크레딧'}
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  min="1"
                  value={newCode.discount_value}
                  onChange={(e) =>
                    setNewCode({ ...newCode, discount_value: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_uses">최대 사용 횟수 (0=무제한)</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    min="0"
                    value={newCode.max_uses || ''}
                    placeholder="무제한"
                    onChange={(e) =>
                      setNewCode({
                        ...newCode,
                        max_uses: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="per_user_limit">사용자당 제한</Label>
                  <Input
                    id="per_user_limit"
                    type="number"
                    min="1"
                    value={newCode.per_user_limit}
                    onChange={(e) =>
                      setNewCode({ ...newCode, per_user_limit: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid_from">시작일</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={newCode.valid_from}
                    onChange={(e) => setNewCode({ ...newCode, valid_from: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valid_until">종료일</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={newCode.valid_until}
                    onChange={(e) => setNewCode({ ...newCode, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleCreatePromo} className="w-full">
                프로모 코드 생성
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
        ) : promoCodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            등록된 프로모 코드가 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>코드</TableHead>
                  <TableHead>혜택</TableHead>
                  <TableHead>사용 현황</TableHead>
                  <TableHead>유효 기간</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((code) => {
                  const usage = getUsageForPromo(code.id);
                  const expired = isExpired(code.valid_until);
                  return (
                    <TableRow key={code.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDiscountTypeIcon(code.discount_type)}
                          <span className="font-mono font-medium">{code.code}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getDiscountLabel(code)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="text-muted-foreground">클레임: </span>
                          <span className="font-medium">{usage.users_claimed}</span>
                          <span className="mx-1">/</span>
                          <span className="text-muted-foreground">사용: </span>
                          <span className="font-medium">{usage.users_used}</span>
                          {code.max_uses && (
                            <>
                              <span className="mx-1">/</span>
                              <span className="text-muted-foreground">총: </span>
                              <span>{code.max_uses}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {code.valid_from || code.valid_until ? (
                          <div className="text-sm">
                            {code.valid_from && (
                              <div>
                                {format(new Date(code.valid_from), 'yy.MM.dd', { locale: ko })} ~
                              </div>
                            )}
                            {code.valid_until && (
                              <div
                                className={expired ? 'text-destructive' : ''}
                              >
                                {format(new Date(code.valid_until), 'yy.MM.dd', { locale: ko })}
                                {expired && ' (만료)'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">무기한</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {expired ? (
                          <Badge variant="secondary">만료됨</Badge>
                        ) : code.is_active ? (
                          <Badge>활성</Badge>
                        ) : (
                          <Badge variant="outline">비활성</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={code.is_active}
                            onCheckedChange={() => handleToggleActive(code.id, code.is_active)}
                            disabled={expired}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(code.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
