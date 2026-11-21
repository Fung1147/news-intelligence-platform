import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6 items-center">
      <span className="text-xs font-black text-slate-700 mr-1">Category:</span>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelectCategory(cat)}
          className={`px-3 py-1 rounded-lg text-xs font-bold border border-slate-900 transition-all ${
            selectedCategory === cat
              ? 'bg-purple-300 text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] font-black'
              : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {cat === 'ALL' ? 'All' : cat}
        </button>
      ))}
    </div>
  );
};