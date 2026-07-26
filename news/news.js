const NEWS_LIST_CONTAINER_ID = "news-list";
const NEWS_BRIEFING_BTN_ID = "news-briefing-btn";
const NEWS_BRIEFING_CARDS_ID = "news-briefing-cards";

const NEWS_FETCH_TIMEOUT_MS = 5000;
const NEWS_BRIEFING_ORDINALS = ["첫번째", "두번째", "세번째", "네번째", "다섯번째"];

async function fetchRecentNews(keyword, count = 5) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NEWS_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(SUPABASE_NEWS_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ keyword, count }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`뉴스 조회 실패 (status: ${response.status})`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function stripHtmlTags(str) {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "");
}

function buildBriefingText(items) {
  if (!items || items.length === 0) return "";

  return items
    .map((item, index) => {
      const ordinal = NEWS_BRIEFING_ORDINALS[index] || `${index + 1}번째`;
      return `${ordinal} 뉴스, ${stripHtmlTags(item.title)}.`;
    })
    .join(" ");
}

function renderNewsList(items) {
  const container = document.getElementById(NEWS_LIST_CONTAINER_ID);
  if (!container) return;

  container.innerHTML = "";

  if (!items || items.length === 0) {
    const emptyMsg = document.createElement("li");
    emptyMsg.className = "news-empty-msg";
    emptyMsg.textContent = "표시할 뉴스가 없습니다.";
    container.appendChild(emptyMsg);
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("li");
    card.className = "news-card";

    const title = document.createElement("h3");
    title.className = "news-card-title";
    title.textContent = stripHtmlTags(item.title);

    const description = document.createElement("p");
    description.className = "news-card-desc";
    description.textContent = stripHtmlTags(item.description);

    const meta = document.createElement("div");
    meta.className = "news-card-meta";

    const date = document.createElement("span");
    date.className = "news-card-date";
    date.textContent = buildPubDateLabel(item.pubDate);

    const link = document.createElement("a");
    link.className = "news-card-link";
    link.href = item.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "원문보기";

    meta.appendChild(date);
    meta.appendChild(link);

    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(meta);

    container.appendChild(card);
  });
}

function buildPubDateLabel(pubDate) {
  const parsed = new Date(pubDate);
  if (Number.isNaN(parsed.getTime())) return pubDate;

  const pad = (n) => String(n).padStart(2, "0");
  const y = parsed.getFullYear();
  const m = pad(parsed.getMonth() + 1);
  const d = pad(parsed.getDate());
  const hh = pad(parsed.getHours());
  const mm = pad(parsed.getMinutes());
  return `${y}.${m}.${d} ${hh}:${mm}`;
}

function renderNewsBriefing(items) {
  const container = document.getElementById(NEWS_BRIEFING_CARDS_ID);
  if (!container) return;

  container.innerHTML = "";

  if (!items || items.length === 0) return;

  items.forEach((item) => {
    const card = document.createElement("li");
    card.className = "news-card";

    const title = document.createElement("h3");
    title.className = "news-card-title";
    title.textContent = stripHtmlTags(item.title);

    const description = document.createElement("p");
    description.className = "news-card-desc";
    description.textContent = stripHtmlTags(item.description);

    card.appendChild(title);
    card.appendChild(description);
    container.appendChild(card);
  });
}

function speakBriefing(text) {
  if (!text || !("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  speechSynthesis.speak(utterance);
}

function stopBriefing() {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
}

function renderNewsMessage(message, className) {
  const container = document.getElementById(NEWS_LIST_CONTAINER_ID);
  if (!container) return;

  container.innerHTML = "";
  const msg = document.createElement("li");
  msg.className = className;
  msg.textContent = message;
  container.appendChild(msg);
}

function renderNewsRetry(message, onRetry) {
  const container = document.getElementById(NEWS_LIST_CONTAINER_ID);
  if (!container) return;

  container.innerHTML = "";

  const item = document.createElement("li");
  item.className = "news-retry-msg";

  const text = document.createElement("p");
  text.textContent = message;

  const retryBtn = document.createElement("button");
  retryBtn.type = "button";
  retryBtn.className = "news-retry-btn";
  retryBtn.textContent = "재시도";
  retryBtn.addEventListener("click", onRetry);

  item.appendChild(text);
  item.appendChild(retryBtn);
  container.appendChild(item);
}

const newsBriefingBtn = document.getElementById(NEWS_BRIEFING_BTN_ID);
if (newsBriefingBtn) {
  newsBriefingBtn.addEventListener("click", async () => {
    const keyword = window.prompt("검색할 뉴스 키워드를 입력하세요.");
    if (!keyword || !keyword.trim()) return;

    const trimmedKeyword = keyword.trim();

    const attemptFetch = async () => {
      renderNewsMessage("불러오는 중...", "news-loading-msg");

      try {
        const data = await fetchRecentNews(trimmedKeyword);
        renderNewsList(data.items);
      } catch (err) {
        if (err.name === "AbortError") {
          renderNewsRetry("요청 시간이 초과되었습니다.", attemptFetch);
        } else {
          renderNewsMessage("뉴스를 불러올 수 없습니다", "news-error-msg");
        }
      }
    };

    await attemptFetch();
  });
}
