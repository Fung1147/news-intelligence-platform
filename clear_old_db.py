from data_pipeline.db import SessionLocal, NewsArticle

def clear_database():
    session = SessionLocal()
    try:
        # สั่งลบแถวข้อมูลข่าวทั้งหมดในตาราง
        deleted_count = session.query(NewsArticle).delete()
        session.commit()
        print(f"ลบข้อมูลข่าวเก่าเรียบร้อยแล้วทั้งหมด {deleted_count} รายการ")
    except Exception as e:
        session.rollback()
        print(f"เกิดข้อผิดพลาด: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    clear_database()