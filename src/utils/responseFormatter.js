function normalizeAssistantResponse(payload) {
  const fallback = {
    answer: "I can help you explore the portfolio.",
    actions: [],
    suggestions: [],
    mode: "unknown",
  };

  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  return {
    answer:
      typeof payload.answer === "string" && payload.answer.trim()
        ? payload.answer
        : fallback.answer,
    actions: Array.isArray(payload.actions)
      ? payload.actions
          .map((a) => {
            if (!a || typeof a !== "object") return null;
            // prefer explicit target when provided by the model
            const rawType = (a.type || a.action || "").toString().toLowerCase();
            const target = (a.target || a.name || "").toString().toLowerCase();

            // Determine the canonical type that frontend handles (projects, skills, contact, resume, about)
            let type = rawType;
            if (rawType === "navigate" && target) {
              type = target;
            }
            if (!type && target) type = target;

            // Build a friendly label
            let label = a.label || "";
            if (!label) {
              if (type.includes("project")) label = "View projects";
              else if (type.includes("skill")) label = "See skills";
              else if (type.includes("contact")) label = "Contact me";
              else if (type.includes("resume")) label = "Open resume";
              else if (type.includes("about")) label = "About";
              else if (target) label = `Open ${target}`;
              else label = rawType || "Open";
            }

            return { label, type };
          })
          .filter(Boolean)
      : fallback.actions,
    suggestions: Array.isArray(payload.suggestions)
      ? payload.suggestions
      : fallback.suggestions,
    mode: typeof payload.mode === "string" ? payload.mode : fallback.mode,
  };
}

module.exports = { normalizeAssistantResponse };
