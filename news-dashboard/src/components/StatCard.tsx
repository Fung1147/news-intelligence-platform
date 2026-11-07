import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  bgColor?: string;
  badgeColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  bgColor = 'bg-white',
  badgeColor = 'bg-slate-200'
}) => {
  return (
    <div className={`${bgColor} p-4 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between transition-transform hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[11px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border border-slate-900 ${badgeColor}`}>
          {title}
        </span>
        {/* จุดตกแต่ง Retro Mac */}
        <div className="w-2 h-2 rounded-full bg-slate-900 opacity-40"></div>
      </div>
      
      <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
        {value}
      </div>
    </div>
  );
};