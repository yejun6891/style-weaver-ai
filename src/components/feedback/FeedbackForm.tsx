import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Loader2, Send, Image as ImageIcon } from "lucide-react";

interface FeedbackFormProps {
  onSuccess?: () => void;
}

const FeedbackForm = ({ onSuccess }: FeedbackFormProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [category, setCategory] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { value: "bug", label: t("feedback.category.bug") },
    { value: "feature", label: t("feedback.category.feature") },
    { value: "inquiry", label: t("feedback.category.inquiry") },
    { value: "other", label: t("feedback.category.other") },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (attachments.length + files.length > 3) {
      toast.error(t("feedback.maxAttachments"));
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(t("feedback.imageOnly"));
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("feedback.fileTooLarge"));
        return false;
      }
      return true;
    });

    setAttachments((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(t("feedback.loginRequired"));
      navigate("/auth");
      return;
    }

    if (!category || !title.trim() || !content.trim()) {
      toast.error(t("feedback.fillRequired"));
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("feedback_tickets")
        .insert({
          user_id: user.id,
          category,
          title: title.trim(),
          content: content.trim(),
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // 2. Upload attachments if any
      if (attachments.length > 0) {
        for (const file of attachments) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${user.id}/${ticket.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("feedback-attachments")
            .upload(fileName, file);

          if (uploadError) {
            console.error("Upload error:", uploadError);
            continue;
          }

          await supabase.from("feedback_attachments").insert({
            ticket_id: ticket.id,
            file_url: fileName,
            file_name: file.name,
          });
        }
      }

      toast.success(t("feedback.submitSuccess"));
      setCategory("");
      setTitle("");
      setContent("");
      setAttachments([]);
      setPreviews([]);
      onSuccess?.();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(t("feedback.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="category">{t("feedback.categoryLabel")}</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category">
            <SelectValue placeholder={t("feedback.selectCategory")} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">{t("feedback.titleLabel")}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("feedback.titlePlaceholder")}
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">{t("feedback.contentLabel")}</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("feedback.contentPlaceholder")}
          rows={6}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {content.length}/2000
        </p>
      </div>

      <div className="space-y-2">
        <Label>{t("feedback.attachments")}</Label>
        <div className="flex flex-wrap gap-3">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative w-20 h-20 rounded-lg overflow-hidden border border-border"
            >
              <img
                src={preview}
                alt={`Attachment ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {attachments.length < 3 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors"
            >
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {t("feedback.addImage")}
              </span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground">
          {t("feedback.attachmentHint")}
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={submitting || !category || !title.trim() || !content.trim()}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t("feedback.submitting")}
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            {t("feedback.submit")}
          </>
        )}
      </Button>
    </form>
  );
};

export default FeedbackForm;
