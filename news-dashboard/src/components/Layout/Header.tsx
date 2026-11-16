import React from 'react';
import { Newspaper, RefreshCw, Search } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  loading: boolean;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onRefresh, 
  loading,
  searchTerm = '',
  onSearchChange 
}) => {
  return (
    <header className="w-full mb-6">
      {/* แถบ Browser Capsule Bar */}
      <div className="bg-[#FFFDF5] border-2 border-slate-900 rounded-full p-2 px-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-between gap-3">
        
        {/* โลโก้ + ช่องค้นหา */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="w-8 h-8 rounded-full bg-amber-300 border-2 border-slate-900 flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
            <Newspaper className="w-4 h-4 text-slate-900" />
          </div>
          
          <div className="flex items-center gap-2 bg-white border-2 border-slate-900 rounded-full px-3 py-1 text-xs w-full shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 text-xs w-full font-medium"
            />
          </div>
        </div>

        {/* ปุ่มควบคุมฝั่งขวา */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`flex items-center gap-1.5 bg-sky-300 hover:bg-sky-400 active:translate-x-[1px] active:translate-y-[1px] text-slate-900 border-2 border-slate-900 px-3.5 py-1 rounded-full font-black text-xs shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all ${
              loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? '...' : 'Refresh'}</span>
          </button>

          {/* Retro Mac Buttons */}
          <div className="hidden sm:flex items-center gap-1.5 ml-1">
            <div className="w-3.5 h-3.5 rounded-full bg-blue-400 border border-slate-900"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-rose-400 border border-slate-900"></div>
          </div>
        </div>
      </div>

      {/* Title Section สไตล์มินิมอล */}
      <div className="text-center mt-6 mb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          News Intelligence Dashboard
        </h1>
        <p className="text-slate-600 text-xs font-bold mt-1 tracking-wide">
          Supervised AI Summarization & Sentiment Analytics
        </p>
      </div>
    </header>
  );
};