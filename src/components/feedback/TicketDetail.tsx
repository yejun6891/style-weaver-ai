import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Send,
  Loader2,
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
}

interface Attachment {
  id: string;
  file_url: string;
  file_name: string;
}

interface Reply {
  id: string;
  user_id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
}

const TicketDetail = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ticketId && user) {
      fetchTicketDetails();
    }
  }, [ticketId, user]);

  const fetchTicketDetails = async () => {
    if (!ticketId) return;

    try {
      // Fetch ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from("feedback_tickets")
        .select("*")
        .eq("id", ticketId)
        .single();

      if (ticketError) throw ticketError;
      setTicket(ticketData);

      // Fetch attachments
      const { data: attachmentData } = await supabase
        .from("feedback_attachments")
        .select("*")
        .eq("ticket_id", ticketId);

      setAttachments(attachmentData || []);

      // Fetch replies
      const { data: replyData } = await supabase
        .from("feedback_replies")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      setReplies(replyData || []);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      toast.error(t("feedback.loadError"));
      navigate("/feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!user || !ticketId || !newReply.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("feedback_replies").insert({
        ticket_id: ticketId,
        user_id: user.id,
        content: newReply.trim(),
        is_admin: false,
      });

      if (error) throw error;

      setNewReply("");
      fetchTicketDetails();
      toast.success(t("feedback.replySuccess"));
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast.error(t("feedback.replyError"));
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      bug: t("feedback.category.bug"),
      feature: t("feedback.category.feature"),
      inquiry: t("feedback.category.inquiry"),
      other: t("feedback.category.other"),
    };
    return labels[category] || category;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      pending: {
        label: t("feedback.status.pending"),
        variant: "secondary",
        icon: <Clock className="w-3 h-3" />,
      },
      in_progress: {
        label: t("feedback.status.inProgress"),
        variant: "default",
        icon: <AlertCircle className="w-3 h-3" />,
      },
      resolved: {
        label: t("feedback.status.resolved"),
        variant: "outline",
        icon: <CheckCircle className="w-3 h-3" />,
      },
      closed: {
        label: t("feedback.status.closed"),
        variant: "destructive",
        icon: <XCircle className="w-3 h-3" />,
      },
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("feedback.notFound")}</p>
        <Button variant="outline" onClick={() => navigate("/feedback")} className="mt-4">
          {t("feedback.backToList")}
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(ticket.status);
  const isResolved = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/feedback")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-display text-xl font-bold text-foreground flex-1 truncate">
          {ticket.title}
        </h1>
      </div>

      {/* Ticket Info */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{getCategoryLabel(ticket.category)}</Badge>
          <Badge variant={statusConfig.variant} className="flex items-center gap-1">
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(ticket.created_at).toLocaleString()}
          </span>
        </div>

        <p className="text-foreground whitespace-pre-wrap">{ticket.content}</p>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {attachments.map((att) => (
              <a
                key={att.id}
                href={att.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-20 h-20 rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity"
              >
                <img
                  src={att.file_url}
                  alt={att.file_name}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Replies */}
      <div className="space-y-4">
        <h2 className="font-display font-bold text-foreground">
          {t("feedback.conversation")}
        </h2>

        {replies.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t("feedback.noReplies")}
          </p>
        ) : (
          <div className="space-y-3">
            {replies.map((reply) => (
              <div
                key={reply.id}
                className={`p-4 rounded-xl ${
                  reply.is_admin
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-muted border border-border"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {reply.is_admin ? (
                    <Shield className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {reply.is_admin ? t("feedback.admin") : t("feedback.you")}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(reply.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {reply.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Reply Input */}
        {!isResolved && (
          <div className="space-y-3 pt-4 border-t border-border">
            <Textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder={t("feedback.replyPlaceholder")}
              rows={3}
              maxLength={1000}
            />
            <Button
              onClick={handleSubmitReply}
              disabled={submitting || !newReply.trim()}
              className="w-full"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {t("feedback.sendReply")}
            </Button>
          </div>
        )}

        {isResolved && (
          <p className="text-sm text-muted-foreground text-center py-4 bg-muted rounded-xl">
            {t("feedback.ticketClosed")}
          </p>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;
