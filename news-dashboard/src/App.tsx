import { useEffect, useState } from "react";
import axios from "axios";
import type { Article, SentimentStats } from "./types/news";
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<SentimentStats | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Stats & Articles
  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await axios.get<SentimentStats>(`${API_URL}/stats`);
      setStats(statsRes.data);

      const params = filter !== "All" ? { sentiment: filter } : {};
      const articlesRes = await axios.get<Article[]>(`${API_URL}/articles`, {
        params,
      });
      setArticles(articlesRes.data);
    } catch (error) {
      console.error("Error fetching data from FastAPI:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        maxWidth: "1200px",
        margin: "0 auto",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: "bold",
              color: "#0f172a",
              margin: 0,
            }}
          >
            <Newspaper size={28} />
            News Intelligence Platform
          </h1>
          <p style={{ color: "#64748b", marginTop: "0.25rem" }}>
            React + TypeScript + FastAPI + Open-Source AI Architecture
          </p>
        </div>
        <button
          onClick={fetchData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={16} /> รีเฟรชข้อมูล
        </button>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "1.25rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ color: "#64748b", fontSize: "0.875rem" }}>
              ข่าวทั้งหมดในระบบ
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#0f172a",
              }}
            >
              {stats.total_articles}
            </div>
          </div>
          <div
            style={{
              background: "#fff",
              padding: "1.25rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                color: "#16a34a",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <TrendingUp size={16} /> ข่าวเชิงบวก (Positive)
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#16a34a",
              }}
            >
              {stats.positive_count}
            </div>
          </div>
          <div
            style={{
              background: "#fff",
              padding: "1.25rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                color: "#dc2626",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <TrendingDown size={16} /> ข่าวเชิงลบ (Negative)
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#dc2626",
              }}
            >
              {stats.negative_count}
            </div>
          </div>
          <div
            style={{
              background: "#fff",
              padding: "1.25rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                color: "#d97706",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Clock size={16} /> รอกระบวนการ AI
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#d97706",
              }}
            >
              {stats.unprocessed_count}
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem" }}>
        {["All", "POSITIVE", "NEGATIVE"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              backgroundColor: filter === type ? "#0f172a" : "#fff",
              color: filter === type ? "#fff" : "#334155",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Articles Feed */}
      {loading ? (
        <p style={{ color: "#64748b" }}>กำลังโหลดข้อมูลข่าว...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {articles.map((item) => (
            <div
              key={item.id}
              style={{
                background: "#fff",
                padding: "1.5rem",
                borderRadius: "0.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "0.5rem",
                  gap: "1rem",
                }}
              >
                <h3
                  style={{ margin: 0, fontSize: "1.125rem", color: "#1e293b" }}
                >
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#0f172a",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.375rem",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.color = "#2563eb")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.color = "#0f172a")
                      }
                    >
                      {item.title}
                      <ExternalLink
                        size={16}
                        style={{ flexShrink: 0, opacity: 0.7 }}
                      />
                    </a>
                  ) : (
                    item.title
                  )}
                </h3>

                {item.sentiment_label && (
                  <span
                    style={{
                      padding: "0.25rem 0.625rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                      backgroundColor:
                        item.sentiment_label === "POSITIVE"
                          ? "#dcfce7"
                          : "#fee2e2",
                      color:
                        item.sentiment_label === "POSITIVE"
                          ? "#15803d"
                          : "#b91c1c",
                    }}
                  >
                    {item.sentiment_label} (
                    {(item.sentiment_score ?? 0).toFixed(2)})
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#64748b",
                  marginBottom: "0.75rem",
                }}
              >
                สำนักข่าว: <strong>{item.publisher}</strong> | วันที่:{" "}
                {item.published_at
                  ? new Date(item.published_at).toLocaleString()
                  : "-"}
              </div>

              <div
                style={{
                  backgroundColor: "#f1f5f9",
                  padding: "0.75rem",
                  borderRadius: "0.375rem",
                  color: "#334155",
                  fontSize: "0.95rem",
                }}
              >
                <strong>🤖 AI Summary:</strong>{" "}
                {item.summary || "ยังไม่ได้ประมวลผลสรุปข่าว"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
