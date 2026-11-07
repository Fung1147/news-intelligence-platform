from data_pipeline.db import SessionLocal, NewsArticle 

def reset_ai_columns():
    session = SessionLocal()
    try:
        # สั่งให้คอลัมน์ AI ทั้งหมดกลับเป็น None (NULL)
        updated_count = session.query(NewsArticle).update({
            NewsArticle.summary: None,
            NewsArticle.sentiment_label: None,
            NewsArticle.sentiment_score: None,
            NewsArticle.category: None
        })
        
        session.commit()
        print(f"Reset ข้อมูล AI เรียบร้อยแล้ว ทั้งหมด {updated_count} รายการ")
        print("ตอนนี้คอลัมน์ summary, sentiment, category กลายเป็น NULL แล้ว")
    except Exception as e:
        session.rollback()
        print(f"เกิดข้อผิดพลาดในการ Reset: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    reset_ai_columns()