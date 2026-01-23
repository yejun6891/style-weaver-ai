import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Minus, Coins } from 'lucide-react';
import { toast } from 'sonner';

interface UserWithUsage {
  user_id: string;
  email: string | null;
  display_name: string | null;
  credits: number;
  created_at: string;
  usage_count: number;
}

interface UserListTableProps {
  users: UserWithUsage[];
  onUserUpdated?: () => void;
}

const ITEMS_PER_PAGE = 10;

export const UserListTable = ({ users, onUserUpdated }: UserListTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserWithUsage | null>(null);
  const [creditAmount, setCreditAmount] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.display_name?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const openCreditDialog = (user: UserWithUsage) => {
    setSelectedUser(user);
    setCreditAmount(1);
    setIsDialogOpen(true);
  };

  const handleCreditChange = async (action: 'add' | 'subtract') => {
    if (!selectedUser || creditAmount <= 0) return;

    setIsUpdating(true);
    try {
      const newCredits = action === 'add' 
        ? selectedUser.credits + creditAmount 
        : Math.max(0, selectedUser.credits - creditAmount);

      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast.success(
        action === 'add' 
          ? `${creditAmount} 크레딧이 추가되었습니다` 
          : `${creditAmount} 크레딧이 차감되었습니다`
      );

      setIsDialogOpen(false);
      onUserUpdated?.();
    } catch (error) {
      console.error('Error updating credits:', error);
      toast.error('크레딧 변경에 실패했습니다');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>사용자 목록</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="이메일 또는 이름 검색..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이메일</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead className="text-right">크레딧</TableHead>
                  <TableHead className="text-right">사용 횟수</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">
                        {user.email || '-'}
                      </TableCell>
                      <TableCell>{user.display_name || '-'}</TableCell>
                      <TableCell className="text-right">{user.credits}</TableCell>
                      <TableCell className="text-right">{user.usage_count}</TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), 'yyyy.MM.dd', { locale: ko })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCreditDialog(user)}
                        >
                          <Coins className="h-4 w-4 mr-1" />
                          크레딧
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {searchTerm ? '검색 결과가 없습니다' : '사용자가 없습니다'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      const diff = Math.abs(page - currentPage);
                      return diff === 0 || diff === 1 || page === 1 || page === totalPages;
                    })
                    .map((page, index, array) => {
                      const showEllipsis = index > 0 && page - array[index - 1] > 1;
                      return (
                        <span key={page} className="flex items-center">
                          {showEllipsis && (
                            <PaginationItem>
                              <span className="px-2">...</span>
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </span>
                      );
                    })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          <div className="mt-2 text-sm text-muted-foreground">
            총 {filteredUsers.length}명의 사용자
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>크레딧 관리</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">사용자</div>
                <div className="font-medium">{selectedUser.email || selectedUser.display_name}</div>
                <div className="mt-2 text-sm text-muted-foreground">현재 크레딧</div>
                <div className="text-2xl font-bold">{selectedUser.credits}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="creditAmount">변경할 크레딧 수</Label>
                <Input
                  id="creditAmount"
                  type="number"
                  min="1"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleCreditChange('add')}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  추가
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleCreditChange('subtract')}
                  disabled={isUpdating || selectedUser.credits === 0}
                  className="flex-1"
                >
                  <Minus className="h-4 w-4 mr-1" />
                  차감
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
