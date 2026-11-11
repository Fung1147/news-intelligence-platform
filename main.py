from data_pipeline.scraper import fetch_news_from_rss
from data_pipeline.db import init_db, save_articles_to_db
from ai_module.analyzer import process_unprocessed_articles

if __name__ == "__main__":

    print("Starting News Intelligence Pipeline")

    print("กำลังเชื่อมต่อและเตรียม Database...")
    init_db()
    
    sources = [
        {"name": "BBC World", "url": "http://feeds.bbci.co.uk/news/world/rss.xml"},
        {"name": "TechCrunch", "url": "https://techcrunch.com/feed/"},
        {"name": "CNN Top Stories", "url": "http://rss.cnn.com/rss/edition.rss"},
    ]

    all_news = []
    for source in sources:
        print(f"กำลังดึงข่าวจาก: {source['name']}...")
        news_items = fetch_news_from_rss(source["url"], source["name"])
        all_news.extend(news_items)

    print(f"\nดึงข่าวสำเร็จทั้งหมด: {len(all_news)} ข่าว!\n")
    save_articles_to_db(all_news)

    # AI ทดสอบทีละ 100 ข่าว
    print("\nเริ่มประมวลผลด้วย AI Module...")
    process_unprocessed_articles(limit=100)    

    print("\nทำงานเสร็จสิ้นสมบูรณ์!")