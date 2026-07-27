const NAVER_NEWS_API_URL = "https://openapi.naver.com/v1/search/news.json";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  let body: { keyword?: unknown; count?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const keyword = body?.keyword;
  if (typeof keyword !== "string" || keyword.trim() === "") {
    return jsonResponse({ error: "keyword is required" }, 400);
  }

  let count = 5;
  if (body?.count !== undefined) {
    if (typeof body.count !== "number" || !Number.isInteger(body.count) || body.count < 1 || body.count > 100) {
      return jsonResponse({ error: "count must be an integer between 1 and 100" }, 400);
    }
    count = body.count;
  }

  const clientId = Deno.env.get("NAVER_CLIENT_ID");
  const clientSecret = Deno.env.get("NAVER_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return jsonResponse({ error: "Naver API credentials are not configured" }, 500);
  }

  const naverUrl = new URL(NAVER_NEWS_API_URL);
  naverUrl.searchParams.set("query", keyword);
  naverUrl.searchParams.set("display", String(count));
  naverUrl.searchParams.set("sort", "date");

  try {
    const naverRes = await fetch(naverUrl.toString(), {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!naverRes.ok) {
      return jsonResponse({ error: "Naver API request failed" }, 500);
    }

    const buffer = await naverRes.arrayBuffer();
    const contentType = naverRes.headers.get("content-type") || "";
    const charsetMatch = contentType.match(/charset=([^;]+)/i);
    const charset = charsetMatch ? charsetMatch[1].trim().toLowerCase() : "utf-8";

    let text: string;
    try {
      text = new TextDecoder(charset).decode(buffer);
    } catch {
      text = new TextDecoder("utf-8").decode(buffer);
    }

    const data = JSON.parse(text);
    return jsonResponse(data, 200);
  } catch {
    return jsonResponse({ error: "Naver API request failed" }, 500);
  }
});
