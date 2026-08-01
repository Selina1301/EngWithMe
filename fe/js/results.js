function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function initResults() {
  const lastScore = localStorage.getItem(getAccountKey("engWithMeLastScore"));
  const savedWords = typeof getSavedWords === "function" ? getSavedWords().length : 0;

  document.querySelectorAll("[data-last-score], [data-last-score-table]").forEach((element) => {
    element.textContent = lastScore || "Chưa có";
  });

  document.querySelectorAll("[data-saved-words-result]").forEach((element) => {
    element.textContent = savedWords;
  });

  const tbody = document.querySelector("[data-results-tbody]");
  const userId = localStorage.getItem("engWithMeUserId");
  if (tbody && userId) {
    try {
      const response = await fetch("api/test_results.php", { credentials: "same-origin" });
      if (response.ok) {
        const result = await response.json();
        if (result.ok && Array.isArray(result.results) && result.results.length > 0) {
          tbody.innerHTML = result.results.map((row) => {
            let testName = "TOEIC Reading Test";
            if (row.test_set === "placement") {
              testName = "Placement Test (Đánh giá năng lực)";
            } else if (row.test_set.startsWith("y")) {
              testName = `TOEIC Practice Set ${row.test_set.substring(1)} (Part ${row.test_parts})`;
            }

            return `
              <tr>
                <td><strong>${escapeHtml(testName)}</strong></td>
                <td>${escapeHtml(row.score)}</td>
                <td><span class="modal-level-pill ${escapeHtml(row.recommended_level)}" style="padding: 2px 8px; border-radius: 4px; font-weight: bold;">${escapeHtml(row.recommended_level)}</span></td>
                <td>${formatDateTime(row.submitted_at)}</td>
              </tr>
            `;
          }).join("");
        }
      }
    } catch (e) {
      console.error("Failed to load test history from server:", e);
    }
  }
}
