function initDemoActions() {
  const closeDemoModal = () => {
    document.querySelector("[data-demo-modal]")?.remove();
    document.body.classList.remove("modal-open");
  };

  const showDemoModal = (title, message, meta) => {
    closeDemoModal();

    const modal = document.createElement("div");
    modal.className = "demo-modal";
    modal.setAttribute("data-demo-modal", "");
    modal.innerHTML = `
      <div class="demo-modal-backdrop" data-close-demo></div>
      <section class="demo-modal-panel" role="dialog" aria-modal="true" aria-labelledby="demoModalTitle">
        <button class="demo-modal-close" type="button" aria-label="Đóng" data-close-demo>
          <i class="ti-close"></i>
        </button>
        <span class="demo-status-pill">${meta || "Đang cập nhật"}</span>
        <h2 id="demoModalTitle">${title}</h2>
        <p>${message}</p>
        <div class="demo-progress">
          <span style="width: 62%"></span>
        </div>
        <button class="btn btn-primary" type="button" data-close-demo>Đã hiểu</button>
      </section>
    `;

    document.body.appendChild(modal);
    document.body.classList.add("modal-open");
  };

  document.addEventListener("click", (event) => {
    const closeButton = event.target.closest("[data-close-demo]");
    if (closeButton) {
      closeDemoModal();
      return;
    }

    const button = event.target.closest("[data-schedule-demo], [data-demo-action]");
    if (!button) return;

    event.preventDefault();
    const isSchedule = button.hasAttribute("data-schedule-demo");
    const title = button.dataset.demoTitle || (isSchedule ? "Lịch trình học đang cập nhật" : "Bài tập demo đang cập nhật");
    const message = button.dataset.demoMessage || (isSchedule
      ? "Giao diện lịch trình sẽ hiển thị kế hoạch học theo ngày, thời lượng và phần cần ôn. Hiện tại đây là bản demo tạm."
      : "Khi hoàn thiện, nút này sẽ mở bài luyện tập tương ứng với chủ điểm đã chọn. Hiện tại hệ thống chỉ hiển thị trạng thái demo.");
    const meta = button.dataset.demoMeta || (isSchedule ? "Schedule demo" : "Practice demo");

    showDemoModal(title, message, meta);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDemoModal();
  });
}

