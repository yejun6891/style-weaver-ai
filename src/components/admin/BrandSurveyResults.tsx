import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Users, Calendar } from "lucide-react";
import { format } from "date-fns";

interface BrandSurvey {
  id: string;
  favorite_brands: string[];
  other_brand: string | null;
  created_at: string;
  user_id: string | null;
}

interface BrandCount {
  brand: string;
  count: number;
  percentage: number;
}

const BrandSurveyResults = () => {
  const [surveys, setSurveys] = useState<BrandSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandCounts, setBrandCounts] = useState<BrandCount[]>([]);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from("brand_surveys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSurveys(data || []);
      calculateBrandCounts(data || []);
    } catch (err) {
      console.error("Error fetching surveys:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateBrandCounts = (surveyData: BrandSurvey[]) => {
    const counts: Record<string, number> = {};
    const totalRespondents = surveyData.length;

    surveyData.forEach((survey) => {
      survey.favorite_brands.forEach((brand) => {
        counts[brand] = (counts[brand] || 0) + 1;
      });
      if (survey.other_brand) {
        const otherKey = `기타: ${survey.other_brand}`;
        counts[otherKey] = (counts[otherKey] || 0) + 1;
      }
    });

    const sortedBrands = Object.entries(counts)
      .map(([brand, count]) => ({
        brand,
        count,
        percentage: totalRespondents > 0 ? Math.round((count / totalRespondents) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    setBrandCounts(sortedBrands);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 응답 수</p>
                <p className="text-2xl font-bold">{surveys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">1위 브랜드</p>
                <p className="text-lg font-bold truncate">
                  {brandCounts[0]?.brand || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">최근 응답</p>
                <p className="text-sm font-medium">
                  {surveys[0] 
                    ? format(new Date(surveys[0].created_at), "yyyy.MM.dd HH:mm")
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brand Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">브랜드 선호도 순위</CardTitle>
        </CardHeader>
        <CardContent>
          {brandCounts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              아직 설문 응답이 없습니다
            </p>
          ) : (
            <div className="space-y-3">
              {brandCounts.slice(0, 15).map((item, index) => (
                <div key={item.brand} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? "bg-yellow-500 text-white" :
                    index === 1 ? "bg-gray-400 text-white" :
                    index === 2 ? "bg-amber-600 text-white" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{item.brand}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.count}명 ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Responses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">최근 응답 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {surveys.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              아직 설문 응답이 없습니다
            </p>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {surveys.slice(0, 20).map((survey) => (
                <div
                  key={survey.id}
                  className="p-3 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(survey.created_at), "yyyy.MM.dd HH:mm")}
                    </span>
                    {survey.user_id ? (
                      <Badge variant="secondary" className="text-xs">로그인 유저</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">익명</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {survey.favorite_brands.map((brand) => (
                      <Badge key={brand} variant="default" className="text-xs">
                        {brand}
                      </Badge>
                    ))}
                    {survey.other_brand && (
                      <Badge variant="outline" className="text-xs">
                        {survey.other_brand}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandSurveyResults;
