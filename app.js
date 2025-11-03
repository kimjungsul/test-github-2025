;(async () => {
  const rows = [
    { key: "movie", title: "영화" },
    { key: "drama", title: "드라마" },
    { key: "variety", title: "예능" }
  ];

  // TMDb 설정
  const API_KEY = "39b11f015fa7eb68f574c4365c18a486";
  const API_BASE = "https://api.themoviedb.org/3";
  const IMG_BASE = "https://image.tmdb.org/t/p/w500";

  function makeCard({ title, img, desc }) {
    const a = document.createElement("a");
    a.className = "card";
    a.href = "javascript:void(0)";
    a.dataset.title = title;
    a.dataset.img = img;
    a.dataset.desc = desc;
    const image = document.createElement("img");
    image.src = img;
    image.alt = `${title} 포스터`;
    a.appendChild(image);
    a.addEventListener("click", () => openModal(a.dataset));
    return a;
  }

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  function buildUrl(kind) {
    const common = `language=ko-KR&page=1&api_key=${API_KEY}`;
    switch (kind) {
      case "movie":
        return `${API_BASE}/movie/popular?${common}`;
      case "drama":
        // TV 드라마 장르(Drama: 18)
        return `${API_BASE}/discover/tv?${common}&with_genres=18&sort_by=popularity.desc`;
      case "variety":
        // 예능/리얼리티(Reality: 10764)
        return `${API_BASE}/discover/tv?${common}&with_genres=10764&sort_by=popularity.desc`;
      default:
        return `${API_BASE}/trending/all/day?${common}`;
    }
  }

  async function loadRow(row) {
    const section = document.querySelector(`.row[data-row="${row.key}"]`);
    if (!section) return;
    section.querySelector(".row-title").textContent = row.title;
    const track = section.querySelector(".track");

    try {
      const data = await fetchJson(buildUrl(row.key));
      const items = (data.results || []).filter(x => x.poster_path);
      items.slice(0, 20).forEach(item => {
        const title = item.title || item.name || "제목 미상";
        const desc = item.overview || "상세 설명이 준비되어 있지 않습니다.";
        const img = `${IMG_BASE}${item.poster_path}`;
        track.appendChild(makeCard({ title, img, desc }));
      });
    } catch (e) {
      console.error("Row load failed:", row.key, e);
      const fallback = document.createElement("div");
      fallback.style.color = "#b3b3b3";
      fallback.style.padding = "8px";
      fallback.textContent = "데이터를 불러오지 못했습니다.";
      track.appendChild(fallback);
    }

    const left = section.querySelector(".arrow.left");
    const right = section.querySelector(".arrow.right");
    const cardW = 200 + 8; // width + gap
    const step = cardW * 5;
    left.addEventListener("click", () => track.scrollBy({ left: -step, behavior: "smooth" }));
    right.addEventListener("click", () => track.scrollBy({ left: step, behavior: "smooth" }));
  }

  // Hero buttons
  document.getElementById("playHero")?.addEventListener("click", () => alert("재생을 시작합니다."));
  document.getElementById("infoHero")?.addEventListener("click", () => {
    openModal({
      title: "지금 가장 핫한 선택",
      img: "https://picsum.photos/seed/hero123/400/600",
      desc: "히어로 섹션의 샘플 상세 정보입니다."
    });
  });

  // Modal
  const modal = document.getElementById("modal");
  const modalPoster = document.getElementById("modalPoster");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");
  const modalMeta = document.getElementById("modalMeta");

  function openModal({ title, img, desc }) {
    modalPoster.src = img;
    modalTitle.textContent = title;
    modalDesc.textContent = desc || "상세 설명이 준비되어 있지 않습니다.";
    modalMeta.textContent = "2025 • 13+ • 2시간 10분";
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  modal.querySelector(".modal-backdrop").addEventListener("click", closeModal);
  modal.querySelector(".modal-close").addEventListener("click", closeModal);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Initialize
  await Promise.all(rows.map(loadRow));
  console.log("Moov UI initialized with TMDb");
})();


