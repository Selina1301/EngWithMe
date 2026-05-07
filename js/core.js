function setCurrentYear() {
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
}
function setActiveNav() {
  const mainNavItems = [
    { href: "index.html", label: "Trang chủ" },
    { href: "vocabulary.html", label: "Từ vựng" },
    { href: "reading.html", label: "Đọc" },
    { href: "grammar.html", label: "Ngữ pháp" },
    { href: "quiz.html", label: "Đề thi" },
    { href: "blog.html", label: "Blog" },
    { href: "pricing.html", label: "Bảng giá" }
  ];

  document.querySelectorAll(".nav-links").forEach((nav) => {
    nav.setAttribute("aria-label", "Menu chính");
    nav.innerHTML = mainNavItems
      .map((item) => `<a href="${item.href}">${item.label}</a>`)
      .join("");
  });

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const activePage = currentPage === "vocabulary-study.html" ? "vocabulary.html" : currentPage;
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === activePage || href === `${activePage}#`) {
      link.classList.add("is-active");
    }
  });
}
function getSavedWords() {
  return JSON.parse(localStorage.getItem("englishPathSavedWords") || "[]");
}
function setSavedWords(words) {
  localStorage.setItem("englishPathSavedWords", JSON.stringify(words));
}
function updateSavedCount() {
  const count = getSavedWords().length;
  document.querySelectorAll("[data-saved-count]").forEach((element) => {
    element.textContent = `${count} từ đã lưu`;
  });
}

