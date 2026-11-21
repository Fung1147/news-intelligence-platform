import { useEffect, useState } from "react";
import { getArticles, getGraphData } from "./api/client";
import { Header } from "./components/Layout/Header";

import {
  EntityGraphContainer,
  type GraphData,
} from "./components/KnowledgeGraph/EntityGraphContainer";
import { NewsFeedContainer } from "./components/์NewsFeed/NewsFeedContainer";

export function App() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState<"ALL" | "POSITIVE" | "NEGATIVE">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });

  const CATEGORIES = [
    "ALL",
    "Tech & AI",
    "Finance & Economy",
    "Politics & Law",
    "General",
  ];

  // แก้ไข handler รับข้อมูลจาก Graph
  const handleSelectEntity = (node: any, newsData?: any[]) => {
    setSelectedNode(node);

    if (node) {
      setSearchTerm(node.label || node.id || "");
    }

    if (newsData) {
      setArticles([...newsData]);
    }
  };

  const handleClearNode = async () => {
    setSelectedNode(null);
    setSearchTerm("");
    setFilter("ALL");
    setSelectedCategory("ALL");
    setLoading(true);
    try {
      const resArticles = await getArticles();
      setArticles(resArticles.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setSelectedNode(null);
    setSearchTerm("");
    try {
      const [resArticles, resGraph] = await Promise.all([
        getArticles(),
        getGraphData(),
      ]);
      setArticles(resArticles.data);
      setGraphData(resGraph.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  // ปรับ logic การ filter ข่าว
  const filteredArticles = articles.filter((a) => {
    if (!selectedNode && searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        (a.title && a.title.toLowerCase().includes(term)) ||
        (a.summary && a.summary.toLowerCase().includes(term)) ||
        (a.content && a.content.toLowerCase().includes(term));
      if (!matchesSearch) return false;
    }

    // กรอง Sentiment
    if (filter === "POSITIVE" && a.sentiment_label !== "POSITIVE") return false;
    if (filter === "NEGATIVE" && a.sentiment_label !== "NEGATIVE") return false;

    // กรอง Category
    if (selectedCategory !== "ALL" && a.category !== selectedCategory) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF8ED] text-slate-900 p-4 sm:p-8">
      <div className="max-w-360 mx-auto">
        {/* Header */}
        <Header
          onRefresh={fetchData}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            if (!val) setSelectedNode(null);
          }}
        />

        {/* Split-Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-4">
          {/* ซ้าย Knowledge Graph */}
          <div className="lg:col-span-7 lg:sticky lg:top-6">
            <EntityGraphContainer
              graphData={graphData}
              onSelectEntity={handleSelectEntity}
            />
          </div>

          {/* ขวา News Feed Workspace */}
          <div className="lg:col-span-5 pb-4">
            <NewsFeedContainer
              articles={articles}
              filteredArticles={filteredArticles}
              selectedNode={selectedNode}
              onClearNode={handleClearNode}
              filter={filter}
              setFilter={setFilter}
              categories={CATEGORIES}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
