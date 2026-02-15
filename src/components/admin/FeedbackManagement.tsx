import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Send,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  User,
  Shield,
} from "lucide-react";

interface Ticket {
  id: string;
  user_id: string;
  category: string;
  title: string;
  content: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

interface Reply {
  id: string;
  user_id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
}

interface Attachment {
  id: string;
  file_url: string;
  file_name: string;
}

const FeedbackManagement = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newReply, setNewReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      // Fetch tickets with user emails
      const { data: ticketsData, error } = await supabase
        .from("feedback_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user emails from profiles
      const userIds = [...new Set((ticketsData || []).map((t) => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);

      const emailMap = new Map(profiles?.map((p) => [p.user_id, p.email]) || []);

      const ticketsWithEmail = (ticketsData || []).map((t) => ({
        ...t,
        user_email: emailMap.get(t.user_id) || "Unknown",
      }));

      setTickets(ticketsWithEmail);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const [{ data: repliesData }, { data: attachmentsData }] = await Promise.all([
        supabase
          .from("feedback_replies")
          .select("*")
          .eq("ticket_id", ticketId)
          .order("created_at", { ascending: true }),
        supabase.from("feedback_attachments").select("*").eq("ticket_id", ticketId),
      ]);

      setReplies(repliesData || []);

      // Generate signed URLs for attachments (bucket is private)
      const attachmentsWithSignedUrls = await Promise.all(
        (attachmentsData || []).map(async (att) => {
          const { data } = await supabase.storage
            .from("feedback-attachments")
            .createSignedUrl(att.file_url, 3600);
          return { ...att, file_url: data?.signedUrl || att.file_url };
        })
      );
      setAttachments(attachmentsWithSignedUrls);
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("feedback_tickets")
        .update({ status: newStatus })
        .eq("id", ticketId);

      if (error) throw error;

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
      toast.success("상태가 변경되었습니다");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("상태 변경 실패");
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from("feedback_tickets")
        .update({ priority: newPriority })
        .eq("id", ticketId);

      if (error) throw error;

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, priority: newPriority } : t))
      );
      toast.success("우선순위가 변경되었습니다");
    } catch (error) {
      console.error("Error updating priority:", error);
      toast.error("우선순위 변경 실패");
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !newReply.trim()) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("feedback_replies").insert({
        ticket_id: selectedTicket.id,
        user_id: user.id,
        content: newReply.trim(),
        is_admin: true,
      });

      if (error) throw error;

      setNewReply("");
      fetchTicketDetails(selectedTicket.id);
      toast.success("답변이 전송되었습니다");
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("답변 전송 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const openTicketDialog = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    await fetchTicketDetails(ticket.id);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      bug: "버그 신고",
      feature: "기능 요청",
      inquiry: "일반 문의",
      other: "기타",
    };
    return labels[category] || category;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      pending: { label: "대기중", variant: "secondary", icon: <Clock className="w-3 h-3" /> },
      in_progress: { label: "처리중", variant: "default", icon: <AlertCircle className="w-3 h-3" /> },
      resolved: { label: "완료", variant: "outline", icon: <CheckCircle className="w-3 h-3" /> },
      closed: { label: "종료", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
    };
    return configs[status] || configs.pending;
  };

  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      low: { label: "낮음", color: "text-green-500" },
      medium: { label: "중간", color: "text-yellow-500" },
      high: { label: "높음", color: "text-red-500" },
    };
    return configs[priority] || configs.medium;
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
    if (categoryFilter !== "all" && ticket.category !== categoryFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        ticket.title.toLowerCase().includes(search) ||
        ticket.content.toLowerCase().includes(search) ||
        ticket.user_email?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          피드백 관리
        </h2>
        <Badge variant="outline">{tickets.length}개</Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="검색..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="pending">대기중</SelectItem>
            <SelectItem value="in_progress">처리중</SelectItem>
            <SelectItem value="resolved">완료</SelectItem>
            <SelectItem value="closed">종료</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="bug">버그 신고</SelectItem>
            <SelectItem value="feature">기능 요청</SelectItem>
            <SelectItem value="inquiry">일반 문의</SelectItem>
            <SelectItem value="other">기타</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ticket List */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          피드백이 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const statusConfig = getStatusConfig(ticket.status);
            const priorityConfig = getPriorityConfig(ticket.priority);
            const isExpanded = expandedTicket === ticket.id;

            return (
              <div
                key={ticket.id}
                className="border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                  className="w-full text-left p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(ticket.category)}
                        </Badge>
                        <Badge variant={statusConfig.variant} className="text-xs flex items-center gap-1">
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                        <span className={`text-xs font-medium ${priorityConfig.color}`}>
                          [{priorityConfig.label}]
                        </span>
                      </div>
                      <h3 className="font-medium text-foreground truncate">
                        {ticket.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ticket.user_email} · {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border pt-4 bg-muted/30">
                    <p className="text-sm text-foreground whitespace-pre-wrap mb-4">
                      {ticket.content}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Select
                        value={ticket.status}
                        onValueChange={(v) => handleStatusChange(ticket.id, v)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">대기중</SelectItem>
                          <SelectItem value="in_progress">처리중</SelectItem>
                          <SelectItem value="resolved">완료</SelectItem>
                          <SelectItem value="closed">종료</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={ticket.priority}
                        onValueChange={(v) => handlePriorityChange(ticket.id, v)}
                      >
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">낮음</SelectItem>
                          <SelectItem value="medium">중간</SelectItem>
                          <SelectItem value="high">높음</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openTicketDialog(ticket)}
                      >
                        상세보기 / 답변
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTicket.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {selectedTicket.user_email} · {new Date(selectedTicket.created_at).toLocaleString()}
                </div>

                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.content}</p>
                </div>

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-16 h-16 rounded-lg overflow-hidden border hover:opacity-80"
                      >
                        <img src={att.file_url} alt={att.file_name} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Replies */}
                <div className="space-y-3">
                  <h3 className="font-medium">대화 기록</h3>
                  {replies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">답변 없음</p>
                  ) : (
                    replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-3 rounded-xl ${
                          reply.is_admin ? "bg-primary/10 border border-primary/20" : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {reply.is_admin ? (
                            <Shield className="w-4 h-4 text-primary" />
                          ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-xs font-medium">
                            {reply.is_admin ? "관리자" : "사용자"}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{reply.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Input */}
                <div className="space-y-2 pt-4 border-t">
                  <Textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="관리자 답변을 입력하세요..."
                    rows={3}
                  />
                  <Button onClick={handleSendReply} disabled={submitting || !newReply.trim()}>
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    답변 보내기
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedbackManagement;
