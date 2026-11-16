import React, { useState, useEffect } from "react";

interface Article {
  title: string;
  summary?: string;
  sentiment_label?: string;
}

interface EntityFocusBannerProps {
  selectedEntity: string | null;
  articles: Article[];
  onClear: () => void;
}

export const EntityFocusBanner: React.FC<EntityFocusBannerProps> = ({
  selectedEntity,
  articles,
  onClear,
}) => {
  const [brief, setBrief] = useState<string[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // รีเซ็ตผลสรุปเก่าทันทีเมื่อเปลี่ยน Node ที่เลือก
  useEffect(() => {
    setBrief(null);
    setLoading(false);
  }, [selectedEntity]);

  if (!selectedEntity) return null;

  const handleGenerateBrief = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/ai/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_name: selectedEntity,
          articles: articles,
        }),
      });
      const data = await response.json();
      setBrief(data.brief || ["No insights generated."]);
    } catch (error) {
      setBrief(["Failed to connect to the backend API."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400">
            Focused Entity
          </span>
          <h2 className="text-lg font-bold text-white">{selectedEntity}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateBrief}
            disabled={loading || articles.length === 0}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 text-white transition-colors"
          >
            {loading
              ? "Synthesizing intelligence..."
              : "✨ AI Intelligence Brief"}
          </button>
          <button
            onClick={onClear}
            className="px-2.5 py-1.5 text-sm text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
          >
            ✕
          </button>
        </div>
      </div>

      {/* กล่องแสดงผลลัพธ์ จาก Qwen3.8 */}
      {brief && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">
            Executive Summary
          </h3>
          <ul className="space-y-1.5 text-sm text-slate-200 list-disc list-inside">
            {brief.map((point, index) => (
              <li key={index} className="leading-relaxed">
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
