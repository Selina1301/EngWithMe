let grammarTopics = [];

if (typeof window !== "undefined") {
  window.grammarTopics = grammarTopics;
  window.loadGrammarTopicsFromApi = loadGrammarTopicsFromApi;
}

async function loadGrammarTopicsFromApi() {
  try {
    const response = await fetch("api/learning_content.php?section=grammar", {
      credentials: "same-origin",
      cache: "no-store"
    });
    if (!response.ok) {
      return await loadFallback();
    }

    const result = await response.json();
    const loaded = Array.isArray(result.items)
      ? result.items.map(normalizeGrammarTopic).filter(Boolean)
      : [];

    if (!loaded.length) {
      return await loadFallback();
    }
    
    grammarTopics = loaded;
    if (typeof window !== "undefined") {
      window.grammarTopics = grammarTopics;
      window.GRAMMAR_TOPICS_SOURCE = result.source || "database";
    }
    return true;
  } catch (error) {
    console.warn("Grammar content API unavailable; trying fallback.", error);
    return await loadFallback();
  }
}

async function loadFallback() {
  const success = await loadFallbackScript();
  if (success && typeof window !== "undefined" && window.grammarTopics) {
    grammarTopics = window.grammarTopics;
    return true;
  }
  return false;
}

async function loadFallbackScript() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "js/grammar-data-fallback.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function normalizeGrammarTopic(item, index) {
  const payload = item?.payload && typeof item.payload === "object" ? item.payload : item;
  if (!payload || typeof payload !== "object") return null;

  const sortOrder = Number(item?.sortOrder || payload.order || index + 1);
  const topic = {
    ...payload,
    id: item?.key || payload.id,
    order: String(payload.order || sortOrder || index + 1).padStart(2, "0"),
    title: payload.title || item?.title || item?.key,
    level: payload.level || item?.level || "Core",
    time: payload.time || "20 phút",
    summary: payload.summary || payload.description || item?.description || "",
    theory: Array.isArray(payload.theory) ? payload.theory : [],
    formulas: Array.isArray(payload.formulas) ? payload.formulas : [],
    examples: Array.isArray(payload.examples) ? payload.examples : [],
    mistakes: Array.isArray(payload.mistakes) ? payload.mistakes : [],
    exercises: Array.isArray(payload.exercises) ? payload.exercises : []
  };

  return topic.id && topic.title && topic.exercises.length ? topic : null;
}
