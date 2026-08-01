/**
 * EngWithMe - Enterprise Frontend Environment & API Configuration
 */
(function (window) {
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  
  // Production Cloudflare Edge Worker API URL
  const cloudflareEdgeApi = "https://engwithme-hono-edge.tungduong-dev.workers.dev/v1/";

  // Auto-detect API Base URL
  const defaultApiBase = window.EWM_CUSTOM_API_BASE || (
    isLocal 
      ? "/projects/EngWithMe/be/api/v1/"
      : cloudflareEdgeApi
  );

  window.EWM_CONFIG = {
    API_BASE_URL: defaultApiBase,
    CLOUDFLARE_EDGE_API: cloudflareEdgeApi,
    APP_NAME: "EngWithMe",
    VERSION: "2.0.0-enterprise",
    isLocal: isLocal
  };

  window.resolveApiUrl = function(path) {
    const base = (window.EWM_CONFIG && window.EWM_CONFIG.API_BASE_URL)
      ? window.EWM_CONFIG.API_BASE_URL
      : "https://engwithme-hono-edge.tungduong-dev.workers.dev/v1/";

    let cleanPath = String(path || "").trim();
    cleanPath = cleanPath.replace(/^api\//, "").replace(/^\/v1\//, "").replace(/^\//, "");

    return base.endsWith("/") ? `${base}${cleanPath}` : `${base}/${cleanPath}`;
  };

  window.fetchAuth = async function(path, options = {}) {
    const url = window.resolveApiUrl(path);
    const token = localStorage.getItem("engWithMeAuthToken") || localStorage.getItem("ewm_token") || "";

    const headers = {
      ...options.headers
    };
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(url, {
      ...options,
      headers
    });
  };
})(window);
