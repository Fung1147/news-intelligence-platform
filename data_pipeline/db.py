import os
from datetime import datetime
from sqlalchemy import Column, String, Float, Text, Integer, ForeignKey, Table, DateTime, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy import text, bindparam

DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgrespassword@localhost:5432/news_db"
)

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Many to Many (News-Entities)
article_entity_association = Table(
    'article_entities',
    Base.metadata,
    Column('article_url', String, ForeignKey('news_articles.url', ondelete="CASCADE"), primary_key=True),
    Column('entity_id', Integer, ForeignKey('entities.id', ondelete="CASCADE"), primary_key=True)
)

class NewsArticle(Base):
    __tablename__ = "news_articles"

    url = Column(String, primary_key=True, index=True) 
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    published_at = Column(String, nullable=True)
    publisher = Column(String, nullable=True)

    # AI Insights
    summary = Column(Text, nullable=True)
    sentiment_label = Column(String, nullable=True)  # POSITIVE / NEGATIVE
    sentiment_score = Column(Float, nullable=True)    # ค่าความมั่นใจ 0.0 - 1.0
    category = Column(String, nullable=True)
    
    # Keyword Extraction
    keywords = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship แบบ Many-to-Many 
    entities = relationship("Entity", secondary=article_entity_association, back_populates="articles")

class Entity(Base):
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, index=True, nullable=False)
    entity_type = Column(String, nullable=False)                

    # Relationship ย้อนกลับไปยังข่าว
    articles = relationship("NewsArticle", secondary=article_entity_association, back_populates="entities")

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
                    summary=article.get("summary"),
                    sentiment_label=article.get("sentiment_label"),
                    sentiment_score=article.get("sentiment_score"),
                    category=article.get("category"),
                    keywords=article.get("keywords")
                )

                # จัดการบันทึก NER Entities (ถ้ามี)
                entities_data = article.get("entities", [])
                for ent_data in entities_data:
                    ent_name = ent_data["name"].strip()
                    ent_type = ent_data["type"].strip()

                    # เช็คว่ามี Entity ถ้ายังไม่มีให้สร้างใหม่
                    entity_obj = db.query(Entity).filter(Entity.name == ent_name).first()
                    if not entity_obj:
                        entity_obj = Entity(name=ent_name, entity_type=ent_type)
                        db.add(entity_obj)
                    
                    # ผูก Relationship เข้ากับข่าว
                    news_entry.entities.append(entity_obj)

                db.add(news_entry)
                saved_count += 1

        db.commit()
        print(f"บันทึกข่าวใหม่ลง Database สำเร็จ: {saved_count} รายการ")
    except Exception as e:
        db.rollback()
        print(f"เกิดข้อผิดพลาดในการบันทึกข้อมูล: {e}")
    finally:
        db.close()

def get_knowledge_graph_data(limit: int = 50):
    db = SessionLocal()
    try:
        # ดึงข้อมูล Entities (Nodes)
        nodes_query = text("""
            SELECT e.id, e.name, e.entity_type, COUNT(ae.article_url) as mention_count
            FROM entities e
            JOIN article_entities ae ON e.id = ae.entity_id
            GROUP BY e.id, e.name, e.entity_type
            ORDER BY mention_count DESC
            LIMIT :limit;
        """)
        
        nodes_result = db.execute(nodes_query, {"limit": limit}).fetchall()
        
        nodes = []
        node_ids = []
        for r in nodes_result:
            nodes.append({
                "id": str(r.id),
                "label": r.name,
                "type": r.entity_type if r.entity_type else "General",
                "val": int(r.mention_count)
            })
            node_ids.append(r.id)

        if not node_ids:
            return {"nodes": [], "links": []}

        # ดึง Links โดยใช้ bindparam(..., expanding=True) สำหรับ IN Clause
        links_query = text("""
            SELECT 
                ae1.entity_id AS source_id, 
                ae2.entity_id AS target_id, 
                COUNT(DISTINCT ae1.article_url) AS weight
            FROM article_entities ae1
            JOIN article_entities ae2 
                ON ae1.article_url = ae2.article_url 
                AND ae1.entity_id < ae2.entity_id
            WHERE ae1.entity_id IN :node_ids AND ae2.entity_id IN :node_ids
            GROUP BY ae1.entity_id, ae2.entity_id
            HAVING COUNT(DISTINCT ae1.article_url) > 1;
        """).bindparams(bindparam("node_ids", expanding=True))
        
        # ส่งค่า node_ids ในรูปแบบ list
        links_result = db.execute(links_query, {"node_ids": node_ids}).fetchall()
        
        links = []
        for r in links_result:
            links.append({
                "source": str(r.source_id),
                "target": str(r.target_id),
                "weight": int(r.weight)
            })

        return {"nodes": nodes, "links": links}

    except Exception as e:
        print(f"Error fetching knowledge graph: {e}")
        return {"nodes": [], "links": []}
    finally:
        db.close()