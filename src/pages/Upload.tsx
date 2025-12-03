import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ImageUploadZone from "@/components/ImageUploadZone";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

const BACKEND_BASE_URL = "https://tyron-backend-8yaa.onrender.com";

const Upload = () => {
  const navigate = useNavigate();
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [topFile, setTopFile] = useState<File | null>(null);
  const [bottomFile, setBottomFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!personFile || !topFile) {
      alert("전신 사진과 상의 사진은 필수입니다.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("person_image", personFile);
    formData.append("top_garment", topFile);
    if (bottomFile) {
      formData.append("bottom_garment", bottomFile);
    }

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/tryon/start`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        console.error(data);
        alert("작업 시작 실패: " + (data.error || "알 수 없는 오류"));
        setIsSubmitting(false);
        return;
      }

      // Navigate to result page with taskId
      navigate(`/result/${data.taskId}`);
    } catch (err) {
      console.error(err);
      alert("요청 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  const canSubmit = personFile && topFile && !isSubmitting;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">돌아가기</span>
          </Link>
          <h1 className="font-display text-lg font-semibold gradient-gold-text">Virtual Try-On</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-2">
            이미지 업로드
          </h2>
          <p className="text-muted-foreground">
            전신 사진과 입어보고 싶은 옷 이미지를 업로드하세요
          </p>
        </div>

        <div className="space-y-8">
          {/* Person Image */}
          <ImageUploadZone
            label="전신 사진"
            description="정면을 바라보는 전신 사진을 올려주세요"
            requirements={[
              "정면 전신 사진 (손이 보여야 함)",
              "단체 사진 불가",
              "측면/반신/앉은 자세 불가",
              "물건을 들고 있으면 안됨",
              "밝고 선명한 사진 권장"
            ]}
            file={personFile}
            onFileChange={setPersonFile}
          />

          {/* Top Garment */}
          <ImageUploadZone
            label="상의"
            description="입어보고 싶은 상의 이미지를 올려주세요"
            requirements={[
              "평평하게 펼친 단일 의류 사진",
              "정면 촬영 (뒷면 불가)",
              "깔끔한 배경",
              "접히거나 구겨진 옷 불가",
              "여러 벌 겹쳐진 사진 불가"
            ]}
            file={topFile}
            onFileChange={setTopFile}
          />

          {/* Bottom Garment (Optional) */}
          <ImageUploadZone
            label="하의"
            description="하의 이미지가 없으면 AI가 자동으로 생성합니다"
            requirements={[
              "드레스처럼 상하의가 하나인 옷은 상의만 올려주세요",
              "상의와 동일한 조건 적용"
            ]}
            file={bottomFile}
            onFileChange={setBottomFile}
            optional
          />
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="hero"
            size="xl"
            className="w-full group"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                가상 피팅 생성하기
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
          {!canSubmit && !isSubmitting && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              전신 사진과 상의는 필수입니다
            </p>
          )}
        </div>
      </div>
    </main>
  );
};

export default Upload;
