const courseProgressIds = ["course-a1", "course-a2", "course-b1", "lesson-greetings"];

function getCourseProgressPercent(completed) {
  const completedCount = completed.filter(id => courseProgressIds.includes(id)).length;
  return courseProgressIds.length ? Math.round((completedCount / courseProgressIds.length) * 100) : 0;
}

function updateDashboardProgressDisplay(progress) {
  document.querySelectorAll("[data-dashboard-progress]").forEach((element) => {
    element.textContent = `${progress}%`;
    const progressBar = element.closest(".stat-card")?.querySelector(".progress-track span");
    if (progressBar) progressBar.style.width = `${progress}%`;
  });
}

function initProgressButtons() {
  const completed = JSON.parse(localStorage.getItem(getAccountKey("engWithMeProgress")) || "[]");

  document.querySelectorAll("[data-progress-id]").forEach((button) => {
    const id = button.dataset.progressId;
    if (completed.includes(id)) {
      button.textContent = "Đã hoàn thành";
      button.classList.remove("btn-secondary");
      button.classList.add("btn-primary");
    }

    button.addEventListener("click", async () => {
      const current = JSON.parse(localStorage.getItem(getAccountKey("engWithMeProgress")) || "[]");
      const next = current.includes(id) ? current : [...current, id];
      localStorage.setItem(getAccountKey("engWithMeProgress"), JSON.stringify(next));
      button.textContent = "Đã hoàn thành";
      button.classList.remove("btn-secondary");
      button.classList.add("btn-primary");
      updateDashboardProgressDisplay(getCourseProgressPercent(next));

      // Sync to database if logged in
      const userId = localStorage.getItem("engWithMeUserId");
      if (userId) {
        try {
          const body = new FormData();
          body.append("progress_id", id);
          await fetch("api/sync_progress.php", {
            method: "POST",
            body,
            credentials: "same-origin"
          });
        } catch (e) {
          console.error("Failed to sync progress to database:", e);
        }
      }
    });
  });
}
