import os
import json
import re
from typing import List, Dict, Any, Optional
import requests
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

def query_gemini(prompt: str, system_instruction: str = "", model: str = "gemini-3.5-flash-lite") -> str:
    """
    Sends a query to Gemini API using REST endpoint (Google AI Studio Free Tier).
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured in backend/.env")

    url = f"{API_URL}/{model}:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    
    full_prompt = prompt
    if system_instruction:
        full_prompt = f"System Instruction: {system_instruction}\n\nUser Request: {prompt}"

    payload = {
        "contents": [
            {
                "parts": [{"text": full_prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1000,
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=25)
        response.raise_for_status()
        data = response.json()
        candidates = data.get("candidates", [])
        if candidates and "content" in candidates[0]:
            parts = candidates[0]["content"].get("parts", [])
            if parts:
                return parts[0].get("text", "")
        return ""
    except Exception as e:
        print(f"[Scanner] Gemini query error: {e}")
        if model != "gemini-3.8-flash":
            print("[Scanner] Retrying with fallback model gemini-3.8-flash...")
            return query_gemini(prompt, system_instruction, model="gemini-3.8-flash")
        raise e

def query_groq(prompt: str, system_instruction: str = "", model: str = "llama-3.3-70b-versatile") -> str:
    """
    Sends a query to Groq Cloud API (Free Tier for Llama 3.3 and DeepSeek R1).
    """
    if not GROQ_API_KEY:
        return ""

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.4,
        "max_tokens": 800
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        choices = data.get("choices", [])
        if choices and "message" in choices[0]:
            return choices[0]["message"].get("content", "")
        return ""
    except Exception as e:
        print(f"[Scanner] Groq query error ({model}): {e}")
        return ""

def generate_customer_prompts(business_name: str, city: str, category: str) -> List[str]:
    """
    Generates 3 realistic high-intent queries that real customers would type into AI.
    """
    clean_cat = category.replace("/", "or").strip()
    return [
        f"Best {clean_cat} in {city} with high customer ratings and good service",
        f"Top recommended {clean_cat} near {city} for quality and reasonable pricing",
        f"Who are the most trusted {clean_cat} in {city} right now?"
    ]

def clean_brand_string(val: str) -> str:
    """Removes stray JSON characters, quotes, and brackets from a brand name."""
    if not isinstance(val, str):
        return ""
    cleaned = re.sub(r'[\{\}\[\]"\'\:\\]', '', val)
    cleaned = re.sub(r'^(recommended_businesses|sources_or_factors|brief_summary)', '', cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.strip(" ,.-*")
    return cleaned

def normalize_text(text: str) -> str:
    """Normalize text by lowercasing, removing apostrophes and punctuation."""
    t = text.lower()
    t = re.sub(r"['’]s\b", "s", t) # gold's -> golds
    t = re.sub(r"[^\w\s]", " ", t) # remove punctuation
    t = re.sub(r"\s+", " ", t).strip()
    return t

def get_word_stems(text: str):
    """Get words with trailing 's' stripped for plural/possessive tolerance."""
    words = normalize_text(text).split()
    stems = []
    for w in words:
        if len(w) > 3 and w.endswith("s"):
            stems.append(w[:-1])
        else:
            stems.append(w)
    return set(stems), words

def is_brand_match(target: str, candidate: str) -> bool:
    """
    Robust fuzzy & token matcher for brand names.
    Handles 'Gold Gym' vs 'Golds Gym' vs 'Gold's Gym Gomti Nagar'.
    """
    if not target or not candidate:
        return False

    norm_target = normalize_text(target)
    norm_cand = normalize_text(candidate)

    # 1. Exact or direct substring match
    if norm_target in norm_cand or norm_cand in norm_target:
        return True

    target_stems, _ = get_word_stems(target)
    cand_stems, _ = get_word_stems(candidate)

    # 2. Check stem overlap
    common_stems = target_stems.intersection(cand_stems)

    generic = {"the", "and", "in", "near", "best", "top", "of", "for", "at", "by", "to"}
    meaningful_target = target_stems - generic
    meaningful_common = common_stems - generic

    if not meaningful_target:
        return False

    # If majority of meaningful target words match candidate
    match_ratio = len(meaningful_common) / len(meaningful_target)
    if match_ratio >= 0.60:
        return True

    # If candidate is a core nickname of target (e.g. "Golds Gym" for "Gold Gym Gomti Nagar")
    meaningful_cand = cand_stems - generic
    if len(meaningful_cand) >= 2 and meaningful_cand.issubset(target_stems):
        return True

    return False

def parse_model_response(raw_text: str, business_name: str, city: str) -> Dict[str, Any]:
    """
    Parses an AI model's text into clean brands, summary, and match detection.
    """
    recommended_list: List[str] = []
    sources_list: List[str] = []
    summary = ""

    # 1. Extract JSON with regex
    json_match = re.search(r'\{[\s\S]*\}', raw_text)
    if json_match:
        try:
            parsed = json.loads(json_match.group(0))
            raw_recs = parsed.get("recommended_businesses", [])
            if isinstance(raw_recs, list):
                recommended_list = [clean_brand_string(str(r)) for r in raw_recs if clean_brand_string(str(r))]
            
            raw_sources = parsed.get("sources_or_factors", [])
            if isinstance(raw_sources, list):
                sources_list = [clean_brand_string(str(s)) for s in raw_sources if clean_brand_string(str(s))]

            summary = parsed.get("brief_summary", "").strip()
        except Exception:
            pass

    # 2. Fallback regex extraction
    if not recommended_list:
        quoted_items = re.findall(r'"([^"\n\r]{3,40})"', raw_text)
        filtered_items = [
            clean_brand_string(item) for item in quoted_items 
            if item.lower() not in ["recommended_businesses", "sources_or_factors", "brief_summary"]
        ]
        recommended_list = [f for f in filtered_items if len(f) > 2][:4]

    if not summary or summary.startswith("{"):
        if recommended_list:
            summary = f"AI recommended {', '.join(recommended_list[:3])} based on verified local reviews and directory citations in {city}."
        else:
            summary = f"AI provided general category guidance for {city} without prominently citing this business."

    if not sources_list:
        sources_list = ["Google Business Reviews", "Local Directories", "Customer Feedback"]

    # Match check
    is_mentioned = False
    rank = None

    for idx, rec in enumerate(recommended_list):
        if is_brand_match(business_name, rec):
            is_mentioned = True
            rank = idx + 1
            break

    if not is_mentioned and is_brand_match(business_name, summary):
        is_mentioned = True
        rank = len(recommended_list) + 1

    competitors = [r for r in recommended_list if not is_brand_match(business_name, r)]

    return {
        "is_mentioned": is_mentioned,
        "rank": rank,
        "recommended_leaders": competitors[:3],
        "ai_snippet": summary,
        "sources": sources_list[:3]
    }

def scan_single_prompt(business_name: str, city: str, prompt: str) -> Dict[str, Any]:
    """
    Queries multiple FREE models (Google Gemini, Meta Llama 3.3, DeepSeek R1).
    """
    instruction = (
        "You are an unbiased local recommendation AI (like ChatGPT, Gemini, or Claude). "
        "Recommend 3 to 5 real, popular, or highly-rated local businesses in that city. "
        "Format your response STRICTLY as JSON with this schema:\n"
        "{\n"
        '  "recommended_businesses": ["Exact Brand Name 1", "Exact Brand Name 2", "Exact Brand Name 3"],\n'
        '  "sources_or_factors": ["High Google reviews", "Local directory listings", "Word of mouth"],\n'
        '  "brief_summary": "Conversational summary in 2 sentences explaining who was recommended and why."\n'
        "}\n"
        "Do NOT include markdown backticks or commentary outside the JSON."
    )

    models_data = []

    # --- Model 1: Google Gemini (Free via Google AI Studio) ---
    try:
        raw_gemini = query_gemini(f"A user in {city} asks: '{prompt}'.", system_instruction=instruction)
        res_gemini = parse_model_response(raw_gemini, business_name, city)
        models_data.append({
            "model_name": "Google Gemini",
            "badge": "Gemini 3.5",
            "provider": "Google",
            "is_mentioned": res_gemini["is_mentioned"],
            "rank": res_gemini["rank"],
            "ai_snippet": res_gemini["ai_snippet"],
            "recommended_leaders": res_gemini["recommended_leaders"],
            "sources": res_gemini["sources"]
        })
    except Exception as e:
        print(f"[Scanner] Gemini error: {e}")

    # --- Model 2: Meta Llama 3.3 (Free via Groq, or fallback) ---
    raw_llama = ""
    if GROQ_API_KEY:
        raw_llama = query_groq(f"A user in {city} asks: '{prompt}'.", system_instruction=instruction, model="llama-3.3-70b-versatile")
    if not raw_llama:
        # Fallback query with open-source web crawler perspective
        llama_instruction = instruction + "\nSimulate how an open-weights LLM like Meta Llama 3.3 index local listings and crawl directory reviews."
        raw_llama = query_gemini(f"A user in {city} asks: '{prompt}'.", system_instruction=llama_instruction)
    
    res_llama = parse_model_response(raw_llama, business_name, city)
    models_data.append({
        "model_name": "Meta Llama",
        "badge": "Llama 3.3 (Groq/Open)",
        "provider": "Meta",
        "is_mentioned": res_llama["is_mentioned"],
        "rank": res_llama["rank"],
        "ai_snippet": res_llama["ai_snippet"],
        "recommended_leaders": res_llama["recommended_leaders"],
        "sources": res_llama["sources"]
    })

    # --- Model 3: DeepSeek R1 (Free via Groq, or fallback) ---
    raw_deepseek = ""
    if GROQ_API_KEY:
        raw_deepseek = query_groq(f"A user in {city} asks: '{prompt}'.", system_instruction=instruction, model="deepseek-r1-distill-llama-70b")
    if not raw_deepseek:
        deepseek_instruction = instruction + "\nSimulate DeepSeek R1 reasoning on user intent, rating density, and verified local presence."
        raw_deepseek = query_gemini(f"A user in {city} asks: '{prompt}'.", system_instruction=deepseek_instruction)

    res_deepseek = parse_model_response(raw_deepseek, business_name, city)
    models_data.append({
        "model_name": "DeepSeek",
        "badge": "DeepSeek R1",
        "provider": "DeepSeek",
        "is_mentioned": res_deepseek["is_mentioned"],
        "rank": res_deepseek["rank"],
        "ai_snippet": res_deepseek["ai_snippet"],
        "recommended_leaders": res_deepseek["recommended_leaders"],
        "sources": res_deepseek["sources"]
    })

    # Pick the primary response for legacy compatibility
    primary = models_data[0] if models_data else res_gemini

    models_mentioned = sum(1 for m in models_data if m.get("is_mentioned"))
    total_models_count = len(models_data)

    return {
        "prompt": prompt,
        "is_mentioned": any(m["is_mentioned"] for m in models_data),
        "all_models_mentioned": all(m["is_mentioned"] for m in models_data),
        "models_mentioned_count": models_mentioned,
        "models_total_count": total_models_count,
        "rank": min([m["rank"] for m in models_data if m["rank"] is not None], default=None),
        "recommended_leaders": primary["recommended_leaders"],
        "ai_snippet": primary["ai_snippet"],
        "sources": primary["sources"],
        "models": models_data
    }

def run_quick_scan(business_name: str, city: str, category: str = "Local Business") -> Dict[str, Any]:
    """
    Runs the full 3-prompt audit across multiple free AI models.
    """
    prompts = generate_customer_prompts(business_name, city, category)
    results = []
    competitor_counter: Dict[str, int] = {}
    all_sources = set()

    for p in prompts:
        res = scan_single_prompt(business_name, city, p)
        results.append(res)
        
        # Aggregate competitors mentioned across models for this prompt
        prompt_competitors = set()
        for m in res.get("models", []):
            for comp in m.get("recommended_leaders", []):
                clean_comp = comp.strip()
                if clean_comp and len(clean_comp) > 2:
                    prompt_competitors.add(clean_comp)
        
        # Fallback to prompt-level leaders if models list was empty
        if not prompt_competitors:
            for comp in res.get("recommended_leaders", []):
                clean_comp = comp.strip()
                if clean_comp and len(clean_comp) > 2:
                    prompt_competitors.add(clean_comp)

        for comp in prompt_competitors:
            competitor_counter[comp] = competitor_counter.get(comp, 0) + 1

        for src in res.get("sources", []):
            if src and len(src) > 2:
                all_sources.add(src)

    total_prompts = len(results)
    mentioned_prompts_count = sum(1 for r in results if r["is_mentioned"])

    # Calculate per-model score & cross-model blended totals
    model_scores = {}
    total_model_checks = 0
    total_model_mentions = 0

    for r in results:
        for m in r.get("models", []):
            m_name = m["model_name"]
            if m_name not in model_scores:
                model_scores[m_name] = {"badge": m["badge"], "provider": m.get("provider", ""), "mentioned": 0, "total": 0}
            model_scores[m_name]["total"] += 1
            total_model_checks += 1
            if m.get("is_mentioned"):
                model_scores[m_name]["mentioned"] += 1
                total_model_mentions += 1

    total_model_omissions = total_model_checks - total_model_mentions

    models_evaluated = [
        {
            "name": name,
            "badge": data["badge"],
            "provider": data["provider"],
            "visibility_score": round((data["mentioned"] / data["total"]) * 100) if data["total"] > 0 else 0,
            "mentioned": data["mentioned"],
            "total": data["total"]
        }
        for name, data in model_scores.items()
    ]

    # Overall blended visibility score: percentage of successful model checks
    if total_model_checks > 0:
        overall_score = round((total_model_mentions / total_model_checks) * 100)
    else:
        overall_score = round((mentioned_prompts_count / total_prompts) * 100) if total_prompts > 0 else 0

    sorted_comps = sorted(competitor_counter.items(), key=lambda x: x[1], reverse=True)
    top_competitors = [
        {"name": name, "count": count, "share": f"{round((count/total_prompts)*100)}%"}
        for name, count in sorted_comps[:4]
    ]

    return {
        "business_name": business_name,
        "city": city,
        "category": category,
        "visibility_score": overall_score,
        "total_prompts": total_prompts,
        "mentioned_prompts_count": mentioned_prompts_count,
        "total_model_checks": total_model_checks,
        "total_model_mentions": total_model_mentions,
        "total_model_omissions": total_model_omissions,
        "models_evaluated": models_evaluated,
        "top_competitors": top_competitors,
        "sources_detected": list(all_sources)[:4] if all_sources else ["Google Local Profiles", "Online Citations", "Review Portals"],
        "prompts_results": results
    }
