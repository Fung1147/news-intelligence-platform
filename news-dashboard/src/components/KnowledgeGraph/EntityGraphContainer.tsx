import React, { useEffect, useRef, useState, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { ForceGraphMethods } from "react-force-graph-2d";
import { GraphControls } from "./GraphControls";
import { EntityDetailModel, type EntityDetail } from "./EntityDetailModel";
import * as d3 from "d3-force";
import { Share2 } from "lucide-react";

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  val?: number;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: any;
  target: any;
  weight?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface EntityGraphContainerProps {
  graphData: GraphData;
  onSelectEntity?: (node: any, newsData?: any[]) => void;
}

export const EntityGraphContainer: React.FC<EntityGraphContainerProps> = ({
  graphData,
  onSelectEntity,
}) => {
  const fgRef = useRef<ForceGraphMethods<any, any>>(undefined);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [activeEntityDetail, setActiveEntityDetail] =
    useState<EntityDetail | null>(null);

  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const [newsList, setNewsList] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState<boolean>(false);

  // กำหนดโทนสีให้เข้ากับ Neo-brutalism Dashboard
  const getNodeColor = (type: string) => {
    switch (type) {
      case "ORG":
        return "#FF70A6";
      case "PERSON":
        return "#70D6FF";
      case "GPE":
        return "#FFD670";
      default:
        return "#B9FBC0";
    }
  };

  const filteredNodes = graphData.nodes.filter(
    (n) => selectedType === "ALL" || n.type === selectedType,
  );

  const filteredLinks = graphData.links.filter((l: any) => {
    const sId = typeof l.source === "object" ? l.source.id : l.source;
    const tId = typeof l.target === "object" ? l.target.id : l.target;
    if (selectedType === "ALL") return true;
    const sNode = graphData.nodes.find((n) => n.id === sId);
    const tNode = graphData.nodes.find((n) => n.id === tId);
    return sNode?.type === selectedType && tNode?.type === selectedType;
  });

  const filteredData = { nodes: filteredNodes, links: filteredLinks };

  const handleZoomIn = () =>
    fgRef.current?.zoom(fgRef.current.zoom() * 1.3, 300);
  const handleZoomOut = () =>
    fgRef.current?.zoom(fgRef.current.zoom() / 1.3, 300);
  const handleResetZoom = () => {
    fgRef.current?.zoomToFit(400, 40);
    setActiveEntityDetail(null);
  };

  // คำนวณ Degree Centrality (นับเส้นเชื่อมของแต่ละ Node)
  const nodeDegrees = useMemo(() => {
    const degrees: Record<string, number> = {};
    filteredData.links.forEach((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;
      degrees[sourceId] = (degrees[sourceId] || 0) + 1;
      degrees[targetId] = (degrees[targetId] || 0) + 1;
    });
    return degrees;
  }, [filteredData.links]);

  // สร้าง Set ของ Neighbor Nodes และ Links ของ Node ที่กำลังโฟกัส
  const activeFocusNode = hoverNode || selectedNode;
  const highlightNodes = useMemo(() => {
    const set = new Set<string>();
    if (!activeFocusNode) return set;
    set.add(activeFocusNode.id);
    graphData.links.forEach((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;
      if (sourceId === activeFocusNode.id) set.add(targetId);
      if (targetId === activeFocusNode.id) set.add(sourceId);
    });
    return set;
  }, [activeFocusNode, graphData.links]);

  const highlightLinks = useMemo(() => {
    const set = new Set<GraphLink>();
    if (!activeFocusNode) return set;
    graphData.links.forEach((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;
      if (sourceId === activeFocusNode.id || targetId === activeFocusNode.id) {
        set.add(link);
      }
    });
    return set;
  }, [activeFocusNode, graphData.links]);

  const handleNodeClick = async (node: GraphNode) => {
    console.log("Clicked Node:", node);
    setSelectedNode(node);
    setLoadingNews(true);
    setNewsList([]);

    const entityName = node.label || node.id;

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/news/by-entity?entity_name=${encodeURIComponent(entityName)}`,
      );
      const data = await res.json();
      console.log("Fetched News Data:", data);
      setNewsList(data);
      if (onSelectEntity) {
        onSelectEntity(node, data);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      setNewsList([]);
    } finally {
      setLoadingNews(false);
    }
  };

  // Force Simulation Tuning
  useEffect(() => {
    if (fgRef.current && filteredData.nodes.length > 0) {
      fgRef.current.d3Force("charge")?.strength(-1500);
      fgRef.current.d3Force("link")?.distance(220);

      const centerForce = fgRef.current.d3Force("center");
      if (centerForce) {
        (centerForce as any).strength?.(0.01);
      }

      fgRef.current.d3Force("x", d3.forceX().strength(0.04));
      fgRef.current.d3Force("y", d3.forceY().strength(0.04));

      // Force Collide
      fgRef.current.d3Force(
        "collide",
        d3.forceCollide().radius((node: any) => {
          const degree = nodeDegrees[node.id] || 1;
          const r = Math.max(10, Math.min(30, 10 + degree * 3.5));
          return r + 25;
        }),
      );
    }
  }, [filteredData]);

  return (
    <div className="w-full bg-[#FFFDF6] border-4 border-black rounded-2xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8 relative">
      {/* Title */}
      <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-3">
        <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-black">
          <span>
            <Share2 className="w-5 h-5 inline mr-2" />
          </span>{" "}
          Entity Knowledge Graph
        </h2>
        <span className="text-xs font-bold bg-black text-white px-3 py-1 rounded-full">
          Interactive Analytics
        </span>
      </div>

      {/* Controls */}
      <GraphControls
        selectedType={selectedType}
        onSelectType={setSelectedType}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />

      {/* Graph Area */}
      <div className="h-150 border-3 border-black rounded-xl overflow-hidden bg-white relative">
        <ForceGraph2D
          ref={fgRef}
          graphData={filteredData}
          d3VelocityDecay={0.75}
          warmupTicks={100}
          cooldownTicks={0}
          onEngineStop={() => {
            filteredData.nodes.forEach((node: any) => {
              node.fx = node.x;
              node.fy = node.y;
            });
          }}
          // Dynamic Link Color & Width ตาม state Hover/Select
          linkColor={(link: any) => {
            if (!activeFocusNode) return "rgba(0, 0, 0, 0.25)";
            return highlightLinks.has(link) ? "#000000" : "rgba(0, 0, 0, 0.05)";
          }}
          linkWidth={(link: any) => (highlightLinks.has(link) ? 3 : 1)}
          // Interactive Mouse Handlers
          onNodeHover={(node: any) => setHoverNode(node || null)}
          onNodeClick={handleNodeClick}
          onBackgroundClick={() => setSelectedNode(null)}
          // วาด Node & Label แบบ Custom สไตล์ Neo-Brutalism
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const isFocused = !activeFocusNode || highlightNodes.has(node.id);
            const isSelected = selectedNode?.id === node.id;
            const label = node.label || node.id;

            const degree = nodeDegrees[node.id] || 1;
            const radius = Math.max(10, Math.min(30, 10 + degree * 2));

            ctx.save();
            ctx.globalAlpha = isFocused ? 1.0 : 0.15;

            // 1. วาดเงา
            ctx.beginPath();
            ctx.arc(node.x + 3, node.y + 3, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = "#000000";
            ctx.fill();

            // 2. วาดตัว Node วงกลมหลัก
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = getNodeColor(node.type);
            ctx.fill();
            ctx.lineWidth = isSelected ? 3.5 : 2.5;
            ctx.strokeStyle = "#000000";
            ctx.stroke();

            // 3. วาดการ์ดข้อความป้ายชื่อใต้ Node
            const fontSize = Math.max(12 / globalScale, 10);
            ctx.font = `900 ${fontSize}px sans-serif`;
            const textWidth = ctx.measureText(label).width;
            const padX = 6;
            const padY = 4;
            const rectX = node.x - textWidth / 2 - padX;
            const rectY = node.y + radius + 6;
            const rectW = textWidth + padX * 2;
            const rectH = fontSize + padY * 2;

            // เงาของป้ายข้อความ
            ctx.fillStyle = "#000000";
            ctx.fillRect(rectX + 2, rectY + 2, rectW, rectH);

            // ป้ายข้อความพื้นขาว ขอบดำ
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(rectX, rectY, rectW, rectH);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "#000000";
            ctx.strokeRect(rectX, rectY, rectW, rectH);

            // ข้อความตัวอักษร
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#000000";
            ctx.fillText(label, node.x, rectY + rectH / 2);

            ctx.restore();
          }}
          // ตรวจจับรัศมีการกดคลิก Node
          nodePointerAreaPaint={(node: any, color, ctx) => {
            const degree = nodeDegrees[node.id] || 1;
            const radius = Math.max(10, Math.min(30, 10 + degree * 2));
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI, false);
            ctx.fill();
          }}
        />

        {/* กล่องแสดงรายการข่าวเมื่อคลิกเลือก Node */}
        {selectedNode && (
          <div className="mt-4 bg-white border-3 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-3 border-b-2 border-black pb-2">
              <h3 className="font-extrabold text-lg text-black">
                📰 ข่าวสารของ:{" "}
                <span className="bg-yellow-300 px-2 py-0.5 rounded border border-black">
                  {selectedNode.label || selectedNode.id}
                </span>
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="font-bold border-2 border-black px-2 py-0.5 rounded hover:bg-black hover:text-white transition-colors"
              >
                ✕ ปิด
              </button>
            </div>

            {loadingNews ? (
              <p className="font-bold text-gray-500 animate-pulse text-center py-4">
                ⏳ กำลังโหลดข่าวสาร...
              </p>
            ) : newsList.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {newsList.map((news: any, idx: number) => (
                  <div
                    key={news.url || `news-${idx}`}
                    className="p-3 bg-gray-50 border-2 border-black rounded-lg"
                  >
                    <h4 className="font-bold text-sm text-black">
                      {news.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {news.content || news.summary}
                    </p>
                    {news.publisher && (
                      <span className="inline-block mt-2 text-[10px] bg-gray-200 border border-black px-1.5 py-0.5 rounded font-mono">
                        📌 {news.publisher}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-yellow-100 border-2 border-black rounded-lg text-center font-bold text-black text-sm">
                ❌ ไม่พบข่าวที่เกี่ยวข้องกับ Entity นี้
              </div>
            )}
          </div>
        )}

        {/* Modal ข้อมูลมุมขวา */}
        <EntityDetailModel
          entity={activeEntityDetail}
          onClose={() => setActiveEntityDetail(null)}
        />
      </div>
    </div>
  );
};
