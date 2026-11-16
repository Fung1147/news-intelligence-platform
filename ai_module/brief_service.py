import requests
import re
import time

def _resolve_sentiment(article: dict) -> str:
    label = article.get("sentiment_label")
    score = article.get("sentiment_score")

    if not label:
        return "UNPROCESSED"

    clean_label = str(label).upper()
    if isinstance(score, (int, float)):
        return f"{clean_label} ({score:.2f})"
    return clean_label

def generate_entity_brief(entity_name: str, articles: list) -> dict:
    if not articles:
        return {
            "bullets": ["Insufficient news articles available to generate an intelligence brief."],
            "metrics": None
        }

    selected_articles = articles[:15]
    news_context = "\n".join([
        f"{i+1}. [{a.get('category') or 'General'} | {_resolve_sentiment(a)}] {a.get('title', '')}: {a.get('summary') or ''}"
        for i, a in enumerate(selected_articles)
    ])

    prompt = f"""You are a senior News Intelligence Analyst.
        Analyze the recent news coverage below regarding "{entity_name}" and synthesize a comprehensive yet scannable executive intelligence brief:

        {news_context}

        Requirements:
        1. Output ONLY 5 detailed, high-impact bullet points in English, one per line. No intro or conclusion.
        2. Follow this exact labeled structure (write 2 well-crafted sentences per bullet, ~35-45 words each):
        - **Bottom Line:** [2 sentences summarizing the core strategic narrative and overall market standing of {entity_name}]
        - **Key Moves:** [2 sentences detailing major product launches, tech innovations, partnerships, or financial figures]
        - **Market Context:** [2 sentences explaining competitor actions, industry shifts, and macro catalysts impacting {entity_name}]
        - **Sentiment Driver:** [Positive / Negative / Mixed] — [2 sentences analyzing the specific positive catalysts vs. negative headwinds driving coverage]
        - **Strategic Outlook:** [2 sentences highlighting near-term risks, competitive threats, or upcoming opportunities to watch]
        3. Lead with concrete facts, exact product names, and numbers from the articles. Avoid vague generalizations."""
        
    start_time = time.perf_counter()
    try:
        response = requests.post(
            "http://localhost:1235/v1/chat/completions",
            json={
                "model": "qwen/qwen3.8-27b",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 8192,
                "reasoning_effort": "none"
            },
            timeout=600
        )
        response.raise_for_status()
        elapsed = round(time.perf_counter() - start_time, 2)

        data = response.json()
        raw_content = data["choices"][0]["message"]["content"].strip()

        # cleaning Bullet points
        lines = [line.strip() for line in raw_content.splitlines() if line.strip()]
        bullets = [re.sub(r"^[-*•\d.)]+\s*", "", line) for line in lines][:5]

        usage = data.get("usage", {})
        completion_tokens = usage.get("completion_tokens", 0)
        tps = round(completion_tokens / elapsed, 1) if elapsed > 0 else 0

        return {
            "bullets": bullets,
            "metrics": {
                "elapsed_seconds": elapsed,
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": completion_tokens,
                "total_tokens": usage.get("total_tokens", 0),
                "tokens_per_second": tps,
                "articles_analyzed": len(selected_articles),
                "cached": False
            }
        }
    except Exception as e:
        return {
            "bullets": [f"Failed to generate brief: {str(e)}"],
            "metrics": None
        }