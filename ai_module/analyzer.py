import os
import sys
import onnxruntime as ort
import spacy
from collections import Counter
from optimum.onnxruntime import ORTModelForSequenceClassification, ORTModelForSeq2SeqLM
from data_pipeline.db import NewsArticle, SessionLocal, Entity
from transformers import (
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

# โหลด spacy model สกัด NER และ Keywords
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    print("กำลังดาวน์โหลด spacy model...")
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

def extract_ner_and_keywords(text: str, max_keywords: int = 5):

    if not text:
        return [], ""

    doc = nlp(text)

    # สกัด Entities (เน้นเฉพาะ บุคคล, องค์กร/บริษัท, สถานที่)
    allowed_types = {"PERSON", "ORG", "GPE"}
    entities = []
    seen_entities = set()

    for ent in doc.ents:
        clean_name = ent.text.strip()
        # กรองเอาเฉพาะประเภทที่ต้องการ และตัดคำขยะสั้นๆ ออก
        if ent.label_ in allowed_types and len(clean_name) > 2:
            entity_key = (clean_name.lower(), ent.label_)
            if entity_key not in seen_entities:
                seen_entities.add(entity_key)
                entities.append({
                    "name": clean_name,
                    "type": ent.label_
                })

    # สกัด Keywords (ดึงคำนาม/คำคุณศัพท์ที่เจอบ่อย และไม่ใช่ Stop words)
    keywords_list = []
    for token in doc:
        if (token.pos_ in {"NOUN", "PROPN", "ADJ"} 
            and not token.is_stop 
            and len(token.text) > 3 
            and token.is_alpha):
            keywords_list.append(token.lemma_.capitalize())

    # สรุปเอาคีย์เวิร์ดที่ถี่ที่สุด top N ตัว
    most_common = [word for word, count in Counter(keywords_list).most_common(max_keywords)]
    keywords_str = ", ".join(most_common)

    return entities, keywords_str

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
    if len(content_text.split()) > 30:
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

    # NER & Keyword Extraction (เพิ่มใหม่)
    entities, keywords = extract_ner_and_keywords(truncated_text)

    return {
        "sentiment_label": label,
        "sentiment_score": score,
        "summary": summary_text,
        "category": predicted_category,
        "keywords": keywords,
        "entities": entities,
    }

def process_unprocessed_articles(limit: int = 100):
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
            article.category = ai_results["category"]

            # Keywords (New feature)
            article.keywords = ai_results.get("keywords", "")

            entities_data = ai_results.get("entities", [])
            for ent_data in entities_data:
                ent_name = ent_data["name"].strip()
                ent_type = ent_data["type"].strip()

                # ค้นหา Entity เดิมใน Master Table หรือสร้างใหม่ถ้ายังไม่มี
                entity_obj = db.query(Entity).filter(Entity.name == ent_name).first()
                if not entity_obj:
                    entity_obj = Entity(name=ent_name, entity_type=ent_type)
                    db.add(entity_obj)

                # ผูก Relationship (เช็กป้องกันการผูกซ้ำ)
                if entity_obj not in article.entities:
                    article.entities.append(entity_obj)

            print(f"   [Sentiment]: {ai_results['sentiment_label']} ({ai_results['sentiment_score']})")
            print(f"   [Category] : {ai_results['category']}")
            print(f"   [Keywords] : {article.keywords}")
            print(f"   [Entities] : {[e['name'] for e in entities_data]}")
            print(f"   [Summary]  : {ai_results['summary']}\n")

        db.commit()
        print("ประมวลผลและบันทึกผล AI (NER & Keywords) ลง Database เรียบร้อย!")
    except Exception as e:
        db.rollback()
        print(f"เกิดข้อผิดพลาด: {e}")
    finally:
        db.close()