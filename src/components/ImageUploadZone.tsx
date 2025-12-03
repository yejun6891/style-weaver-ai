import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [isDragActive, setIsDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하여야 합니다.");
      return;
    }
    
    if (!selectedFile.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
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
        <label className="text-sm font-medium text-foreground">
          {label}
          {optional && <span className="text-muted-foreground ml-1">(선택)</span>}
        </label>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {preview ? (
        <div className="relative rounded-xl overflow-hidden bg-card border border-border group">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-64 object-contain bg-background/50"
          />
          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              삭제
            </Button>
          </div>
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-background/80 text-xs text-muted-foreground">
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
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
              {isDragActive ? (
                <ImageIcon className="w-8 h-8 text-primary" />
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            
            <div>
              <p className="text-sm text-foreground mb-1">
                {isDragActive ? "여기에 놓으세요" : "클릭하거나 드래그하여 업로드"}
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, BMP • 최대 5MB
              </p>
            </div>
          </div>
        </div>
      )}

      {requirements && requirements.length > 0 && (
        <div className="p-3 rounded-lg bg-accent/50 border border-border">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {requirements.map((req, index) => (
                <p key={index} className="text-xs text-muted-foreground">• {req}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadZone;
