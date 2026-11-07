import requests
from bs4 import BeautifulSoup
import feedparser
from dateutil import parser as date_parser
from datetime import datetime

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    soup = BeautifulSoup(raw_html, "html.parser")
    return soup.get_text(separator=" ", strip=True)

def parse_date(date_str: str) -> str:
    if not date_str:
        return datetime.utcnow().isoformat()
    try:
        return date_parser.parse(date_str).isoformat()
    except Exception:
        return datetime.utcnow().isoformat()

def extract_full_article(url: str) -> str:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return ""

        soup = BeautifulSoup(response.text, 'html.parser')

        # ลบ Element ขยะที่ไม่ใช่เนื้อหาข่าวออกก่อน (โฆษณา, เมนู, วิดีโอ overlay, header/footer)
        for junk in soup.find_all(['header', 'footer', 'nav', 'aside', 'script', 'style', 'iframe']):
            junk.decompose()

        # ลบ class/id ที่เป็นโฆษณาหรือประกาศ
        for banner in soup.find_all(class_=lambda c: c and any(x in c.lower() for x in ['banner', 'announcement', 'promo', 'player', 'video-player'])):
            banner.decompose()

        # เจาะจงดึงเนื้อหาเฉพาะใน <article> หรือแท็กหลักของข่าว
        article_body = soup.find('article') or soup.find('main') or soup
        
        # ดึงเฉพาะข้อความจากแท็ก <p> ที่อยู่ในส่วนบทความเท่านั้น
        paragraphs = article_body.find_all('p')
        
        # กรองเอาเฉพาะข้อความยาวเกิน 40 ตัวอักษร (เพื่อตัดพวกปุ่ม หรือข้อความสั้นๆ ทิ้ง)
        valid_paragraphs = [
            p.get_text(strip=True) for p in paragraphs 
            if len(p.get_text(strip=True)) > 40 and "Founder Summit" not in p.get_text()
        ]

        full_text = " ".join(valid_paragraphs)
        return full_text if full_text else ""

    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return ""

def fetch_news_from_rss(rss_url: str, publisher_name: str) -> list[dict]:
    feed = feedparser.parse(rss_url)
    articles = []

    for entry in feed.entries:
        title = entry.get("title", "").strip()
        url = entry.get("link", "")

        if not title or not url:
            continue

        # อ่านข้อความสำรองจาก RSS Feed ไว้ก่อน
        content_raw = ""
        if "content" in entry and len(entry.content) > 0:
            content_raw = entry.content[0].get("value", "")
        elif "summary" in entry:
            content_raw = entry.get("summary", "")

        rss_content = clean_html(content_raw)

        # พยายามดึงเนื้อหาฉบับเต็มจาก URL ข่าวจริง
        full_content = extract_full_article(url)

        # เลือกใช้ Full Content ถ้าดึงสำเร็จ (ยาวเกิน 300 ตัวอักษร) ถ้าไม่สำเร็จให้ fallback ใช้ RSS Content
        final_content = full_content if len(full_content) > 300 else rss_content
        published_at = parse_date(entry.get("published", entry.get("updated", "")))

        articles.append(
            {
                "title": title,
                "content": final_content,
                "published_at": published_at,
                "url": url,
                "publisher": publisher_name,
            }
        )

    return articles