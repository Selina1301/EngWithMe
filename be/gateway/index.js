/**
 * EngWithMe - Cloudflare Worker Edge Gateway
 * Handles CORS preflights, Edge Header injection, and Proxying to Cloud PHP Origin Server.
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";

    // Standard Edge CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Auth-Token",
      "Access-Control-Max-Age": "86400",
    };

    // Handle preflight OPTIONS requests immediately at Edge (0ms roundtrip to origin)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Configured Origin PHP Backend URL (e.g., https://api.engwithme.com or Railway/Render URL)
    const phpOriginUrl = env.PHP_ORIGIN_URL || "http://localhost/projects/EngWithMe/be/api/v1";
    const targetPath = url.pathname.replace(/^\/gateway/, "");
    const destinationUrl = `${phpOriginUrl}${targetPath}${url.search}`;

    try {
      // Forward request to Origin Server
      const modifiedRequest = new Request(destinationUrl, {
        method: request.method,
        headers: request.headers,
        body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
        redirect: "follow",
      });

      const response = await fetch(modifiedRequest);

      // Merge CORS headers into Origin Response
      const responseHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });
      responseHeaders.set("X-Edge-Gateway", "Cloudflare-Worker-v1");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          ok: false,
          message: "Cloudflare Edge Gateway: Không thể kết nối tới PHP Backend Origin.",
          error: error.message,
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  },
};
