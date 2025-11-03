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
  const IMG_BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";

  // 간단 데모용 HLS 스트림 (테스트용 공개 샘플)
  const DEMO_STREAM = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

  function makeCard({ id, mediaType, title, img, desc }) {
    const a = document.createElement("a");
    a.className = "card";
    a.href = "javascript:void(0)";
    a.dataset.id = id;
    a.dataset.mediaType = mediaType;
    a.dataset.title = title;
    a.dataset.img = img;
    a.dataset.desc = desc;
    const image = document.createElement("img");
    image.src = img;
    image.alt = `${title} 포스터`;
    a.appendChild(image);
    a.addEventListener("click", () => openModal({ id, mediaType, title, img, desc }));
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
        const mediaType = row.key === 'movie' ? 'movie' : 'tv';
        track.appendChild(makeCard({ id: item.id, mediaType, title, img, desc }));
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
  const heroSection = document.querySelector(".hero");
  const heroTitleEl = document.querySelector(".hero-title");
  const heroDescEl = document.querySelector(".hero-desc");
  const heroPlayBtn = document.getElementById("playHero");
  let heroItems = [];
  let heroIndex = 0;

  function renderHero(index) {
    if (!heroItems.length) return;
    const item = heroItems[index];
    const bg = item.backdrop || item.poster;
    if (bg) heroSection.style.setProperty("--hero", `url('${bg}')`);
    if (heroTitleEl) heroTitleEl.textContent = item.title || "지금 가장 핫한 선택";
    if (heroDescEl) heroDescEl.textContent = item.desc || "지금 바로 재생하거나, 상세 정보를 확인해 보세요.";
    if (heroPlayBtn) heroPlayBtn.disabled = !Boolean(item.streamUrl);
  }

  function startHeroRolling() {
    renderHero(0);
    setInterval(() => {
      if (!heroItems.length) return;
      heroIndex = (heroIndex + 1) % heroItems.length;
      renderHero(heroIndex);
    }, 5000);
  }

  document.getElementById("playHero")?.addEventListener("click", () => {
    const cur = heroItems[heroIndex];
    if (!cur?.streamUrl) return; // 트레일러 없으면 비활성
    openPlayer(cur.streamUrl, cur.title || "재생");
  });
  document.getElementById("infoHero")?.addEventListener("click", () => {
    const cur = heroItems[heroIndex];
    if (cur) {
      openModal({ id: cur.id, mediaType: cur.mediaType, title: cur.title, img: cur.poster || cur.backdrop, desc: cur.desc, streamUrl: cur.streamUrl });
    } else {
      openModal({
        title: "지금 가장 핫한 선택",
        img: "https://picsum.photos/seed/hero123/400/600",
        desc: "히어로 섹션의 샘플 상세 정보입니다.",
        streamUrl: DEMO_STREAM
      });
    }
  });

  // Modal
  const modal = document.getElementById("modal");
  const modalPoster = document.getElementById("modalPoster");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");
  const modalMeta = document.getElementById("modalMeta");

  function openModal({ id, mediaType, title, img, desc, streamUrl }) {
    modalPoster.src = img;
    modalTitle.textContent = title;
    modalDesc.textContent = desc || "상세 설명이 준비되어 있지 않습니다.";
    modalMeta.textContent = "2025 • 13+ • 2시간 10분";
    if (streamUrl) modal.dataset.streamUrl = streamUrl; else delete modal.dataset.streamUrl;
    if (id) modal.dataset.id = id; else delete modal.dataset.id;
    if (mediaType) modal.dataset.mediaType = mediaType; else delete modal.dataset.mediaType;
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    updateModalPlayButton();
    // 트레일러 비동기 조회 (가능 시)
    if (id && mediaType) {
      fetchTrailer({ id, mediaType }).then(url => {
        if (url) modal.dataset.streamUrl = url;
        else delete modal.dataset.streamUrl;
        updateModalPlayButton();
      }).catch(() => {});
    }
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
  // 모달 내 재생 버튼 → 비디오 플레이어 열기
  const modalPlayBtn = modal.querySelector('.modal-actions .btn.primary');
  function updateModalPlayButton() {
    if (!modalPlayBtn) return;
    const hasUrl = Boolean(modal.dataset.streamUrl);
    modalPlayBtn.disabled = !hasUrl;
  }
  modalPlayBtn?.addEventListener('click', () => {
    if (!modal.dataset.streamUrl) return;
    const title = modalTitle.textContent || '재생';
    openPlayer(modal.dataset.streamUrl, title);
  });

  // Player
  const playerModal = document.getElementById("playerModal");
  const videoEl = document.getElementById("videoPlayer");
  const ytIframe = document.getElementById("ytPlayer");
  function openPlayer(streamUrl, title) {
    // 비디오 초기화
    const isHls = /\.m3u8($|\?)/i.test(streamUrl);
    const isYouTube = /youtube\.com|youtu\.be/i.test(streamUrl);
    // reset
    if (videoEl) {
      videoEl.style.display = 'none';
      try { videoEl.pause(); } catch {}
      if (videoEl._hls) { videoEl._hls.destroy(); videoEl._hls = null; }
      videoEl.removeAttribute('src');
      videoEl.load();
    }
    if (ytIframe) {
      ytIframe.style.display = 'none';
      ytIframe.src = '';
    }

    if (isHls) {
      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(videoEl);
        videoEl._hls = hls;
      } else if (videoEl.canPlayType('application/vnd.apple.mpegURL')) {
        videoEl.src = streamUrl;
      } else {
        alert('이 브라우저는 HLS 재생을 지원하지 않습니다.');
        return;
      }
      videoEl.style.display = 'block';
      videoEl.play().catch(() => {});
    } else if (isYouTube) {
      ytIframe.src = streamUrl;
      ytIframe.style.display = 'block';
    } else {
      // 알 수 없는 URL -> HLS로 시도하거나 실패 시 안내
      videoEl.style.display = 'block';
      videoEl.src = streamUrl;
      videoEl.play().catch(() => {});
    }
    playerModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closePlayer() {
    playerModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (videoEl) {
      try { videoEl.pause(); } catch {}
      if (videoEl._hls) { videoEl._hls.destroy(); videoEl._hls = null; }
      videoEl.removeAttribute('src');
      videoEl.load();
    }
    if (ytIframe) { ytIframe.src = ''; }
  }
  playerModal.querySelector('.modal-backdrop').addEventListener('click', closePlayer);
  playerModal.querySelector('.modal-close').addEventListener('click', closePlayer);

  async function fetchHeroItems() {
    const common = `language=ko-KR&page=1&api_key=${API_KEY}`;
    const urls = [
      `${API_BASE}/movie/popular?${common}`,
      `${API_BASE}/discover/tv?${common}&with_genres=18&sort_by=popularity.desc`,
      `${API_BASE}/discover/tv?${common}&with_genres=10764&sort_by=popularity.desc`
    ];
    const [movie, drama, variety] = await Promise.all(urls.map(fetchJson));
    const toItem = (it, mediaType) => ({
      id: it.id,
      mediaType,
      title: it.title || it.name || "제목 미상",
      desc: it.overview || "상세 설명이 준비되어 있지 않습니다.",
      poster: it.poster_path ? `${IMG_BASE}${it.poster_path}` : "",
      backdrop: it.backdrop_path ? `${IMG_BACKDROP_BASE}${it.backdrop_path}` : "",
      popularity: typeof it.popularity === "number" ? it.popularity : 0
    });
    const merged = [
        ...(movie.results||[]).map(x => toItem(x, 'movie')),
        ...(drama.results||[]).map(x => toItem(x, 'tv')),
        ...(variety.results||[]).map(x => toItem(x, 'tv'))
      ]
      .filter(x => x.backdrop || x.poster);
    merged.sort((a, b) => b.popularity - a.popularity);
    const top5 = merged.slice(0, 5);
    // 각 항목의 트레일러를 미리 조회해 streamUrl 세팅 (언어 무관)
    const withTrailers = await Promise.all(top5.map(async (it) => {
      const url = await fetchTrailer({ id: it.id, mediaType: it.mediaType });
      return { ...it, streamUrl: url || null };
    }));
    return withTrailers;
  }

  async function fetchTrailer({ id, mediaType }) {
    try {
      // 언어 우선순위: ko-KR → en-US → 언어 미지정
      const makeUrl = (lang) => mediaType === 'movie'
        ? `${API_BASE}/movie/${id}/videos?api_key=${API_KEY}${lang ? `&language=${lang}` : ''}`
        : `${API_BASE}/tv/${id}/videos?api_key=${API_KEY}${lang ? `&language=${lang}` : ''}`;
      const [ko, en, any] = await Promise.allSettled([
        fetchJson(makeUrl('ko-KR')),
        fetchJson(makeUrl('en-US')),
        fetchJson(makeUrl(''))
      ]);
      const vids = [ko, en, any]
        .map(r => r.status === 'fulfilled' ? (r.value.results || []) : [])
        .flat();
      const pick = vids.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official)
                || vids.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
                || vids.find(v => v.site === 'YouTube');
      if (!pick || !pick.key) return null;
      return `https://www.youtube.com/embed/${pick.key}?autoplay=1&rel=0&modestbranding=1`;
    } catch (e) {
      console.warn('fetchTrailer failed', id, mediaType, e);
      return null;
    }
  }

  // Initialize
  [heroItems] = await Promise.all([
    fetchHeroItems(),
    Promise.all(rows.map(loadRow))
  ]);
  startHeroRolling();
  console.log("Moov UI initialized with TMDb + hero rolling");
})();


