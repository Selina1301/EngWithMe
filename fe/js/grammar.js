async function initGrammarLearning() {
  try {
    const rail = document.querySelector("[data-grammar-topic-rail]");
    const detail = document.querySelector("[data-grammar-detail]");
    if (!rail || !detail || typeof grammarTopics === "undefined") return;
    if (typeof window.loadGrammarTopicsFromApi === "function") {
      await window.loadGrammarTopicsFromApi();
    }
    if (!Array.isArray(grammarTopics) || !grammarTopics.length) return;

    const grammarModeTabs = document.querySelectorAll("[data-grammar-mode]");
    const grammarStudyView = document.querySelector("[data-grammar-study-view]");
    const grammarProgressView = document.querySelector("[data-grammar-progress-view]");
    const grammarProgressScore = document.querySelector("[data-grammar-progress-score]");
    const grammarProgressSummary = document.querySelector("[data-grammar-progress-summary]");
    const grammarProgressBar = document.querySelector("[data-grammar-progress-bar]");
    const grammarTopicComplete = document.querySelector("[data-grammar-topic-complete]");
    const grammarQuestionComplete = document.querySelector("[data-grammar-question-complete]");
    const grammarQuestionRemaining = document.querySelector("[data-grammar-question-remaining]");
    const stateKey = getAccountKey("engWithMeGrammarPractice");
    const modeKey = getAccountKey("engWithMeGrammarMode");
    const rewardedQuestionsKey = getAccountKey("engWithMeRewardedGrammarQuestions");
    let practiceState = getGrammarPracticeState(stateKey);
    let activeGrammarMode = localStorage.getItem(modeKey) === "progress" ? "progress" : "study";
    if (window.location.hash) activeGrammarMode = "study";

    let rewardedQuestions = new Set(JSON.parse(localStorage.getItem(rewardedQuestionsKey) || "[]"));
    Object.entries(practiceState).forEach(([tId, qIndices]) => {
      if (Array.isArray(qIndices)) {
        qIndices.forEach(idx => rewardedQuestions.add(`${tId}_${idx}`));
      }
    });

    const getTopic = (topicId) => grammarTopics.find((topic) => topic.id === topicId) || grammarTopics[0];
    const getSolvedQuestions = (topicId) => new Set(practiceState[topicId] || []);
    const savePracticeState = () => {
      localStorage.setItem(stateKey, JSON.stringify(practiceState));
      localStorage.setItem(rewardedQuestionsKey, JSON.stringify([...rewardedQuestions]));

      const userId = localStorage.getItem("engWithMeUserId");
      if (userId) {
        try {
          const body = new FormData();
          body.append("state_json", JSON.stringify(practiceState));
          fetch("api/sync_grammar.php", {
            method: "POST",
            body,
            credentials: "same-origin"
          });
        } catch (e) {}
      }
    };

    // Restore grammar practice state from DB on init
    const userIdForGrammarInit = localStorage.getItem("engWithMeUserId");
    if (userIdForGrammarInit) {
      fetch("api/sync_grammar.php", { credentials: "same-origin" })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && data.ok && data.state && typeof data.state === "object") {
            Object.entries(data.state).forEach(([tId, qIndices]) => {
              if (Array.isArray(qIndices)) {
                const currentSet = new Set(practiceState[tId] || []);
                qIndices.forEach(idx => {
                  currentSet.add(idx);
                  rewardedQuestions.add(`${tId}_${idx}`);
                });
                practiceState[tId] = Array.from(currentSet).sort((a, b) => a - b);
              }
            });
            localStorage.setItem(stateKey, JSON.stringify(practiceState));
            localStorage.setItem(rewardedQuestionsKey, JSON.stringify([...rewardedQuestions]));
            updateGrammarProgress();
          }
        })
        .catch(() => {});
    }

    const tenseProTips = [
      "Với chủ ngữ số ít (He/She/It/Danh từ số ít), thêm -s hoặc -es vào động từ. Khi đã dùng trợ động từ do/does trong câu phủ định và nghi vấn, động từ chính giữ nguyên mẫu.",
      "Không dùng thì tiếp diễn với các động từ chỉ trạng thái, nhận thức, cảm xúc như: know, understand, believe, love, hate, want, need, prefer.",
      "Phân biệt For + khoảng thời gian (for 5 years) và Since + mốc thời gian (since 2018). 'Have/Has been to' nghĩa là đã đi và đã trở về, 'Have/Has gone to' nghĩa là đã đi và chưa về.",
      "Nhấn mạnh tính LIÊN TỤC và KÉO DÀI của hành động hơn là kết quả hoàn thành. Thường trả lời cho câu hỏi 'How long...'.",
      "Nhớ bảng động từ bất quy tắc (V2). Khi dùng trợ động từ DID trong câu phủ định và nghi vấn, động từ chính quay về dạng nguyên mẫu không chia.",
      "Hành động dài đang xảy ra dùng Quá khứ tiếp diễn (Was/Were + V-ing), hành động ngắn xen vào dùng Quá khứ đơn (V2/ed). Cấu trúc: While + QKTD, When + QKĐ.",
      "Hành động xảy ra TRƯỚC một hành động khác trong quá khứ dùng Quá khứ hoàn thành (Had + V3). Cấu trúc: Before + QKĐ, QKHT | After + QKHT, QKĐ.",
      "Nhấn mạnh khoảng thời gian kéo dài liên tục của hành động diễn ra trước một mốc thời gian hoặc trước một hành động khác trong quá khứ.",
      "Will + V nguyên mẫu dùng cho quyết định BỘT PHÁT ngay lúc nói, lời hứa hoặc dự đoán không có căn cứ rõ ràng.",
      "Diễn tả hành động đang diễn ra tại một thời điểm xác định cụ thể trong tương lai (Ví dụ: At 9 PM tomorrow, I will be studying).",
      "Diễn tả hành động sẽ hoàn thành TRƯỚC một thời điểm hoặc một hành động khác trong tương lai. Từ nhận biết: By + mốc thời gian tương lai (By next week, By 2030).",
      "Dùng Be going to + V cho kế hoạch đã được dự định chuẩn bị từ trước hoặc dự đoán có căn cứ/dấu hiệu thực tế rõ ràng ở hiện tại."
    ];

    function getGrammarProgressSnapshot() {
      const totalTopics = grammarTopics.length;
      const totalQuestions = grammarTopics.reduce((sum, topic) => sum + topic.exercises.length, 0);
      const solvedQuestions = grammarTopics.reduce((sum, topic) => sum + getSolvedQuestions(topic.id).size, 0);
      const completedTopics = grammarTopics.filter((topic) => getSolvedQuestions(topic.id).size === topic.exercises.length).length;
      const progress = totalQuestions ? Math.round((solvedQuestions / totalQuestions) * 100) : 0;

      return {
        totalTopics,
        totalQuestions,
        solvedQuestions,
        completedTopics,
        progress,
        remainingQuestions: Math.max(0, totalQuestions - solvedQuestions)
      };
    }

    function updateGrammarProgress() {
      if (!grammarProgressScore) return;
      const snapshot = getGrammarProgressSnapshot();
      grammarProgressScore.textContent = `${snapshot.progress}%`;
      if (grammarProgressBar) grammarProgressBar.style.width = `${snapshot.progress}%`;
      if (grammarTopicComplete) grammarTopicComplete.textContent = `${snapshot.completedTopics}/${snapshot.totalTopics}`;
      if (grammarQuestionComplete) grammarQuestionComplete.textContent = `${snapshot.solvedQuestions}/${snapshot.totalQuestions}`;
      if (grammarQuestionRemaining) grammarQuestionRemaining.textContent = snapshot.remainingQuestions;
      if (grammarProgressSummary) {
        grammarProgressSummary.textContent = snapshot.totalQuestions
          ? `Bạn đã làm đúng ${snapshot.solvedQuestions}/${snapshot.totalQuestions} câu. Điểm này tính từ bài tập thật đã hoàn thành.`
          : "Chưa có dữ liệu bài tập.";
      }
    }

    function syncGrammarModeTabs() {
      grammarModeTabs.forEach((tab) => {
        tab.classList.toggle("is-active", tab.dataset.grammarMode === activeGrammarMode);
      });
    }

    function setGrammarMode(mode) {
      activeGrammarMode = mode === "progress" ? "progress" : "study";
      localStorage.setItem(modeKey, activeGrammarMode);
      syncGrammarModeTabs();
      if (grammarStudyView) grammarStudyView.hidden = activeGrammarMode !== "study";
      if (grammarProgressView) grammarProgressView.hidden = activeGrammarMode !== "progress";
      if (activeGrammarMode === "progress") updateGrammarProgress();
    }

    const renderRail = (activeId) => {
      const previousScroll = rail.scrollLeft;
      const orderedTopics = [...grammarTopics].sort((a, b) => {
        const aDone = getSolvedQuestions(a.id).size === a.exercises.length;
        const bDone = getSolvedQuestions(b.id).size === b.exercises.length;
        if (aDone !== bDone) return aDone ? 1 : -1;
        return Number(a.order) - Number(b.order);
      });

      rail.innerHTML = orderedTopics.map((topic) => {
        const solvedCount = getSolvedQuestions(topic.id).size;
        const total = topic.exercises.length;
        const isActive = topic.id === activeId;
        const isDone = solvedCount === total;

        return `
          <button class="grammar-topic-card${isActive ? " is-active" : ""}${isDone ? " is-completed" : ""}" type="button" data-grammar-topic="${topic.id}" role="listitem" aria-pressed="${isActive}">
            <span class="grammar-card-index">${topic.order} · ${topic.level}</span>
            <h3>${topic.title}</h3>
            <p>${topic.summary}</p>
            <span class="grammar-card-stats">
              <span>${solvedCount}/${total} câu đúng</span>
              <i class="${isDone ? "ti-check" : "ti-angle-right"}" aria-hidden="true"></i>
            </span>
          </button>
        `;
      }).join("");
      rail.scrollLeft = previousScroll;
    };

    const renderGrammarSections = (topic, activeTenseIdx = 0) => {
      if (!topic.sections?.length) return "";

      const allSubItems = [];
      topic.sections.forEach((section) => {
        section.items.forEach((item) => {
          allSubItems.push({
            ...item,
            groupTitle: section.title
          });
        });
      });

      const activeTense = allSubItems[activeTenseIdx] || allSubItems[0];
      const proTip = tenseProTips[activeTenseIdx] || "Chú ý công thức và chia đúng dạng động từ theo từng ngôi chủ ngữ.";

      return `
        <section class="grammar-theory-section grammar-tense-section" data-grammar-extra-memory-section>
          <div class="grammar-subtopic-header">
            <h3><i class="ti-bookmark-alt"></i> Tra cứu & Học chi tiết 12 thì</h3>
            <p>Chọn từng thì bên dưới để xem full dữ liệu công thức, cách dùng, ví dụ và mẹo né bẫy:</p>
          </div>

          <div class="grammar-subtopic-scroll-container">
            ${allSubItems.map((item, idx) => `
              <button class="grammar-subtopic-chip${idx === activeTenseIdx ? " is-active" : ""}" type="button" data-tense-select="${idx}">
                <span>${idx + 1}. ${item.viName}</span>
                <small>${item.name}</small>
              </button>
            `).join("")}
          </div>

          <div class="grammar-single-tense-card" data-active-tense-card="${activeTenseIdx}">
            <header class="single-tense-head">
              <div class="tense-number">${activeTenseIdx + 1}</div>
              <div class="tense-titles">
                <h4>${activeTense.name}</h4>
                <p>${activeTense.viName}</p>
              </div>
              <span class="tense-badge-category">${activeTense.groupTitle}</span>
            </header>

            <div class="single-tense-section">
              <h5 class="single-tense-label"><i class="ti-layout-grid2"></i> Khung Công Thức</h5>
              <div class="single-tense-formula-grid">
                ${Object.entries(activeTense.formulas).map(([type, formula]) => `
                  <div class="formula-card-item">
                    <span class="formula-type">${type}</span>
                    <code>${formula}</code>
                  </div>
                `).join("")}
              </div>
            </div>

            <div class="single-tense-section">
              <h5 class="single-tense-label"><i class="ti-check-box"></i> Các Cách Dùng Thực Tế & Ví Dụ</h5>
              <ul class="single-tense-uses-list">
                ${activeTense.uses.map((use, uIdx) => `
                  <li>
                    <strong>${uIdx + 1}. ${use}</strong>
                    ${activeTense.examples && activeTense.examples[uIdx] ? `<p class="tense-example-row"><i class="ti-angle-right"></i> <span>${activeTense.examples[uIdx]}</span></p>` : ''}
                  </li>
                `).join("")}
              </ul>
            </div>

            <div class="single-tense-section">
              <h5 class="single-tense-label"><i class="ti-flag"></i> Dấu Hiệu Nhận Biết & Từ Chìa Khóa</h5>
              <div class="single-tense-signals">
                ${activeTense.signals.map((sig) => `<span><i class="ti-tag"></i> ${sig}</span>`).join("")}
              </div>
            </div>

            <div class="single-tense-section single-tense-pro-tips">
              <h5 class="single-tense-label"><i class="ti-light-bulb"></i> Mẹo Nhớ Nhanh & Tránh Bẫy Đề Thi</h5>
              <div class="pro-tip-box">
                <p>💡 <strong>Ghi nhớ:</strong> ${proTip}</p>
              </div>
            </div>
          </div>
        </section>
      `;
    };

    const renderPracticePanelHTML = (topic) => {
      const solvedQuestions = getSolvedQuestions(topic.id);

      const sortedExercises = topic.exercises.map((exercise, index) => ({
        exercise,
        index,
        isSolved: solvedQuestions.has(index)
      }));

      // Unsolved questions at top, solved questions at bottom
      sortedExercises.sort((a, b) => {
        if (a.isSolved !== b.isSolved) return a.isSolved ? 1 : -1;
        return a.index - b.index;
      });

      return `
        <aside class="grammar-practice-panel">
          <div class="practice-panel-head">
            <h3>Bài tập thực hành</h3>
            <div class="practice-notice-pill">
              <div class="notice-line-primary"><i class="ti-check-box"></i> Chọn đúng đáp án</div>
              <div class="notice-line-secondary"><i class="ti-timer"></i> Sau 5s sẽ bị đẩy xuống dưới</div>
            </div>
          </div>

          <div class="grammar-exercise-list">
            ${sortedExercises.map(({ exercise, index: questionIndex, isSolved }) => `
              <article class="grammar-exercise${isSolved ? " is-correct" : ""}" data-grammar-question="${questionIndex}">
                <div class="grammar-check-row">
                  <strong>${questionIndex + 1}. ${exercise.prompt}</strong>
                  <span>${isSolved ? "Đã đúng" : "Chưa làm"}</span>
                </div>
                <div class="grammar-options">
                  ${exercise.options.map((option, optionIndex) => `
                    <button class="grammar-option${isSolved && optionIndex === exercise.answer ? " is-correct" : ""}" type="button" data-grammar-option data-topic-id="${topic.id}" data-question-index="${questionIndex}" data-option-index="${optionIndex}" ${isSolved ? "disabled" : ""}>${option}</button>
                  `).join("")}
                </div>
                <p class="grammar-feedback" data-grammar-feedback="${topic.id}-${questionIndex}">${isSolved ? exercise.explanation : ""}</p>
              </article>
            `).join("")}
          </div>
        </aside>
      `;
    };

    const renderTopic = (topicId, shouldScroll = false, shouldUpdateHash = true) => {
      const topic = getTopic(topicId);
      const solvedQuestions = getSolvedQuestions(topic.id);

      renderRail(topic.id);
      detail.innerHTML = `
        <article class="grammar-detail-content" data-active-grammar-topic="${topic.id}">
          <header class="grammar-detail-head">
            <div>
              <p class="eyebrow">Chủ đề ${topic.order}</p>
              <h2>${topic.title}</h2>
              <p>${topic.summary}</p>
              <div class="grammar-detail-meta">
                <span>${topic.level}</span>
                <span>${topic.time}</span>
                <span>${solvedQuestions.size}/${topic.exercises.length} bài tập đúng</span>
              </div>
            </div>
          </header>

          <div class="grammar-detail-grid">
            <div class="grammar-theory-panel" data-grammar-theory-panel>
              <section class="grammar-theory-section" data-theory-memory-section>
                <div class="grammar-theory-title-row">
                  <h3>Lý thuyết trọng tâm</h3>
                  <button class="grammar-theory-toggle" type="button" data-toggle-grammar-theory aria-pressed="false">
                    Che lý thuyết
                  </button>
                </div>
                <ul data-theory-memory-content>${topic.theory.map((item) => `<li>${item}</li>`).join("")}</ul>
              </section>

              <section class="grammar-theory-section" data-formula-memory-section>
                <h3>Công thức cần nhớ</h3>
                <div class="grammar-formula-list">${topic.formulas.map((formula) => `<code>${formula}</code>`).join("")}</div>
              </section>

              ${renderGrammarSections(topic, 0)}

              <section class="grammar-theory-section">
                <h3>Ví dụ mẫu tổng hợp</h3>
                <div class="grammar-example-list">
                  ${topic.examples.map((example) => `
                    <div class="grammar-example">
                      <strong>${example.en}</strong>
                      <span>${example.vi}</span>
                    </div>
                  `).join("")}
                </div>
              </section>

              <section class="grammar-theory-section">
                <h3>Lỗi cần tránh</h3>
                <ul class="grammar-mistake-list">${topic.mistakes.map((mistake) => `<li>${mistake}</li>`).join("")}</ul>
              </section>

              <div class="grammar-back-footer">
                <button class="schedule-button grammar-back-bottom-btn" type="button" data-grammar-back>
                  <i class="ti-layout-column3"></i>
                  Xem danh mục chủ đề
                </button>
              </div>
            </div>

            ${renderPracticePanelHTML(topic)}
          </div>
        </article>
      `;

      if (shouldUpdateHash) window.history.replaceState(null, "", `#${topic.id}`);
      const exerciseList = detail.querySelector(".grammar-exercise-list");
      if (exerciseList) exerciseList.scrollTop = 0;
      if (shouldScroll) {
        detail.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    rail.addEventListener("click", (event) => {
      const topicButton = event.target.closest("[data-grammar-topic]");
      if (topicButton) {
        renderTopic(topicButton.dataset.grammarTopic, true);
      }
    });

    detail.addEventListener("click", (event) => {
      const tenseChip = event.target.closest("[data-tense-select]");
      if (tenseChip) {
        const idx = parseInt(tenseChip.dataset.tenseSelect, 10);
        const activeTopicId = detail.querySelector("[data-active-grammar-topic]")?.dataset.activeGrammarTopic || "thi";
        const activeTopic = getTopic(activeTopicId);
        const tenseExtraSection = detail.querySelector("[data-grammar-extra-memory-section]");
        if (tenseExtraSection && activeTopic) {
          tenseExtraSection.outerHTML = renderGrammarSections(activeTopic, idx);
        }
        return;
      }

      const backButton = event.target.closest("[data-grammar-back]");
      if (backButton) {
        rail.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const theoryToggle = event.target.closest("[data-toggle-grammar-theory]");
      if (theoryToggle) {
        const panel = theoryToggle.closest("[data-grammar-theory-panel]");
        const isHidden = panel?.classList.toggle("is-theory-hidden");
        theoryToggle.setAttribute("aria-pressed", String(Boolean(isHidden)));
        theoryToggle.textContent = isHidden ? "Hiện lý thuyết" : "Che lý thuyết";
        return;
      }

      const optionButton = event.target.closest("[data-grammar-option]");
      if (!optionButton) return;

      const topic = getTopic(optionButton.dataset.topicId);
      const questionIndex = Number(optionButton.dataset.questionIndex);
      const optionIndex = Number(optionButton.dataset.optionIndex);
      const exercise = topic.exercises[questionIndex];
      const question = optionButton.closest("[data-grammar-question]");
      const feedback = question?.querySelector("[data-grammar-feedback]");
      const status = question?.querySelector(".grammar-check-row span");
      if (!exercise || !question || !feedback) return;

      question.querySelectorAll("[data-grammar-option]").forEach((button) => button.classList.remove("is-wrong"));

      if (optionIndex === exercise.answer) {
        const solved = getSolvedQuestions(topic.id);
        solved.add(questionIndex);
        practiceState[topic.id] = Array.from(solved).sort((a, b) => a - b);

        const qKey = `${topic.id}_${questionIndex}`;
        if (!rewardedQuestions.has(qKey)) {
          rewardedQuestions.add(qKey);
          if (typeof addXP === "function") {
            addXP(3, "Làm đúng câu hỏi Ngữ pháp");
          }
        }

        savePracticeState();

        question.classList.add("is-correct");
        question.querySelectorAll("[data-grammar-option]").forEach((button) => {
          button.disabled = true;
          if (Number(button.dataset.optionIndex) === exercise.answer) button.classList.add("is-correct");
        });
        if (status) status.textContent = "Đã đúng";
        feedback.textContent = exercise.explanation;

        const progressMeta = detail.querySelector(".grammar-detail-meta span:last-child");
        if (progressMeta) progressMeta.textContent = `${practiceState[topic.id].length}/${topic.exercises.length} bài tập đúng`;
        renderRail(topic.id);
        updateGrammarProgress();

        // 5-second timer to automatically move the solved question to the bottom
        setTimeout(() => {
          if (!question || !question.parentNode) return;
          question.classList.add("is-moving-to-bottom");
          setTimeout(() => {
            const exerciseList = question.closest(".grammar-exercise-list");
            if (exerciseList && question.parentNode === exerciseList) {
              exerciseList.appendChild(question);
            }
            question.classList.remove("is-moving-to-bottom");
          }, 400);
        }, 5000);

        return;
      }

      optionButton.classList.add("is-wrong");
      optionButton.disabled = true;
      if (status) status.textContent = "Thử lại";
      feedback.textContent = `Chưa đúng. Gợi ý: ${exercise.hint}`;
    });

    document.querySelectorAll("[data-scroll-grammar]").forEach((button) => {
      button.addEventListener("click", () => {
        const direction = button.dataset.scrollGrammar === "left" ? -1 : 1;
        rail.scrollBy({ left: direction * 420, behavior: "smooth" });
      });
    });

    window.addEventListener("hashchange", () => {
      const topicId = window.location.hash.replace("#", "");
      if (topicId) renderTopic(topicId, false, false);
    });

    grammarModeTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        setGrammarMode(tab.dataset.grammarMode);
      });
    });

    renderTopic(window.location.hash.replace("#", "") || grammarTopics[0].id, false, false);
    updateGrammarProgress();
    setGrammarMode(activeGrammarMode);
  } catch (error) {
    console.warn("Grammar learning failed to initialize:", error);
  }
}

function getGrammarPracticeState(stateKey) {
  try {
    const parsed = JSON.parse(localStorage.getItem(stateKey) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}
