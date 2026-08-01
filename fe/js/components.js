/**
 * EngWithMe - Dynamic Component Loader for Navbar & Footer
 */
(function (window, document) {
  async function loadComponent(selector, file) {
    const target = document.querySelector(selector);
    if (!target) return;
    try {
      const response = await fetch(file);
      if (response.ok) {
        const html = await response.text();
        target.innerHTML = html;
      }
    } catch (e) {
      console.warn(`[ComponentLoader] Could not load ${file}:`, e);
    }
  }

  window.initSharedComponents = function () {
    loadComponent("[data-component-navbar]", "components/navbar.html");
    loadComponent("[data-component-footer]", "components/footer.html");
  };

  document.addEventListener("DOMContentLoaded", () => {
    window.initSharedComponents();
  });
})(window, document);
