interface Highlight {
  id: string;
  text: string;
  url: string;
  title: string;
  timestamp: number;
}

document.addEventListener("DOMContentLoaded", () => {
  const highlightsList = document.getElementById(
    "highlights-list",
  ) as HTMLDivElement;
  const countEl = document.getElementById("count") as HTMLSpanElement;
  const summarizeBtn = document.getElementById(
    "summarize-btn",
  ) as HTMLButtonElement;
  const detachBtn = document.getElementById("detach-btn") as HTMLButtonElement;

  const settingsBtn = document.getElementById(
    "settings-btn",
  ) as HTMLButtonElement;
  const settingsPanel = document.getElementById(
    "settings-panel",
  ) as HTMLDivElement;
  const apiKeyInput = document.getElementById(
    "api-key-input",
  ) as HTMLInputElement;
  const saveKeyBtn = document.getElementById(
    "save-key-btn",
  ) as HTMLButtonElement;
  const closeSettingsBtn = document.getElementById(
    "close-settings-btn",
  ) as HTMLButtonElement;

  const summaryPanel = document.getElementById(
    "summary-panel",
  ) as HTMLDivElement;
  const closeSummaryBtn = document.getElementById(
    "close-summary-btn",
  ) as HTMLButtonElement;
  const summaryContent = document.getElementById(
    "summary-content",
  ) as HTMLDivElement;

  // Modal elements
  const deleteModal = document.getElementById("delete-modal") as HTMLDivElement;
  const confirmDeleteBtn = document.getElementById(
    "confirm-delete-btn",
  ) as HTMLButtonElement;
  const cancelDeleteBtn = document.getElementById(
    "cancel-delete-btn",
  ) as HTMLButtonElement;

  let currentHighlights: Highlight[] = [];
  let pendingDeleteId: string | null = null;

  // Load highlights on start
  loadHighlights();

  // Listen for highlights added from other pages in real-time
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.highlights) {
      loadHighlights();
    }
  });

  // Detach App inside Window Logic
  chrome.windows.getCurrent((win) => {
    if (win.type === "popup") {
      // We are in detached mode
      detachBtn.title = "Unlock Window (Close)";
      detachBtn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>';
      detachBtn.addEventListener("click", () => {
        window.close();
      });
    } else {
      // Standard extension popup mode
      detachBtn.addEventListener("click", () => {
        chrome.windows.create({
          url: chrome.runtime.getURL("popup.html"),
          type: "popup",
          width: 380,
          height: 600,
        });
        window.close();
      });
    }
  });

  // Settings Panel Logic
  settingsBtn.addEventListener("click", () => {
    chrome.storage.local.get(["groqApiKey"], (res) => {
      if (res.groqApiKey) apiKeyInput.value = res.groqApiKey;
      settingsPanel.classList.toggle("hidden");
      summaryPanel.classList.add("hidden");
    });
  });

  closeSettingsBtn.addEventListener("click", () => {
    settingsPanel.classList.add("hidden");
  });

  saveKeyBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    chrome.storage.local.set({ groqApiKey: key }, () => {
      settingsPanel.classList.add("hidden");
    });
  });

  closeSummaryBtn.addEventListener("click", () => {
    summaryPanel.classList.add("hidden");
  });

  // Global Summarize Logic
  summarizeBtn.addEventListener("click", () => {
    if (currentHighlights.length === 0) return;
    executeSummarize(currentHighlights);
  });

  // Modal logic
  cancelDeleteBtn.addEventListener("click", () => {
    deleteModal.classList.add("hidden");
    pendingDeleteId = null;
  });

  confirmDeleteBtn.addEventListener("click", () => {
    if (pendingDeleteId) {
      deleteHighlight(pendingDeleteId);
    }
    deleteModal.classList.add("hidden");
  });

  function executeSummarize(highlights: Highlight[]) {
    chrome.storage.local.get(["groqApiKey"], (res) => {
      if (!res.groqApiKey) {
        settingsPanel.classList.remove("hidden");
        apiKeyInput.focus();
        return;
      }

      settingsPanel.classList.add("hidden");
      summaryPanel.classList.remove("hidden");
      summaryContent.innerHTML =
        '<div class="loading"><div class="spinner"></div><span class="loading-text">Analyzing highlights...</span></div>';

      generateSummary(res.groqApiKey, highlights)
        .then((summary) => {
          summaryContent.innerHTML = `<div class="markdown-body">${formatSummary(summary)}</div>`;
        })
        .catch((err) => {
          const errorMsg = err instanceof Error ? err.message : "Unknown Error";
          summaryContent.innerHTML = `<div style="color:var(--danger);">Error: ${errorMsg}</div>`;
        });
    });
  }

  function loadHighlights() {
    chrome.storage.local.get({ highlights: [] }, (result) => {
      const rawHighlights = result.highlights as Highlight[];
      currentHighlights = rawHighlights.sort(
        (a, b) => b.timestamp - a.timestamp,
      );
      countEl.textContent = currentHighlights.length.toString();
      renderHighlights(currentHighlights);
    });
  }

  function renderHighlights(highlights: Highlight[]) {
    if (highlights.length === 0) {
      highlightsList.innerHTML =
        '<div class="empty-state">No highlights saved yet.<br>Select text on any webpage to begin!</div>';
      summarizeBtn.style.display = "none";
      return;
    }

    summarizeBtn.style.display = "flex";
    highlightsList.innerHTML = "";

    highlights.forEach((h) => {
      const card = document.createElement("div");
      card.className = "card";

      const safeText = escapeHTML(h.text);
      const safeTitle = escapeHTML(h.title || "Unknown Page");

      let domain = "unknown";
      try {
        const urlObj = new URL(h.url);
        domain = urlObj.hostname.replace("www.", "");
      } catch (e) {
        domain = h.url;
      }

      card.innerHTML = `
        <div class="card-text" title="Click to completely expand/collapse">${safeText}</div>
        <div class="card-footer">
          <div class="card-meta">
            <div class="card-title" title="${safeTitle}">${safeTitle}</div>
            <a href="${h.url}" target="_blank" class="card-url">${domain}</a>
          </div>
          <div class="card-actions">
            <button class="btn-action summarize" data-id="${h.id}" title="Summarize Highlight">✨</button>
            <button class="btn-action danger btn-delete" data-id="${h.id}" title="Delete Highlight">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"></path></svg>
            </button>
          </div>
        </div>
      `;

      // Expand card
      const textEl = card.querySelector(".card-text") as HTMLDivElement;
      textEl.addEventListener("click", () => {
        card.classList.toggle("expanded");
      });

      const deleteBtn = card.querySelector(".btn-delete") as HTMLButtonElement;
      deleteBtn.addEventListener("click", () => {
        pendingDeleteId = h.id;
        deleteModal.classList.remove("hidden");
      });

      const indSumBtn = card.querySelector(".summarize") as HTMLButtonElement;
      indSumBtn.addEventListener("click", () => {
        executeSummarize([h]);
      });

      highlightsList.appendChild(card);
    });
  }

  function deleteHighlight(id: string) {
    chrome.storage.local.get({ highlights: [] }, (result) => {
      const updated = (result.highlights as Highlight[]).filter(
        (h) => h.id !== id,
      );
      chrome.storage.local.set({ highlights: updated }, () => {
        loadHighlights();
        pendingDeleteId = null;
      });
    });
  }

  async function generateSummary(
    apiKey: string,
    highlights: Highlight[],
  ): Promise<string> {
    const combinedText = highlights
      .map((h, i) => `[${i + 1}] From "${h.title}": "${h.text}"`)
      .join("\n\n");
    const systemPrompt =
      highlights.length === 1
        ? "You are a helpful assistant. Provide a concise, insightful summary of this specific highlight under 100 words. Do not use generic introductions. ensure simple languge over all overview with key insights given importance"
        : "You are a helpful assistant. Provide a concise, insightful overview and synthesis of the provided web highlights. Keep it strictly to the main themes and under 150 words. Do not use generic introductions.";

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: `Please summarize:\n\n${combinedText}`,
            },
          ],
          temperature: 1,
          top_p: 1,
          reasoning_effort: "medium",
          max_completion_tokens: 8192,
        }),
      },
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error?.message || "Failed to generate summary.");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  function formatSummary(text: string): string {
    return escapeHTML(text).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  }

  function escapeHTML(str: string): string {
    return str.replace(
      /[&<>'"]/g,
      (tag: string) =>
        (
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;",
          }) as Record<string, string>
        )[tag] || tag,
    );
  }
});
