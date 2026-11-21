import React, { useState, useEffect, useRef } from "react";
import type { BriefResult } from "../../types/news";
import { createEntityBrief } from "../../api/client";

interface EntityFocusBannerProps {
  selectedEntity?: string;
  entityName?: string;
  articles: any[];
  onClear: () => void;
}

export const EntityFocusBanner: React.FC<EntityFocusBannerProps> = ({
  selectedEntity,
  entityName,
  articles,
  onClear,
}) => {
  const activeEntity = selectedEntity || entityName || "";
  const [briefData, setBriefData] = useState<BriefResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsedLive, setElapsedLive] = useState(0);
  const [copied, setCopied] = useState(false);

  // เก็บ Cache ผลสรุปของแต่ละ Entity ใน Session ปัจจุบัน
  const cacheRef = useRef<Record<string, BriefResult>>({});

  // รีเซ็ตจาก Cache เมื่อเปลี่ยน Node
  useEffect(() => {
    setCopied(false);
    if (cacheRef.current[activeEntity]) {
      setBriefData({
        ...cacheRef.current[activeEntity],
        metrics: cacheRef.current[activeEntity].metrics
          ? { ...cacheRef.current[activeEntity].metrics!, cached: true }
          : null,
      });
    } else {
      setBriefData(null);
    }
  }, [activeEntity]);

  // ตัวจับเวลา Real-time ระหว่างรอ AI
  useEffect(() => {
    if (!loading) {
      setElapsedLive(0);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsedLive(Number(((Date.now() - start) / 1000).toFixed(1)));
    }, 100);
    return () => clearInterval(timer);
  }, [loading]);

  const handleGenerateBrief = async (forceRefresh = false) => {
    if (!forceRefresh && cacheRef.current[activeEntity]) {
      setBriefData({
        ...cacheRef.current[activeEntity],
        metrics: cacheRef.current[activeEntity].metrics
          ? { ...cacheRef.current[activeEntity].metrics!, cached: true }
          : null,
      });
      return;
    }

    setLoading(true);
    setBriefData(null);
    try {
      const res = await createEntityBrief(activeEntity, articles);
      const data: BriefResult = res.data;
      setBriefData(data);
      if (data.bullets && data.bullets.length > 0 && data.metrics) {
        cacheRef.current[activeEntity] = data;
      }
    } catch (err) {
      setBriefData({
        bullets: ["Error connecting to AI Intelligence service."],
        metrics: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!briefData) return;
    const text =
      `AI Intelligence Brief — ${activeEntity}\n\n` +
      briefData.bullets.map((b) => `• ${b}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderFormattedBullet = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-indigo-300">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 mb-5 text-slate-100 shadow-lg">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            FOCUSED ENTITY
          </div>
          <div className="text-xl font-bold text-white mt-0.5">
            {activeEntity}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleGenerateBrief(Boolean(briefData));
            }}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-300 text-white transition flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Synthesizing... ({elapsedLive.toFixed(1)}s)</span>
              </>
            ) : (
              <span>
                {briefData ? "↻ Regenerate Brief" : "✨ AI Intelligence Brief"}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onClear}
            title="Clear focus"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Summary Output */}
      {briefData && (
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase">
              EXECUTIVE SUMMARY
            </span>

            <div className="flex items-center gap-2">
              {/* Telemetry Badge */}
              {briefData.metrics && (
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300">
                  {briefData.metrics.cached ? (
                    <span className="text-emerald-400">⚡ Cached (0.0s)</span>
                  ) : (
                    <>
                      ⚡ {briefData.metrics.elapsed_seconds}s •{" "}
                      {(briefData.metrics.total_tokens ?? 0).toLocaleString()}{" "}
                      tok ({briefData.metrics.tokens_per_second} t/s)
                    </>
                  )}
                </span>
              )}

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>

          <ul className="space-y-2.5 text-sm text-slate-200 leading-relaxed">
            {briefData.bullets?.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="text-indigo-400 mt-0.5">•</span>
                <span>{renderFormattedBullet(bullet)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
