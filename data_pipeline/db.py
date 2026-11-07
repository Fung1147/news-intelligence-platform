import os
from sqlalchemy import Column, String, Float, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgrespassword@localhost:5432/news_db"
)

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class NewsArticle(Base):
    __tablename__ = "news_articles"

    url = Column(String, primary_key=True, index=True)  # ใช้ URL เป็น Uniqe Key 
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    published_at = Column(String)
    publisher = Column(String)

    summary = Column(Text, nullable=True)
    sentiment_label = Column(String, nullable=True)  # POSITIVE / NEGATIVE
    sentiment_score = Column(Float, nullable=True)  # ค่าความมั่นใจ 0.0 - 1.0

def init_db():
    """สร้าง Table ใน PostgreSQL หากยังไม่มี"""
    Base.metadata.create_all(bind=engine)

def save_articles_to_db(articles: list[dict]):
    """บันทึกข้อมูลข่าวลง Database โดยข้ามรายการที่เคยเซฟไปแล้ว"""
    db = SessionLocal()
    saved_count = 0
    try:
        for article in articles:
            # เช็คว่ามี URL นี้อยู่ใน DB แล้วหรือยัง
            existing = (
                db.query(NewsArticle)
                .filter(NewsArticle.url == article["url"])
                .first()
            )
            if not existing:
                news_entry = NewsArticle(
                    url=article["url"],
                    title=article["title"],
                    content=article["content"],
                    published_at=article["published_at"],
                    publisher=article["publisher"],
                )
                db.add(news_entry)
                saved_count += 1
        db.commit()
        print(f"บันทึกข่าวใหม่ลง Database สำเร็จ: {saved_count} รายการ")
    except Exception as e:
        db.rollback()
        print(f"เกิดข้อผิดพลาดในการบันทึกข้อมูล: {e}")
    finally:
        db.close()