import React from "react";
import { ArticleCard } from "./ArticleCard";
import { CategoryFilter } from "./CategoryFilter";
import { EntityFocusBanner } from "./EntityFocusBanner";

interface NewsFeedContainerProps {
  articles: any[];
  filteredArticles: any[];
  selectedNode: any | null;
  onClearNode: () => void;
  filter: "ALL" | "POSITIVE" | "NEGATIVE";
  setFilter: (f: "ALL" | "POSITIVE" | "NEGATIVE") => void;
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export const NewsFeedContainer: React.FC<NewsFeedContainerProps> = ({
  articles,
  filteredArticles,
  selectedNode,
  onClearNode,
  filter,
  setFilter,
  categories,
  selectedCategory,
  setSelectedCategory,
}) => {
  return (
    <div className="flex flex-col h-full">
      <EntityFocusBanner
        selectedEntity={
          typeof selectedNode === "string"
            ? selectedNode
            : selectedNode?.label ||
              selectedNode?.name ||
              selectedNode?.title ||
              String(selectedNode?.id || "")
        }
        articles={filteredArticles}
        onClear={onClearNode}
      />

      <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] mb-4">
        {/* ปุ่ม Filter สถานะ Sentiment */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex gap-1.5">
            {(["ALL", "POSITIVE", "NEGATIVE"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-black border border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-x-1px 1px ${
                  filter === f
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-900 hover:bg-slate-100"
                }`}
              >
                {f === "ALL"
                  ? `All (${articles.length})`
                  : f === "POSITIVE"
                    ? "🟢 Positive"
                    : "🔴 Negative"}
              </button>
            ))}
          </div>
        </div>

        {/* CategoryFilter เดิม */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/*(Scrollable Desktop) */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 lg:max-h-[calc(100vh-240px)]">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((item, index) => (
            <ArticleCard key={item.url || index} article={item} />
          ))
        ) : (
          <div className="text-center p-8 bg-white rounded-2xl border-2 border-slate-900 text-slate-500 font-bold text-sm shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            ไม่พบข้อมูลข่าวสารที่ตรงกับเงื่อนไข
          </div>
        )}
      </div>
    </div>
  );
};
