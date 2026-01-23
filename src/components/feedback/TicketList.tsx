import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface Ticket {
  id: string;
  category: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const TicketList = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("feedback_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{t("feedback.noTickets")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => {
        const statusConfig = getStatusConfig(ticket.status);
        return (
          <button
            key={ticket.id}
            onClick={() => navigate(`/feedback/${ticket.id}`)}
            className="w-full text-left p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {getCategoryLabel(ticket.category)}
                  </Badge>
                  <Badge variant={statusConfig.variant} className="text-xs flex items-center gap-1">
                    {statusConfig.icon}
                    {statusConfig.label}
                  </Badge>
                </div>
                <h3 className="font-medium text-foreground truncate">
                  {ticket.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TicketList;
