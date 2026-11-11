import axios from "axios";
import type { Article, SentimentStats } from "../types/news";
import type { GraphData } from "../components/KnowledgeGraph/EntityGraphContainer";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000",
  timeout: 10000,
});

export const getArticles = () => api.get<Article[]>("/articles");
export const getStats = () => api.get<SentimentStats>("/stats");

// New api
export const getGraphData = (limit: number = 200) =>
  api.get<GraphData>(`/api/v1/graph?limit=${limit}`);
