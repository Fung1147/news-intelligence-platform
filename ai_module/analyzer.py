import os
import sys
import torch
import onnxruntime as ort
from optimum.onnxruntime import ORTModelForSequenceClassification, ORTModelForSeq2SeqLM
from data_pipeline.db import NewsArticle, SessionLocal
from transformers import (
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    pipeline,
)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data_pipeline.db import NewsArticle, SessionLocal

provider = "DmlExecutionProvider"
save_dir = "./onnx_models"

print("กำลังโหลดโมเดล AI ...")
print(f"กำลังเริ่มต้นใช้งาน ONNX DirectML (Providers: {provider})")

# 2.1 Sentiment Analysis Model
sentiment_path = os.path.join(save_dir, "sentiment")
if not os.path.exists(sentiment_path):
    print("กำลังแปลงและบันทึกโมเดล Sentiment เป็น ONNX...")
    sentiment_model = ORTModelForSequenceClassification.from_pretrained(
        "distilbert-base-uncased-finetuned-sst-2-english", export=True, provider=provider
    )
    sentiment_tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased-finetuned-sst-2-english")
    sentiment_model.save_pretrained(sentiment_path)
    sentiment_tokenizer.save_pretrained(sentiment_path)
else:
    print("โหลดโมเดล Sentiment จาก Cache local...")
    sentiment_model = ORTModelForSequenceClassification.from_pretrained(sentiment_path, provider=provider)
    sentiment_tokenizer = AutoTokenizer.from_pretrained(sentiment_path)

sentiment_pipeline = pipeline("sentiment-analysis", model=sentiment_model, tokenizer=sentiment_tokenizer)

# 2.2 Summarization Model
summarizer_path = os.path.join(save_dir, "summarizer")
if not os.path.exists(summarizer_path):
    print("กำลังแปลงและบันทึกโมเดล Summarizer เป็น ONNX...")
    summarizer_model = ORTModelForSeq2SeqLM.from_pretrained(
        "sshleifer/distilbart-cnn-12-6", export=True, provider=provider
    )
    summarizer_tokenizer = AutoTokenizer.from_pretrained("sshleifer/distilbart-cnn-12-6")
    summarizer_model.save_pretrained(summarizer_path)
    summarizer_tokenizer.save_pretrained(summarizer_path)
else:
    print("โหลดโมเดล Summarizer จาก Cache local...")
    summarizer_model = ORTModelForSeq2SeqLM.from_pretrained(summarizer_path, provider=provider)
    summarizer_tokenizer = AutoTokenizer.from_pretrained(summarizer_path)

# 2.3 Zero-Shot Categorization Model
zero_shot_path = os.path.join(save_dir, "zero_shot")
if not os.path.exists(zero_shot_path):
    print("กำลังแปลงและบันทึกโมเดล Zero-Shot Category เป็น ONNX...")
    zero_shot_model = ORTModelForSequenceClassification.from_pretrained(
        "facebook/bart-large-mnli", export=True, provider=provider
    )
    zero_shot_tokenizer = AutoTokenizer.from_pretrained("facebook/bart-large-mnli")
    zero_shot_model.save_pretrained(zero_shot_path)
    zero_shot_tokenizer.save_pretrained(zero_shot_path)
else:
    print("โหลดโมเดล Zero-Shot จาก Cache local...")
    zero_shot_model = ORTModelForSequenceClassification.from_pretrained(zero_shot_path, provider=provider)
    zero_shot_tokenizer = AutoTokenizer.from_pretrained(zero_shot_path)

zero_shot_pipeline = pipeline("zero-shot-classification", model=zero_shot_model, tokenizer=zero_shot_tokenizer)

def analyze_article(title: str = "", content: str = "") -> dict:
    """ประมวลผล Sentiment และ สรุปข่าว"""
    # --- 1. Sentiment Analysis ---
    title_text = title or ""
    content_text = content or ""

    if len(content_text) > 3500:
        head_text = content_text[:2300]
        tail_text = content_text[-1000:]
        combined_content = f"{head_text}\n...\n{tail_text}"
    else:
        combined_content = content_text

    full_text = f"{title_text}. {combined_content}".strip()
    truncated_text = full_text if full_text else title_text

    sentiment_input = truncated_text[:1500]
    sentiment_result = sentiment_pipeline(sentiment_input)[0]

    label = sentiment_result["label"]
    score = round(float(sentiment_result["score"]), 4)

    # --- 2. Summarization ---
    summary_text = ""
    if len(content.split()) > 30:
        inputs = summarizer_tokenizer(
            truncated_text,
            max_length=1024,
            truncation=True,
            return_tensors="pt",
        )
        summary_ids = summarizer_model.generate(
            inputs["input_ids"],
            attention_mask=inputs["attention_mask"],
            max_length=60,
            min_length=25,
            num_beams=2,
            early_stopping=True,
        )
        summary_text = summarizer_tokenizer.decode(
            summary_ids[0], skip_special_tokens=True
        )
    else:
        summary_text = content or title

    # Zero-shot classification
    candidate_labels = ["Tech & AI", "Finance & Economy", "Politics & Law", "General"]

    category_text = truncated_text[:2000] if truncated_text else title_text
    category_result = zero_shot_pipeline(
        category_text, 
        candidate_labels=candidate_labels
    )
    predicted_category = category_result["labels"][0]

    return {
        "sentiment_label": label,
        "sentiment_score": score,
        "summary": summary_text,
        "category": predicted_category,
    }

def process_unprocessed_articles(limit: int = 20):
    """ดึงข่าวที่ยังไม่มีผล AI จาก DB มาประมวลผล"""
    db = SessionLocal()
    try:
        unprocessed = (
            db.query(NewsArticle)
            .filter(
                (NewsArticle.sentiment_label.is_(None)) | 
                (NewsArticle.category.is_(None))
            )
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
            
            # ส่งทั้ง title และ content เข้าไปวิเคราะห์
            ai_results = analyze_article(title=article.title, content=article.content)

            article.sentiment_label = ai_results["sentiment_label"]
            article.sentiment_score = ai_results["sentiment_score"]
            article.summary = ai_results["summary"]
            article.category = ai_results["category"]  # เซฟหมวดหมู่ลง DB

            print(f"   [Sentiment]: {ai_results['sentiment_label']} ({ai_results['sentiment_score']})")
            print(f"   [Category] : {ai_results['category']}")
            print(f"   [Summary]  : {ai_results['summary']}\n")

        db.commit()
        print("ประมวลผลและบันทึกผล AI ลง Database เรียบร้อย!")
    except Exception as e:
        db.rollback()
        print(f"เกิดข้อผิดพลาด: {e}")
    finally:
        db.close()