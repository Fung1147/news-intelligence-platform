import axios from "axios";
import type { Article, SentimentStats, BriefResult } from "../types/news";
import type { GraphData } from "../components/KnowledgeGraph/EntityGraphContainer";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000",
  timeout: 120000,
});

export const getArticles = () => api.get<Article[]>("/articles");
export const getStats = () => api.get<SentimentStats>("/stats");

// Graph Data api
export const getGraphData = (limit: number = 100) =>
  api.get<GraphData>(`/api/v1/graph?limit=${limit}`);

// Entity News api
export const getNewsByEntity = (entityName: string) =>
  api.get<Article[]>("/api/news/by-entity", {
    params: { entity_name: entityName },
  });

// AI Entity Brief api
export const createEntityBrief = (entityName: string, articles: Article[]) =>
  api.post<BriefResult>("/api/entity-brief", {
    entity_name: entityName,
    articles,
  });
