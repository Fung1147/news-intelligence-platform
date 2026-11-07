from data_pipeline.db import NewsArticle, SessionLocal

def check_database():
    db = SessionLocal()
    try:
        # 1. นับจำนวนข่าวทั้งหมดใน DB
        total_count = db.query(NewsArticle).count()
        print(f"จำนวนข่าวทั้งหมดใน Database: {total_count} รายการ\n")

        # 2. นับแยกตามสำนักข่าว (Publisher)
        print("สรุปตามสำนักข่าว:")
        publishers = (
            db.query(NewsArticle.publisher)
            .distinct()
            .all()
        )
        for pub in publishers:
            pub_name = pub[0]
            count = (
                db.query(NewsArticle)
                .filter(NewsArticle.publisher == pub_name)
                .count()
            )
            print(f"  - {pub_name}: {count} ข่าว")

        # 3. ดึงตัวอย่างข่าวล่าสุด 3 รายการแรกมาแสดง
        print("\n🔎 ตัวอย่างข่าวล่าสุด 3 รายการใน Database:")
        print("=" * 60)
        latest_articles = (
            db.query(NewsArticle).limit(3).all()
        )
        for idx, article in enumerate(latest_articles, 1):
            print(f"[{idx}] {article.title}")
            print(f"    สำนักข่าว: {article.publisher}")
            print(f"    วันที่: {article.published_at}")
            print(f"    URL: {article.url}")
            print(
                f"    เนื้อหา (ย่อ): {article.content[:100]}..."
            )
            print("-" * 60)

    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการดึงข้อมูล: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_database()