// TOEIC exam selection/configuration page behavior.
function initExamOverview() {
  document.querySelectorAll("[data-exam-link]").forEach((link) => {
    const [set, part] = link.dataset.examLink.split("-");
    if (localStorage.getItem(getExamCompletionKey(set, part)) === "done") {
      link.classList.add("is-completed");
      link.setAttribute("aria-label", `${link.textContent.trim()} đã làm`);
    }
  });

  const partNote = document.querySelector("[data-exam-part-note]");
  document.querySelectorAll("[data-select-part]").forEach((item) => {
    item.addEventListener("mouseenter", () => {
      if (partNote) partNote.textContent = `${item.textContent.trim()} đang được mở cho đề 2025.`;
    });
  });
}

function initToeicExamOverview() {
  const modal = document.querySelector("[data-exam-config-modal]");
  const form = document.querySelector("[data-exam-config-form]");
  const title = document.querySelector("[data-exam-config-title]");
  const error = document.querySelector("[data-exam-config-error]");
  const customMinutes = document.querySelector("[data-custom-minutes]");
  const partOptions = document.querySelector("[data-exam-part-options]");
  const partNote = document.querySelector("[data-exam-part-note]");
  let selectedSet = "y2025";

  function renderPartOptions(setId) {
    if (!partOptions) return;
    const parts = getExamPartsForSet(setId);
    partOptions.innerHTML = parts.map((partNumber, index) => {
      const partConfig = TOEIC_PART_CONFIG[partNumber] || { label: `Part ${partNumber}`, shortLabel: `Part ${partNumber}` };
      return `
        <label><input type="checkbox" name="part" value="${partNumber}" ${index === 0 ? "checked" : ""}> <span>${partConfig.label}</span></label>
      `;
    }).join("");
  }

  const FREE_EXAM_SETS = ["y2017", "y2018", "y2019", "y2020"];

  renderPartOptions(selectedSet);

  document.querySelectorAll("[data-exam-set]").forEach((card) => {
    const setId = card.dataset.examSet;
    const isFree = FREE_EXAM_SETS.includes(setId);
    const userIsVip = typeof isUserVip === "function" ? isUserVip() : false;
    const isLocked = !isFree && !userIsVip;

    if (isLocked) {
      card.classList.add("is-pro-locked");
      const levelChip = card.querySelector(".level-chip");
      if (levelChip && !levelChip.nextElementSibling?.classList?.contains("pro-badge-chip")) {
        levelChip.insertAdjacentHTML("afterend", ` <span class="pro-badge-chip">🔒 PRO / PREMIUM</span>`);
      }
    }

    const availableParts = getExamPartsForSet(setId);
    const completedParts = availableParts.filter((part) => localStorage.getItem(getExamCompletionKey(setId, part)) === "done");
    const completedText = completedParts.length ? `Đã làm ${completedParts.length}/${availableParts.length} Part` : "Chưa làm Part nào";
    const partStatus = availableParts.map((part) => `
      <span class="${completedParts.includes(part) ? "is-done" : ""}">Part ${part}</span>
    `).join("");

    card.insertAdjacentHTML("beforeend", `
      <div class="exam-card-status" aria-label="Trạng thái làm bài">
        <strong>${completedText} ${isLocked ? `<span style="color:#f59e0b;font-size:0.82rem;margin-left:8px;">🔒 Khóa VIP</span>` : ""}</strong>
        <span class="exam-card-status-parts">${partStatus}</span>
      </div>
    `);

    card.addEventListener("click", () => {
      const currentVipStatus = typeof isUserVip === "function" ? isUserVip() : false;
      if (!isFree && !currentVipStatus) {
        const yearName = card.dataset.examYear || (typeof window.TOEIC_SET_YEAR_MAP !== "undefined" ? window.TOEIC_SET_YEAR_MAP[setId] : setId.replace("y", ""));
        if (typeof showVipLockModal === "function") {
          showVipLockModal(`Đề thi TOEIC ${yearName}`);
        } else {
          alert(`Đề thi TOEIC ${yearName} yêu cầu gói PRO hoặc PREMIUM để mở khóa!`);
          window.location.href = "pricing.html";
        }
        return;
      }

      selectedSet = setId;
      document.querySelectorAll("[data-exam-set]").forEach((item) => item.classList.toggle("is-selected", item === card));
      renderPartOptions(selectedSet);
      if (title) title.textContent = getExamTitle(setId, card.dataset.examYear);
      if (partNote) partNote.textContent = `Đang chọn đề ${card.dataset.examYear || setId.replace("y", "")}.`;
      if (error) error.hidden = true;
      if (typeof modal?.showModal === "function") modal.showModal();
      else modal?.setAttribute("open", "");
    });
  });

  document.querySelectorAll("[data-exam-modal-close]").forEach((button) => {
    button.addEventListener("click", () => modal?.close());
  });

  modal?.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });

  customMinutes?.addEventListener("input", () => {
    form?.querySelector('input[name="minutes"][value="custom"]')?.click();
  });

  form?.querySelectorAll('input[name="minutes"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.value !== "custom") {
        if (customMinutes) customMinutes.value = "";
      } else {
        customMinutes?.focus();
      }
    });
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const parts = [...form.querySelectorAll('input[name="part"]:checked')].map((input) => input.value);
    const selectedTime = form.querySelector('input[name="minutes"]:checked')?.value || "30";
    const minutes = selectedTime === "custom" ? Number(customMinutes?.value) : Number(selectedTime);

    if (!parts.length || !Number.isFinite(minutes) || minutes < 1) {
      if (error) error.hidden = false;
      return;
    }

    const url = new URL("exam-practice.html", window.location.href);
    url.searchParams.set("set", selectedSet);
    url.searchParams.set("parts", parts.join(","));
    url.searchParams.set("minutes", String(Math.min(minutes, 180)));
    window.location.href = url.toString();
  });
}
