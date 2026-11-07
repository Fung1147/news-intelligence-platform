from datetime import datetime
import feedparser
from bs4 import BeautifulSoup
from dateutil import parser as date_parser

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

def fetch_news_from_rss(rss_url: str, publisher_name: str) -> list[dict]:
    feed = feedparser.parse(rss_url)
    articles = []

    for entry in feed.entries:
        title = entry.get("title", "").strip()

        content_raw = ""
        if "content" in entry and len(entry.content) > 0:
            content_raw = entry.content[0].get("value", "")
        elif "summary" in entry:
            content_raw = entry.get("summary", "")

        content = clean_html(content_raw)
        published_at = parse_date(entry.get("published", entry.get("updated", "")))
        url = entry.get("link", "")

        if not title or not url:
            continue

        articles.append(
            {
                "title": title,
                "content": content,
                "published_at": published_at,
                "url": url,
                "publisher": publisher_name,
            }
        )

    return articles