// Lightweight client-side keyword/domain matcher.
// Extracts a likely domain from the query text and returns matching alumni IDs.
import { supabase } from "@/integrations/supabase/client";

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  "Web Development": ["web", "frontend", "backend", "react", "node", "javascript", "css", "html", "fullstack", "ui", "ux", "faang", "sde", "leetcode", "system design"],
  "Machine Learning": ["ml", "machine learning", "ai", "deep learning", "nlp", "neural", "model", "tensorflow", "pytorch", "kaggle"],
  "Data Science": ["data science", "analytics", "statistics", "pandas", "data engineer", "etl", "a/b test", "growth", "dashboard", "sql"],
  "Cloud & DevOps": ["aws", "azure", "gcp", "kubernetes", "docker", "devops", "sre", "terraform", "cloud", "ci/cd", "infra"],
};

export function extractTopicAndDomain(text: string): { topic: string; domain: string } {
  const lower = text.toLowerCase();
  let bestDomain = "";
  let bestScore = 0;
  for (const [domain, kws] of Object.entries(DOMAIN_KEYWORDS)) {
    const score = kws.reduce((s, k) => s + (lower.includes(k) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; bestDomain = domain; }
  }
  // crude topic = first 4 words
  const topic = text.trim().split(/\s+/).slice(0, 4).join(" ");
  return { topic, domain: bestDomain || "General" };
}

export async function matchAlumniIds(domain: string): Promise<string[]> {
  if (!domain || domain === "General") {
    const { data } = await supabase.from("profiles").select("id").eq("role", "alumnus").limit(10);
    return (data ?? []).map((r) => r.id);
  }
  const { data } = await supabase.from("profiles").select("id").eq("role", "alumnus").eq("domain", domain);
  return (data ?? []).map((r) => r.id);
}
