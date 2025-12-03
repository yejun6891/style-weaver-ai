import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface ImageUploadZoneProps {
  label: string;
  description?: string;
  requirements?: string[];
  file: File | null;
  onFileChange: (file: File | null) => void;
  optional?: boolean;
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  label,
  description,
  requirements,
  file,
  onFileChange,
  optional = false,
}) => {
  const { t, language } = useLanguage();
  const [isDragActive, setIsDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert(language === "ko" ? "파일 크기는 5MB 이하여야 합니다." : "File size must be under 5MB.");
      return;
    }
    
    if (!selectedFile.type.startsWith("image/")) {
      alert(language === "ko" ? "이미지 파일만 업로드할 수 있습니다." : "Only image files are allowed.");
      return;
    }

    onFileChange(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleRemove = () => {
    onFileChange(null);
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-base font-bold text-foreground font-display">
          {label}
          {optional && (
            <span className="ml-2 text-xs font-medium text-primary bg-accent px-2 py-0.5 rounded-full">
              {t("upload.optional")}
            </span>
          )}
        </label>
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden bg-card border border-border group">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-64 object-contain bg-muted/30"
          />
          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              {language === "ko" ? "삭제" : "Remove"}
            </Button>
          </div>
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm text-xs text-foreground font-medium border border-border">
            {file?.name}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "upload-zone cursor-pointer p-8 text-center",
            isDragActive && "active"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-md">
              {isDragActive ? (
                <ImageIcon className="w-8 h-8 text-white" />
              ) : (
                <Upload className="w-8 h-8 text-white" />
              )}
            </div>
            
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                {t("upload.dropzone")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("upload.format")}
              </p>
            </div>
          </div>
        </div>
      )}

      {requirements && requirements.length > 0 && (
        <div className="p-4 rounded-2xl bg-accent/50 border border-border">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">{t("upload.requirements")}</p>
              <div className="space-y-0.5">
                {requirements.map((req, index) => (
                  <p key={index} className="text-xs text-muted-foreground">• {req}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadZone;
