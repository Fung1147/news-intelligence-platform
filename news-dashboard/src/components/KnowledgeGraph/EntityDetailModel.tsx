import React from 'react';

export interface EntityDetail {
  id: string;
  label: string;
  type: string;
  mentionCount: number;
  sentimentSummary: { positive: number; negative: number; neutral: number };
  relatedNews: Array<{ id: string; title: string; url: string }>;
}

interface EntityDetailModalProps {
  entity: EntityDetail | null;
  onClose: () => void;
}

export const EntityDetailModel: React.FC<EntityDetailModalProps> = ({
  entity,
  onClose,
}) => {
  if (!entity) return null;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ORG':
        return { bg: 'bg-[#FF70A6]', label: 'Organization' };
      case 'PERSON':
        return { bg: 'bg-[#70D6FF]', label: 'Person' };
      case 'LOCATION':
        return { bg: 'bg-[#FFD670]', label: 'Location' };
      default:
        return { bg: 'bg-[#B9FBC0]', label: 'Entity' };
    }
  };

  const badge = getTypeBadge(entity.type);

  return (
    <div className="absolute right-4 top-16 w-80 bg-[#FFFDF6] border-4 border-black rounded-2xl p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-20 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-3 border-b-2 border-black pb-2">
        <div>
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-black ${badge.bg}`}>
            {badge.label}
          </span>
          <h3 className="text-lg font-black text-black mt-1 leading-tight">
            {entity.label}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 font-black border-2 border-black bg-red-400 hover:bg-red-500 text-black rounded-lg flex items-center justify-center text-xs active:translate-y-0.5"
        >
          ✕
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-white border-2 border-black p-2 rounded-xl text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Mentions</p>
          <p className="text-xl font-black text-black">{entity.mentionCount}</p>
        </div>
        <div className="bg-white border-2 border-black p-2 rounded-xl text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Sentiment</p>
          <div className="flex justify-center gap-1 mt-1 text-xs font-black">
            <span className="text-green-600">+{entity.sentimentSummary.positive}</span>
            <span className="text-red-500">-{entity.sentimentSummary.negative}</span>
          </div>
        </div>
      </div>

      {/* Related News list */}
      <div>
        <h4 className="text-xs font-black uppercase tracking-wider text-black mb-2">
          📰 Top Related News
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {entity.relatedNews.map((news) => (
            <a
              key={news.id}
              href={news.url}
              target="_blank"
              rel="noreferrer"
              className="block p-2 bg-white border-2 border-black rounded-xl hover:bg-yellow-100 transition-colors text-xs font-bold line-clamp-2"
            >
              {news.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};