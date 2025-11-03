(() => {
  const rows = [
    { key: "movie", count: 18, title: "영화" },
    { key: "drama", count: 18, title: "드라마" },
    { key: "variety", count: 18, title: "예능" }
  ];

  function posterUrl(i) {
    const id = (i * 37) % 1000 + 1;
    return `https://picsum.photos/seed/${id}/400/600`;
  }

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

  function fillRows() {
    rows.forEach((row, rIdx) => {
      const section = document.querySelector(`.row[data-row="${row.key}"]`);
      if (!section) return;
      section.querySelector(".row-title").textContent = row.title;

      const track = section.querySelector(".track");
      for (let i = 0; i < row.count; i++) {
        const title = `${row.title} #${i + 1}`;
        const img = posterUrl(i + rIdx * 100);
        const desc = "샘플 설명 텍스트입니다. 더 많은 정보를 여기에 넣을 수 있습니다.";
        track.appendChild(makeCard({ title, img, desc }));
      }

      const left = section.querySelector(".arrow.left");
      const right = section.querySelector(".arrow.right");
      const cardW = 200 + 8; // width + gap
      const step = cardW * 5;

      left.addEventListener("click", () => track.scrollBy({ left: -step, behavior: "smooth" }));
      right.addEventListener("click", () => track.scrollBy({ left: step, behavior: "smooth" }));
    });
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
  fillRows();
  console.log("Moov UI initialized");
})();


