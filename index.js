const ORIGIN = "https://parsteam.chbkn.dev";

export default {
  async fetch(request) {
    const incoming = new URL(request.url);

    const target = new URL(
      incoming.pathname + incoming.search,
      ORIGIN
    );

    const headers = new Headers(request.headers);

    headers.delete("host");
    headers.set("origin", ORIGIN);

    const referer = headers.get("referer");
    if (referer) {
      headers.set(
        "referer",
        referer.replace(incoming.origin, ORIGIN)
      );
    }

    const response = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method)
        ? undefined
        : request.body,
      redirect: "manual"
    });

    const resultHeaders = new Headers(response.headers);

    // اصلاح آدرس ریدایرکت‌ها
    const location = resultHeaders.get("Location");

    if (location) {
      resultHeaders.set(
        "Location",
        location.replace(ORIGIN, incoming.origin)
      );
    }

    // حذف دامنه اصلی از کوکی‌ها
    const cookies = resultHeaders.getSetCookie?.() || [];

    if (cookies.length) {
      resultHeaders.delete("set-cookie");

      for (const cookie of cookies) {
        resultHeaders.append(
          "set-cookie",
          cookie.replace(/;\s*Domain=[^;]*/i, "")
        );
      }
    }

    const contentType =
      resultHeaders.get("content-type") || "";

    if (contentType.includes("text/html")) {
      let html = await response.text();

      html = html.replaceAll(ORIGIN, incoming.origin);

      resultHeaders.delete("content-length");
      resultHeaders.delete("content-encoding");

      return new Response(html, {
        status: response.status,
        headers: resultHeaders
      });
    }

    return new Response(response.body, {
      status: response.status,
      headers: resultHeaders
    });
  }
};
