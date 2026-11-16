import React from "react";

interface EntityFocusBannerProps {
  selectedNode: any | null;
  articles: any[];
  onClear: () => void;
}

export const EntityFocusBanner: React.FC<EntityFocusBannerProps> = ({
  selectedNode,
  articles,
  onClear,
}) => {

  if (!selectedNode) return null;

  const entityName = selectedNode.label || selectedNode.id;
  const entityType = selectedNode.type || "ENTITY";

  // คำนวณสัดส่วน Positive / Negative 
  const total = articles.length;
  const posCount = articles.filter((a) => a.sentiment_label === "POSITIVE").length;
  const negCount = articles.filter((a) => a.sentiment_label === "NEGATIVE").length;

  const posPercent = total > 0 ? Math.round((posCount / total) * 100) : 0;
  const negPercent = total > 0 ? Math.round((negCount / total) * 100) : 0;

  return (
    <div className="bg-amber-200 p-4 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] mb-4 transition-all">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-slate-900 text-white rounded-md">
              Focusing: {entityType}
            </span>
            <span className="text-xs font-bold text-slate-700">
              ({total} ข่าวที่เกี่ยวข้อง)
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            {entityName}
          </h2>
        </div>

        {/* ปุ่มล้างการเลือก Node */}
        <button
          onClick={onClear}
          title="ล้างตัวกรอง กลับไปดูข่าวทั้งหมด"
          className="px-2.5 py-1 bg-white hover:bg-rose-100 text-slate-900 font-black text-xs rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
        >
          ✕ ล้างตัวกรอง
        </button>
      </div>

      {/* Mini Sentiment Bar */}
      {total > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-black">
            <span className="text-emerald-800">🟢 Positive {posPercent}% ({posCount})</span>
            <span className="text-rose-800">🔴 Negative {negPercent}% ({negCount})</span>
          </div>
          <div className="w-full h-3 bg-white rounded-full border-2 border-slate-900 overflow-hidden flex">
            <div
              style={{ width: `${posPercent}%` }}
              className="bg-emerald-400 h-full transition-all duration-500"
            />
            <div
              style={{ width: `${negPercent}%` }}
              className="bg-rose-400 h-full transition-all duration-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};