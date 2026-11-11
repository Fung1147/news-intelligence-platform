import React from 'react';

interface GraphControlsProps {
  selectedType: string;
  onSelectType: (type: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  selectedType,
  onSelectType,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  const types = [
    { id: 'ALL', label: 'All Entities', color: 'bg-black text-white' },
    { id: 'ORG', label: 'Organizations', color: 'bg-[#FF70A6] text-black' },
    { id: 'PERSON', label: 'Persons', color: 'bg-[#70D6FF] text-black' },
    { id: 'GPE', label: 'Locations', color: 'bg-[#FFD670] text-black' },
  ];

  return (
    <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {types.map((type) => {
          const isActive = selectedType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => onSelectType(type.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-black transition-all ${
                isActive
                  ? `${type.color} shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5`
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Zoom Controls */}
      <div className="flex gap-1.5 bg-white border-2 border-black p-1 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <button
          onClick={onZoomIn}
          className="w-8 h-8 font-black border-2 border-black bg-[#FFFDF6] hover:bg-yellow-200 rounded-lg flex items-center justify-center active:translate-y-0.5"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={onZoomOut}
          className="w-8 h-8 font-black border-2 border-black bg-[#FFFDF6] hover:bg-yellow-200 rounded-lg flex items-center justify-center active:translate-y-0.5"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={onResetZoom}
          className="px-2.5 h-8 text-xs font-black border-2 border-black bg-[#FFFDF6] hover:bg-yellow-200 rounded-lg flex items-center justify-center active:translate-y-0.5"
          title="Reset View"
        >
          Reset
        </button>
      </div>
    </div>
  );
};