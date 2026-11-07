import React from 'react';
import { ExternalLink, Bot, Calendar, Building2, Tag } from 'lucide-react';
import type { Article } from '../types/news';

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const isPositive = article.sentiment_label === 'POSITIVE';
  const isNegative = article.sentiment_label === 'NEGATIVE';

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-5 mb-4 transition-all hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5">
      
      {/* Header ของการ์ด: Badge sentiment + สำนักข่าว */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1 bg-slate-100 border border-slate-900 px-2.5 py-0.5 rounded-md text-slate-800">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            {article.publisher || 'ข่าวทั่วไป'}
          </span>

          {/* Category Tag */}
          {article.category && (
            <span className="flex items-center gap-1 bg-purple-100 border border-slate-900 px-2.5 py-0.5 rounded-md text-purple-900 font-bold">
              <Tag className="w-3 h-3 text-purple-600" />
              {article.category || "General"}
            </span>
          )}

         {/* Date */}
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {article.published_at ? new Date(article.published_at).toLocaleDateString('th-TH') : '-'}
          </span>
        </div>

        {/* Sentiment Badge */}
        {article.sentiment_label && (
          <span className={`px-3 py-0.5 rounded-full text-xs font-black border border-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] ${
            isPositive ? 'bg-emerald-300 text-slate-900' : isNegative ? 'bg-rose-300 text-slate-900' : 'bg-amber-200 text-slate-900'
          }`}>
            {article.sentiment_label} {article.sentiment_score !== undefined && `(${(article.sentiment_score).toFixed(2)})`}
          </span>
        )}
      </div>

      {/* หัวข้อข่าว */}
      <h3 className="text-base sm:text-lg font-black text-slate-900 mb-3 leading-snug">
        {article.url ? (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-start gap-1.5 group"
          >
            <span>{article.title}</span>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-900 shrink-0 mt-1 transition-colors" />
          </a>
        ) : (
          article.title
        )}
      </h3>

      {/* กล่องสรุปเนื้อหาจาก AI */}
      <div className="bg-[#FFFDF5] p-3.5 rounded-xl border-2 border-slate-900 text-slate-800 text-xs sm:text-sm font-medium">
        <div className="font-black flex items-center gap-1.5 text-slate-900 mb-1 text-xs uppercase tracking-wider">
          <Bot className="w-4 h-4 text-blue-600" /> AI Summary
        </div>
        <p className="leading-relaxed text-slate-700">
          {article.summary || 'ยังไม่ได้ประมวลผลสรุปข่าว'}
        </p>
      </div>
    </div>
  );
};