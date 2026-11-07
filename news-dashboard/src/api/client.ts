import axios from "axios";
import type { Article, SentimentStats } from "../types/news";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000",
  timeout: 10000,
});

export const getArticles = () => api.get<Article[]>("/articles");
export const getStats = () => api.get<SentimentStats>("/stats");