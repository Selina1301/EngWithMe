function initRecorder() {
  const startButton = document.querySelector("[data-record-start]");
  const stopButton = document.querySelector("[data-record-stop]");
  const audio = document.querySelector("[data-record-audio]");
  const feedback = document.querySelector("[data-record-feedback]");
  if (!startButton || !stopButton || !audio) return;

  let mediaRecorder;
  let chunks = [];

  startButton.addEventListener("click", async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      if (feedback) feedback.textContent = "Trình duyệt chưa hỗ trợ ghi âm.";
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      chunks = [];
      mediaRecorder.addEventListener("dataavailable", (event) => chunks.push(event.data));
      mediaRecorder.addEventListener("stop", () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        audio.src = URL.createObjectURL(blob);
        stream.getTracks().forEach((track) => track.stop());
        if (feedback) feedback.textContent = "Đã ghi âm. Hãy nghe lại và so sánh với câu mẫu.";
      });
      mediaRecorder.start();
      startButton.disabled = true;
      stopButton.disabled = false;
      if (feedback) feedback.textContent = "Đang ghi âm...";
    } catch (error) {
      if (feedback) feedback.textContent = "Không thể mở micro. Hãy chạy bằng localhost và cấp quyền micro.";
    }
  });

  stopButton.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      startButton.disabled = false;
      stopButton.disabled = true;
    }
  });
}
