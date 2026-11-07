from data_pipeline.db import NewsArticle, SessionLocal
from transformers import (
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    pipeline,
)

print("กำลังโหลดโมเดล AI ...")

sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english",
)

sum_model_name = "sshleifer/distilbart-cnn-12-6"
summarizer_tokenizer = AutoTokenizer.from_pretrained(sum_model_name)
summarizer_model = AutoModelForSeq2SeqLM.from_pretrained(sum_model_name)

def analyze_article(content: str) -> dict:
    """ประมวลผล Sentiment และ สรุปข่าว"""
    # --- 1. Sentiment Analysis ---
    truncated_text = content[:1000]
    sentiment_result = sentiment_pipeline(truncated_text[:512])[0]

    label = sentiment_result["label"]
    score = round(float(sentiment_result["score"]), 4)

    # --- 2. Summarization ---
    if len(content.split()) > 30:
        inputs = summarizer_tokenizer(
            truncated_text,
            max_length=1024,
            truncation=True,
            return_tensors="pt",
        )
        summary_ids = summarizer_model.generate(
            inputs["input_ids"],
            max_length=60,
            min_length=25,
            num_beams=2,
            early_stopping=True,
        )
        summary_text = summarizer_tokenizer.decode(
            summary_ids[0], skip_special_tokens=True
        )
    else:
        summary_text = content

    return {
        "sentiment_label": label,
        "sentiment_score": score,
        "summary": summary_text,
    }

def process_unprocessed_articles(limit: int = 10):
    """ดึงข่าวที่ยังไม่มีผล AI จาก DB มาประมวลผล"""
    db = SessionLocal()
    try:
        unprocessed = (
            db.query(NewsArticle)
            .filter(NewsArticle.sentiment_label.is_(None))
            .limit(limit)
            .all()
        )

        if not unprocessed:
            print("ไม่มีข่าวใหม่ที่ต้องประมวลผลด้วย AI")
            return

        print(
            f"\nกำลังประมวลผล AI สำหรับข่าว {len(unprocessed)} รายการ...\n"
        )
        for article in unprocessed:
            print(f"กำลังวิเคราะห์: {article.title[:50]}...")
            ai_results = analyze_article(article.content)

            article.sentiment_label = ai_results["sentiment_label"]
            article.sentiment_score = ai_results["sentiment_score"]
            article.summary = ai_results["summary"]

            print(
                f"   [Sentiment]: {ai_results['sentiment_label']} ({ai_results['sentiment_score']})"
            )
            print(f"   [Summary]  : {ai_results['summary']}\n")

        db.commit()
        print("ประมวลผลและบันทึกผล AI ลง Database เรียบร้อย!")

    except Exception as e:
        db.rollback()
        print(f"เกิดข้อผิดพลาดใน AI Module: {e}")
    finally:
        db.close()