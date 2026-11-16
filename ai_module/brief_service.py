import requests
import re

def generate_entity_brief(entity_name: str, articles: list) -> list:
    if not articles:
        return ["Insufficient news articles available to generate an intelligence brief."]

    selected_articles = articles[:10]
    # Format up to 10 recent articles as structured context
    news_context = "\n".join([
        f"- [{a.get('sentiment_label', 'NEUTRAL')}] {a.get('title', '')}: {a.get('summary', '')}"
        for a in articles[:10]
    ])
    
    print(f"\n{'='*50}\n[DEBUG] Context for '{entity_name}' ({len(selected_articles)} articles):\n{news_context}\n{'='*50}\n", flush=True)

    prompt = f"""You are a senior News Intelligence Analyst.
        Analyze the recent news coverage below regarding "{entity_name}" and synthesize an executive intelligence brief:

        {news_context}

        Requirements:
        1. Provide exactly 3 concise, high-impact bullet points in English.
        2. Bullet 1 & 2: Summarize the most critical developments, strategic moves, or key events.
        3. Bullet 3: Analyze the primary driver behind the overall sentiment (positive, negative, or mixed).
        4. Output ONLY the 3 bullet points, one per line. Do not include any introductory or concluding remarks."""

    try:
        response = requests.post(
            "http://localhost:1235/v1/chat/completions",
            json={
                "model": "qwen/qwen3.8-27b",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 4096
            },
            timeout=600
        )
        response.raise_for_status()
        ai_text = response.json()["choices"][0]["message"]["content"]

        # Strip <think>...</think> blocks if reasoning output is included
        ai_text = re.sub(r"<think>.*?</think>", "", ai_text, flags=re.DOTALL).strip()

        # Parse into a clean 3-item list
        lines = [line.strip("- •*123.").strip() for line in ai_text.split("\n") if line.strip()]
        return lines[:3]

    except Exception as e:
        print(f"LM Studio Error: {e}")
        return ["Unable to connect to LM Studio. Please ensure the Local API server is running."]
    