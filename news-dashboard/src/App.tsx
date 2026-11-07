import { useEffect, useState } from "react";
import axios from "axios";
import type { Article, SentimentStats } from "./types/news";
import { Header } from "./components/Header";
import { StatCard } from "./components/StatCard";
import { ArticleCard } from "./components/ArticleCard";

export function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<SentimentStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState<"ALL" | "POSITIVE" | "NEGATIVE">("ALL");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resArticles, resStats] = await Promise.all([
        axios.get<Article[]>("http://127.0.0.1:8000/articles"),
        axios.get<SentimentStats>("http://127.0.0.1:8000/stats"),
      ]);
      setArticles(resArticles.data);
      setStats(resStats.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // กรองข่าวจาก Search Term และ Filter Tag
  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.summary && a.summary.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    if (filter === "POSITIVE") return a.sentiment_label === "POSITIVE";
    if (filter === "NEGATIVE") return a.sentiment_label === "NEGATIVE";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF8ED] text-slate-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Header
          onRefresh={fetchData}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        {/* Stats Grid 4 ช่อง */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
          <StatCard
            title="Total"
            value={stats?.total_articles ?? 0}
            bgColor="bg-sky-100"
            badgeColor="bg-sky-300"
          />
          <StatCard
            title="Positive"
            value={stats?.positive_count ?? 0}
            bgColor="bg-emerald-100"
            badgeColor="bg-emerald-300"
          />
          <StatCard
            title="Negative"
            value={stats?.negative_count ?? 0}
            bgColor="bg-rose-100"
            badgeColor="bg-rose-300"
          />
          <StatCard
            title="In progress"
            value={stats?.unprocessed_count ?? 0}
            bgColor="bg-amber-100"
            badgeColor="bg-amber-300"
          />
        </div>

        {/* ปุ่ม Filter สถานะ */}
        <div className="flex gap-2 mb-6">
          {(["ALL", "POSITIVE", "NEGATIVE"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1 rounded-full text-xs font-black border border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                filter === f
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-900 hover:bg-slate-100"
              }`}
            >
              {f === "ALL"
                ? "All"
                : f === "POSITIVE"
                  ? "🟢 Positive"
                  : "🔴 Negative"}
            </button>
          ))}
        </div>

        {/* ArticleCard */}
        <div>
          {filteredArticles.length > 0 ? (
            filteredArticles.map((item) => (
              <ArticleCard key={item.id} article={item} />
            ))
          ) : (
            <div className="text-center p-8 bg-white rounded-2xl border-2 border-slate-900 text-slate-500 font-bold text-sm">
              ไม่พบข้อมูลข่าวสาร
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
