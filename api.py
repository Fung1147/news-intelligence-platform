from typing import List, Optional
from data_pipeline.db import NewsArticle, SessionLocal
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# เริ่มต้นสร้างตัวแปร FastAPI App
app = FastAPI(
    title="News Intelligence Platform API",
    description="REST API สำหรับสรุปข้อมูลข่าวสาร",
    version="1.0.0",
)

# (ให้ React Port 5173 เรียกใช้ API ได้)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def categorize_text(title: str, summary: str = None) -> str:
    text = f"{title or ''} {summary or ''}".lower()
    
    if any(k in text for k in ["ai", "tech", "data", "google", "meta", "apple", "software", "scouts"]):
        return "Tech & AI"
    elif any(k in text for k in ["bank", "finance", "money", "market", "economy", "stock", "vc", "banking"]):
        return "Finance & Economy"
    elif any(k in text for k in ["president", "impeached", "arrested", "government", "midterms", "democrats", "law"]):
        return "Politics & Law"
    else:
        return "General"

# (กำหนด Type ข้อมูลตอบกลับให้ FastAPI)
class ArticleResponse(BaseModel):
    id: Optional[int] = None
    title: str
    url: Optional[str] = None
    content: Optional[str] = None
    publisher: Optional[str] = None
    published_at: Optional[str] = None
    summary: Optional[str] = None
    sentiment_label: Optional[str] = None
    sentiment_score: Optional[float] = None
    category: Optional[str] = "General"

    model_config = {"from_attributes": True}

# --- Endpoints ---

# Home
@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to News Intelligence Platform API",
    }

@app.get("/articles", response_model=List[ArticleResponse])
def get_articles(limit: int = 50, sentiment: Optional[str] = None):
    session = SessionLocal()
    try:
        query = session.query(NewsArticle)

        # ถ้ามีการส่งค่า sentiment มากรอง (เช่น POSITIVE / NEGATIVE)
        if sentiment:
            query = query.filter(
                NewsArticle.sentiment_label == sentiment.upper()
            )

        articles = (
            query.order_by(NewsArticle.published_at.desc()).limit(limit).all()
        )
        
        return articles
    
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database query error: {str(e)}"
        )
    
    finally:
        session.close()

@app.get("/stats")
def get_sentiment_stats():
    session = SessionLocal()
    try:
        total = session.query(NewsArticle).count()
        positive = (
            session.query(NewsArticle)
            .filter(NewsArticle.sentiment_label == "POSITIVE")
            .count()
        )
        negative = (
            session.query(NewsArticle)
            .filter(NewsArticle.sentiment_label == "NEGATIVE")
            .count()
        )
        unprocessed = (
            session.query(NewsArticle)
            .filter(NewsArticle.summary.is_(None))
            .count()
        )

        # เพิ่มการจัดกลุ่มนับ Category จากข่าวใน Database
        all_articles = session.query(NewsArticle).all()
        categories_count = {
            "Tech & AI": 0,
            "Finance & Economy": 0,
            "Politics & Law": 0,
            "General": 0
        }

        for article in all_articles:
            # ใช้ category จาก DB (ถ้ามี) หรือคำนวณแบบ Auto Categorize
            cat = getattr(article, "category", None) or categorize_text(article.title, article.summary)
            categories_count[cat] = categories_count.get(cat, 0) + 1

        return {
            "total_articles": total,
            "positive_count": positive,
            "negative_count": negative,
            "unprocessed_count": unprocessed,
            "category_stats": categories_count,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database query error: {str(e)}"
        )
    finally:
        session.close()