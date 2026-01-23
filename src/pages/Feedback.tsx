import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import LanguageSwitch from "@/components/LanguageSwitch";
import HeaderMenu from "@/components/HeaderMenu";
import Logo from "@/components/Logo";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import TicketList from "@/components/feedback/TicketList";
import TicketDetail from "@/components/feedback/TicketDetail";
import { MessageSquarePlus, List } from "lucide-react";

const Feedback = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show ticket detail if ticketId is present
  if (ticketId) {
    return (
      <main className="min-h-screen bg-background">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-3">
              <LanguageSwitch />
              <HeaderMenu />
            </div>
          </div>
        </header>

        <div className="pt-24 pb-16 px-4">
          <div className="max-w-2xl mx-auto">
            <TicketDetail />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <HeaderMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              {t("feedback.title")}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t("feedback.subtitle")}
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="new" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-6">
              <TabsTrigger value="new" className="flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4" />
                {t("feedback.newTicket")}
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                {t("feedback.myTickets")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new">
              <div className="bg-card border border-border rounded-2xl p-6">
                <FeedbackForm />
              </div>
            </TabsContent>

            <TabsContent value="list">
              <TicketList />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
};

export default Feedback;
