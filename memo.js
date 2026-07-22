const MEMO_STORAGE_KEY = "memos";
const MEMO_COLORS = ["#fff89c", "#ffd6e8", "#c9f7c5", "#c5e3ff", "#ffe0b2"];

const memoLayer = document.getElementById("memo-layer");
const memoAddBtn = document.getElementById("memo-add-btn");

let memos = loadMemos();
let topZ = 950;

function loadMemos() {
  try {
    return JSON.parse(localStorage.getItem(MEMO_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveMemos() {
  localStorage.setItem(MEMO_STORAGE_KEY, JSON.stringify(memos));
}

function createMemo() {
  const count = memos.length;
  const memo = {
    id: Date.now(),
    text: "",
    x: 100 + (count % 5) * 30,
    y: 100 + (count % 5) * 30,
    width: 200,
    height: 160,
    color: MEMO_COLORS[count % MEMO_COLORS.length],
    z: ++topZ,
  };
  memos.push(memo);
  saveMemos();
  renderMemo(memo);
}

function renderMemo(memo) {
  const note = document.createElement("div");
  note.className = "memo-note";
  note.dataset.id = memo.id;
  note.style.left = `${memo.x}px`;
  note.style.top = `${memo.y}px`;
  note.style.width = `${memo.width}px`;
  note.style.height = `${memo.height}px`;
  note.style.background = memo.color;
  note.style.zIndex = memo.z;

  const header = document.createElement("div");
  header.className = "memo-header";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "memo-delete";
  deleteBtn.title = "삭제";
  deleteBtn.textContent = "×";

  header.appendChild(deleteBtn);

  const textarea = document.createElement("textarea");
  textarea.className = "memo-text";
  textarea.placeholder = "메모를 입력하세요";
  textarea.value = memo.text;

  note.appendChild(header);
  note.appendChild(textarea);
  memoLayer.appendChild(note);

  bringToFront(memo, note);

  textarea.addEventListener("input", () => {
    memo.text = textarea.value;
    saveMemos();
  });

  deleteBtn.addEventListener("click", () => {
    memos = memos.filter((m) => m.id !== memo.id);
    saveMemos();
    note.remove();
  });

  header.addEventListener("pointerdown", (e) => {
    if (e.target === deleteBtn) return;
    bringToFront(memo, note);
    startDrag(e, memo, note);
  });

  note.addEventListener("pointerdown", () => bringToFront(memo, note));

  const resizeObserver = new ResizeObserver(() => {
    memo.width = note.offsetWidth;
    memo.height = note.offsetHeight;
    saveMemos();
  });
  resizeObserver.observe(note);
}

function bringToFront(memo, note) {
  memo.z = ++topZ;
  note.style.zIndex = memo.z;
  saveMemos();
}

function startDrag(e, memo, note) {
  const startX = e.clientX;
  const startY = e.clientY;
  const startLeft = note.offsetLeft;
  const startTop = note.offsetTop;

  function onMove(ev) {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    const newLeft = startLeft + dx;
    const newTop = startTop + dy;
    note.style.left = `${newLeft}px`;
    note.style.top = `${newTop}px`;
    memo.x = newLeft;
    memo.y = newTop;
  }

  function onUp() {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    saveMemos();
  }

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
}

memoAddBtn.addEventListener("click", createMemo);

memos.forEach(renderMemo);
