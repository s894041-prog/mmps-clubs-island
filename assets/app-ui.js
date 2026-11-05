// 馬鳴國小社團群島 - 互動介面、即時雷達、平面圖定位、適性測驗與報名回條系統
(function () {
  const islands = window.MMPS_ISLANDS;
  const islandMap = {};
  islands.forEach((it) => (islandMap[it.id] = it));

  // 載入儲存在 localStorage 的即時報名人數微調紀錄
  try {
    const savedCounts = JSON.parse(localStorage.getItem("mmps_club_counts") || "{}");
    islands.forEach((it) => {
      if (typeof savedCounts[it.id] === "number") {
        it.enrolled = savedCounts[it.id];
      }
    });
  } catch (e) {}

  function saveCounts() {
    try {
      const obj = {};
      islands.forEach((it) => (obj[it.id] = it.enrolled));
      localStorage.setItem("mmps_club_counts", JSON.stringify(obj));
    } catch (e) {}
  }

  // 全域 UI 狀態
  const state = {
    selected: null,
    hovered: null,
    activeTab: "intro",
    view: "panorama", // panorama | bird | list
    showLabels: true,
    showLinks: false,
    animate: true,
    fx: true,
    showLog: window.innerWidth > 860,
    timeMode: "auto", // auto | day | dusk | night
    slotMode: "auto",
    quoteIdx: Math.floor(Date.now() / 86400000) % window.MMPS_QUOTES.length,
    foundMascots: new Set(),
    tour: null, // { idx: 0, paused: false, progress: 0 }
    quizStep: 0,
    quizAnswers: [],
    roam: false,
    currentNearIsland: "hub",
    slip: {
      grade: "3",
      cls: "三年甲班",
      seat: "1",
      name: "",
      selectedClubs: new Set(["unicycle", "gigo"])
    }
  };

  let sceneApi = null;
  let toastTimer = null;

  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add("hidden"), 2800);
  }

  // 根據目前時鐘判斷日夜主題
  function resolveTimeTheme(mode) {
    if (mode !== "auto") return mode;
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    if (h >= 6.5 && h < 16.8) return "day";
    if ((h >= 16.8 && h < 18.5) || (h >= 5.5 && h < 6.5)) return "dusk";
    return "night";
  }

  // 根據真實時間或模擬時段取得目前上課中的社團島 ID
  function resolveLiveClubIds() {
    if (state.slotMode !== "auto") {
      const slot = window.MMPS_SLOTS.find((s) => s.id === state.slotMode);
      return slot ? slot.activeIds : ["hub"];
    }
    const now = new Date();
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();
    const active = [];
    if (day === 1 && mins >= 15 * 60 + 10 && mins <= 16 * 60 + 40) active.push("unicycle");
    if (day === 2 && mins >= 12 * 60 + 40 && mins <= 13 * 60 + 20) active.push("calligraphy");
    if (day === 3) {
      if (mins >= 12 * 60 + 40 && mins <= 14 * 60 + 20) active.push("rhythm");
      if (mins >= 13 * 60 + 50 && mins <= 14 * 60 + 50) active.push("taiko_jr");
      if (mins >= 14 * 60 + 50 && mins <= 15 * 60 + 50) active.push("taiko_sr");
      if (mins >= 13 * 60 + 30 && mins <= 15 * 60) active.push("gigo");
    }
    if (day === 4 && mins >= 7 * 60 + 30 && mins <= 8 * 60) active.push("lion");
    if (day === 5 && mins >= 7 * 60 + 50 && mins <= 8 * 60 + 20) active.push("english");
    return active.length ? active : ["hub"];
  }

  // =========================================================
  // 頂部列：名言、日期時間、臺中外埔即時天氣
  // =========================================================
  function renderQuote() {
    const [text, author] = window.MMPS_QUOTES[state.quoteIdx % window.MMPS_QUOTES.length];
    document.getElementById("quote-text").textContent = text;
    document.getElementById("quote-by").textContent = `—— ${author}`;
  }

  function updateClock() {
    const now = new Date();
    const days = ["日", "一", "二", "三", "四", "五", "六"];
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const w = days[now.getDay()];
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    document.getElementById("clock-date").textContent = `${m} 月 ${d} 日`;
    document.getElementById("clock-time").textContent = `星期${w}・${hh}:${mm}`;
  }

  async function fetchWaipuWeather() {
    const { lat, lon } = window.MMPS_CONFIG.coordinates;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTaipei&forecast_days=1`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const c = data.current;
      const code = c.weather_code;
      let info = { text: "晴朗", icon: "☀️" };
      if (code === 1 || code === 2) info = { text: "晴時多雲", icon: "🌤️" };
      else if (code === 3) info = { text: "多雲", icon: "⛅" };
      else if (code >= 45 && code <= 48) info = { text: "微霧", icon: "🌫️" };
      else if (code >= 51 && code <= 67) info = { text: "有雨", icon: "🌧️" };
      else if (code >= 80) info = { text: "陣雨", icon: "🌦️" };

      const maxT = Math.round(data.daily.temperature_2m_max[0]);
      const minT = Math.round(data.daily.temperature_2m_min[0]);
      const rainP = data.daily.precipitation_probability_max[0] ?? 0;

      document.getElementById("wx-box").innerHTML = `
        <span class="wx-icon">${info.icon}</span>
        <div>
          <b>${info.text} ${Math.round(c.temperature_2m)}°C</b>
          <span>${minT}°～${maxT}°・降雨 ${rainP}%</span>
        </div>
      `;
    } catch (e) {
      document.getElementById("wx-box").innerHTML = `
        <span class="wx-icon">🌤️</span>
        <div>
          <b>外埔晴空 25°C</b>
          <span>適合社團活動好天氣</span>
        </div>
      `;
    }
  }

  // =========================================================
  // 左側社團即時雷達與時段模擬器
  // =========================================================
  function renderLiveLog() {
    const logEl = document.getElementById("club-log");
    logEl.classList.toggle("hidden", !state.showLog || !!state.selected);

    const pillsContainer = document.getElementById("sim-pills");
    pillsContainer.innerHTML = window.MMPS_SLOTS.map(
      (s) => `
      <button class="sim-pill ${state.slotMode === s.id ? "on" : ""}" data-slot="${s.id}">
        ${s.label}
      </button>
    `
    ).join("");

    pillsContainer.querySelectorAll(".sim-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.slotMode = btn.dataset.slot;
        const liveIds = resolveLiveClubIds();
        sceneApi.setLiveIslands(liveIds);
        renderLiveLog();
        const slotObj = window.MMPS_SLOTS.find((s) => s.id === state.slotMode);
        if (slotObj) {
          showToast(`⚡ 已切換時段：${slotObj.desc}`);
          if (liveIds.length === 1 && liveIds[0] !== "hub") {
            sceneApi.setHovered(liveIds[0]);
          }
        }
      });
    });

    const currentSlot = window.MMPS_SLOTS.find((s) => s.id === state.slotMode);
    document.getElementById("sim-desc").textContent = currentSlot ? currentSlot.desc : "";

    // 彙整所有社團重要公告與開課時程
    const allLogs = [
      {
        islandId: "hub",
        tag: "報名提醒",
        time: "9/7(一)前",
        title: "請將社團調查表回條交回 2F 學務處紀主任（免收費用）"
      },
      {
        islandId: "gigo",
        tag: "新增社團",
        time: "週三 13:30",
        title: "全新【智高創客社】於 2F DOC 教室開課！歡迎喜愛機關積木同學參加"
      },
      {
        islandId: "unicycle",
        tag: "獨輪車社",
        time: "週一 15:10起",
        title: "操場分齡上課（低年級 15:10-15:50／中高年級 16:00-16:40）吳老師"
      },
      {
        islandId: "calligraphy",
        tag: "書法社",
        time: "週二 12:40",
        title: "彭校長親自於 2F 會議室指導三～六年級毛筆書法與靜心運筆"
      },
      {
        islandId: "rhythm",
        tag: "節奏樂社",
        time: "週三 12:40",
        title: "吳老師於 2F 英語教室指導木琴、鐵琴與打擊器樂合奏"
      },
      {
        islandId: "taiko_jr",
        tag: "太鼓初階",
        time: "週三 13:50",
        title: "一～二年級專屬！施老師於 2F 視聽教室帶領快樂打擊太鼓"
      },
      {
        islandId: "taiko_sr",
        tag: "太鼓進階",
        time: "週三 14:50",
        title: "三～六年級表演隊於 2F 視聽教室排練（與節奏樂時段不衝堂！）"
      },
      {
        islandId: "lion",
        tag: "舞獅社",
        time: "週四 07:30",
        title: "黃老師於 1F 風雨教室指導傳統醒獅與鑼鼓技藝"
      },
      {
        islandId: "english",
        tag: "英語社",
        time: "週五 07:50",
        title: "林老師於 2F 英語教室帶領英語繪本劇場與趣味互動"
      }
    ];

    const newsUl = document.getElementById("log-news-list");
    newsUl.innerHTML = allLogs
      .map(
        (item) => `
      <li data-island="${item.islandId}">
        <div class="meta">
          <span class="unit">${item.tag}</span>
          <span>${item.time}</span>
        </div>
        <div class="title">${item.title}</div>
      </li>
    `
      )
      .join("");

    newsUl.querySelectorAll("li").forEach((li) => {
      li.addEventListener("click", () => selectIsland(li.dataset.island));
    });
  }

  // =========================================================
  // 右側浮空島詳細資訊面板 (4 大分頁)
  // =========================================================
  function selectIsland(id) {
    state.selected = id;
    if (state.tour && id) stopTour();
    sceneApi.setSelected(id);
    sceneApi.focusIsland(id, state.view);
    renderLiveLog();
    renderPanel();
    renderToolbar();
  }

  function renderPanel() {
    const panelEl = document.getElementById("detail-panel");
    if (!state.selected) {
      panelEl.classList.add("hidden");
      return;
    }
    const club = islandMap[state.selected];
    if (!club) return;

    panelEl.classList.remove("hidden");
    panelEl.style.setProperty("--c", club.color);

    const idx = islands.findIndex((i) => i.id === club.id);
    const prevId = islands[(idx - 1 + islands.length) % islands.length].id;
    const nextId = islands[(idx + 1) % islands.length].id;

    const pct = Math.min(100, Math.round((club.enrolled / club.capacity) * 100));
    const isSelectedInSlip = state.slip.selectedClubs.has(club.id);

    let tabBodyHtml = "";
    if (state.activeTab === "intro") {
      tabBodyHtml = `
        <div class="notice-box">
          <b>📍 上課地點：</b>${club.location}（${club.floor}）<br/>
          <b>🕒 上課時間：</b>${club.scheduleText}<br/>
          <b>👩‍🏫 指導師資：</b>${club.teacher}｜<b>📅 開課：</b>${club.startDate}
        </div>
        ${club.intro.map((p) => `<p class="para">${p}</p>`).join("")}
        <h4>✨ 核心學習內容</h4>
        <div class="chips">
          ${club.courses.map((c) => `<span class="chip">${c}</span>`).join("")}
        </div>
        <h4>📌 社團重要須知</h4>
        <ul class="features">
          ${club.features.map((f) => `<li>${f}</li>`).join("")}
        </ul>
        ${
          club.id !== "hub"
            ? `
          <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
            <button id="panel-add-slip" class="reg-btn" style="flex:1;padding:10px 14px;">
              ${isSelectedInSlip ? "✓ 已加入報名回條意願（點擊開啟回條）" : "＋ 將此社團加入我的報名回條"}
            </button>
            <button id="panel-go-map" class="tb" style="border:1px solid var(--line);background:var(--paper-2);">
              🗺️ 查看教室平面圖
            </button>
          </div>
        `
            : `
          <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
            <button id="panel-open-slip" class="reg-btn" style="flex:1;padding:10px 14px;">
              📝 開啟 115-1 社團報名回條試算
            </button>
            <button id="panel-open-fullmap" class="tour-btn" style="padding:10px 14px;">
              🗺️ 全校社團平面圖總覽
            </button>
          </div>
        `
        }
      `;
    } else if (state.activeTab === "data") {
      tabBodyHtml = `
        <h4>📊 115-1 即時報名與名額統計</h4>
        <div class="tiles">
          <div class="tile">
            <span class="tile-label">目前報名人數</span>
            <div class="tile-val">${club.enrolled} <small>人</small></div>
          </div>
          <div class="tile">
            <span class="tile-label">核定名額上限</span>
            <div class="tile-val">${club.capacity} <small>人</small></div>
          </div>
          <div class="tile">
            <span class="tile-label">名額滿額率</span>
            <div class="tile-val">${pct} <small>%</small></div>
          </div>
          <div class="tile">
            <span class="tile-label">社團收費標準</span>
            <div class="tile-val" style="color:#2b8256;">免費 <small>0 元</small></div>
          </div>
        </div>

        <div class="bar-chart">
          <div style="font-size:12px;font-weight:800;margin-bottom:6px;color:var(--ink-2);">
            各年段報名人數分佈
          </div>
          ${club.gradeDist
            .map(
              (g) => `
            <div class="bar-row">
              <span class="b-label">${g.label}</span>
              <div class="b-track">
                <div class="b-fill" style="width:${Math.min(100, Math.round((g.count / club.capacity) * 100))}%"></div>
              </div>
              <span class="b-val">${g.count} 人</span>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="quota-adjust">
          <div>
            <b style="font-size:13px;">即時人數動態調整（展示／管理）</b>
            <div style="font-size:11.5px;color:var(--muted);">可即時增減並自動儲存於瀏覽器</div>
          </div>
          <div class="quota-btns">
            <button id="q-minus" title="減少 1 人">－</button>
            <span style="font-weight:900;min-width:36px;text-align:center;">${club.enrolled}</span>
            <button id="q-plus" title="增加 1 人">＋</button>
          </div>
        </div>

        <h4>🌟 社團特色亮點</h4>
        <ul class="features">
          ${club.features.map((f) => `<li>${f}</li>`).join("")}
        </ul>
      `;
    } else if (state.activeTab === "map") {
      tabBodyHtml = `
        <h4>🗺️ 馬鳴國小平面圖・上課教室定位</h4>
        <p class="para" style="font-size:13px;margin-bottom:8px;">
          <b>${club.short}</b> 上課地點位於 <b>${club.mapPin.room}</b>（紅圈閃爍處）。點擊平面圖上其他標籤可直接切換至該社團島：
        </p>
        <div class="floorplan-card">
          <img src="./馬鳴平面.jpg" alt="馬鳴國小校園平面圖" />
          ${islands
            .map(
              (it) => `
            <button
              class="fp-pin ${it.id === club.id ? "active" : ""}"
              style="left:${it.mapPin.x}%;top:${it.mapPin.y}%;--c:${it.color};"
              data-pin-island="${it.id}"
              title="${it.name}（${it.location}）"
            >
              ${it.id === club.id ? "📍 " : ""}${it.short}
            </button>
          `
            )
            .join("")}
        </div>
        <div class="notice-box" style="margin-top:12px;">
          <b>🚶 校園動線指引：</b><br/>
          ${club.mapPin.route}
        </div>
      `;
    } else if (state.activeTab === "news") {
      tabBodyHtml = `
        <h4>📢 社團開課時程與最新公告</h4>
        <ul class="news" style="padding:0;">
          ${club.announcements
            .map(
              (a) => `
            <li style="cursor:default;">
              <div class="meta">
                <span class="unit">${a.unit}</span>
                <span>${a.date}</span>
              </div>
              <div class="title">${a.title}</div>
            </li>
          `
            )
            .join("")}
        </ul>
        <div class="notice-box" style="margin-top:14px;">
          <b>📞 社團報名與洽詢專線：</b><br/>
          臺中市外埔區馬鳴國民小學 學務處<br/>
          電話：<b>${window.MMPS_CONFIG.contact}</b><br/>
          回條繳交期限：<b>${window.MMPS_CONFIG.deadline}</b>
        </div>
      `;
    }

    panelEl.innerHTML = `
      <div class="panel-head">
        <div class="panel-nav">
          <button class="nav-circle" id="panel-prev" title="上一座島 (←)">‹</button>
          <button class="nav-circle" id="panel-next" title="下一座島 (→)">›</button>
          <span class="kind">${club.badge}｜${club.location}</span>
          <button class="x" id="panel-close" title="關閉 (Esc)">×</button>
        </div>
        <h2>${club.name}</h2>
        <p class="tagline">${club.tagline}</p>
        <div class="group-meta">
          <span>👤 對象：${club.gradeTarget}</span>
          <span>🕒 ${club.scheduleText}</span>
          <span>👩‍🏫 ${club.teacher}</span>
        </div>
        <div class="tabs">
          <button class="${state.activeTab === "intro" ? "on" : ""}" data-tab="intro">社團介紹</button>
          <button class="${state.activeTab === "data" ? "on" : ""}" data-tab="data">即時名額 (${club.enrolled}/${club.capacity})</button>
          <button class="${state.activeTab === "map" ? "on" : ""}" data-tab="map">教室平面圖</button>
          <button class="${state.activeTab === "news" ? "on" : ""}" data-tab="news">開課公告</button>
        </div>
      </div>
      <div class="panel-body">
        ${tabBodyHtml}
      </div>
    `;

    // 綁定面板事件
    document.getElementById("panel-prev").onclick = () => selectIsland(prevId);
    document.getElementById("panel-next").onclick = () => selectIsland(nextId);
    document.getElementById("panel-close").onclick = () => selectIsland(null);

    panelEl.querySelectorAll(".tabs button").forEach((b) => {
      b.onclick = () => {
        state.activeTab = b.dataset.tab;
        renderPanel();
      };
    });

    const addSlipBtn = document.getElementById("panel-add-slip");
    if (addSlipBtn) {
      addSlipBtn.onclick = () => {
        state.slip.selectedClubs.add(club.id);
        openSlipModal();
        renderPanel();
      };
    }

    const goMapBtn = document.getElementById("panel-go-map");
    if (goMapBtn) {
      goMapBtn.onclick = () => {
        state.activeTab = "map";
        renderPanel();
      };
    }

    const openSlipBtn = document.getElementById("panel-open-slip");
    if (openSlipBtn) openSlipBtn.onclick = () => openSlipModal();

    const openFullMapBtn = document.getElementById("panel-open-fullmap");
    if (openFullMapBtn) openFullMapBtn.onclick = () => openMapModal();

    const qMinus = document.getElementById("q-minus");
    const qPlus = document.getElementById("q-plus");
    if (qMinus) {
      qMinus.onclick = () => {
        club.enrolled = Math.max(0, club.enrolled - 1);
        saveCounts();
        renderPanel();
      };
    }
    if (qPlus) {
      qPlus.onclick = () => {
        club.enrolled = Math.min(club.capacity + 10, club.enrolled + 1);
        saveCounts();
        renderPanel();
      };
    }

    panelEl.querySelectorAll("[data-pin-island]").forEach((pin) => {
      pin.onclick = () => selectIsland(pin.dataset.pinIsland);
    });
  }

  // =========================================================
  // 清單與 115-1 社團總表視圖 (List View)
  // =========================================================
  function renderListView() {
    const lv = document.getElementById("list-view");
    if (state.view !== "list") {
      lv.classList.add("hidden");
      return;
    }
    lv.classList.remove("hidden");

    const clubRows = islands
      .filter((i) => i.id !== "hub")
      .map(
        (c) => `
      <tr style="border-bottom:1px solid var(--line);">
        <td style="padding:10px;font-weight:900;color:${c.color};">${c.short}</td>
        <td style="padding:10px;">${c.gradeTarget}</td>
        <td style="padding:10px;font-weight:600;">${c.scheduleText}</td>
        <td style="padding:10px;"><span class="chip">${c.location}</span></td>
        <td style="padding:10px;">${c.teacher}</td>
        <td style="padding:10px;">${c.startDate}</td>
        <td style="padding:10px;">
          <button class="tb on" style="padding:4px 10px;font-size:12px;" data-goto="${c.id}">飛往小島 ›</button>
        </td>
      </tr>
    `
      )
      .join("");

    lv.innerHTML = `
      <div class="list-inner">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
          <div>
            <h2 style="margin:0;font-size:22px;font-weight:900;">馬鳴國小 115 學年度社團群島總覽（共 9 座浮空島）</h2>
            <p style="margin:4px 0 0;color:var(--ink-2);font-size:13.5px;">
              點選任一社團卡片或下方總表按鈕，即可飛往該座 3D 浮空島查看微縮上課動態！
            </p>
          </div>
          <button id="list-close-btn" class="tour-btn" style="padding:8px 16px;">返回 3D 天空群島 ›</button>
        </div>

        <div class="cards">
          ${islands
            .map(
              (c) => `
            <button class="card" style="--c:${c.color}" data-goto="${c.id}">
              <span class="card-kind">${c.badge}｜📍${c.location}</span>
              <b>${c.name}</b>
              <span class="card-tag">${c.tagline}</span>
              <span class="card-stat">👩‍🏫 ${c.teacher}・🕒 ${c.scheduleText}（名額 ${c.enrolled}/${c.capacity}）</span>
            </button>
          `
            )
            .join("")}
        </div>

        <h3 style="margin:18px 0 10px;font-size:18px;font-weight:900;">📋 臺中市馬鳴國小 115 學年度社團活動人數調查總表（含新增 DOC 智高社團）</h3>
        <div style="overflow-x:auto;background:var(--paper);border:1px solid var(--line);border-radius:14px;">
          <table style="width:100%;border-collapse:collapse;font-size:13.5px;text-align:left;">
            <thead>
              <tr style="background:var(--paper-2);border-bottom:2px solid var(--line);">
                <th style="padding:10px;">社團名稱</th>
                <th style="padding:10px;">招生對象</th>
                <th style="padding:10px;">上課時間</th>
                <th style="padding:10px;">上課地點</th>
                <th style="padding:10px;">指導師資</th>
                <th style="padding:10px;">開課備註</th>
                <th style="padding:10px;">3D 探索</th>
              </tr>
            </thead>
            <tbody>
              ${clubRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById("list-close-btn").onclick = () => {
      state.view = "panorama";
      sceneApi.setViewMode("panorama");
      renderListView();
      renderToolbar();
    };

    lv.querySelectorAll("[data-goto]").forEach((btn) => {
      btn.onclick = () => {
        state.view = "panorama";
        renderListView();
        selectIsland(btn.dataset.goto);
      };
    });
  }

  // =========================================================
  // 群島自動導覽 (Auto Tour)
  // =========================================================
  function startTour() {
    state.selected = null;
    state.view = "panorama";
    state.tour = { idx: 0, paused: false, progress: 0 };
    renderListView();
    renderPanel();
    syncTourIsland();
    renderTour();
    renderToolbar();
  }

  function stopTour() {
    state.tour = null;
    sceneApi.focusIsland(null, state.view);
    renderTour();
    renderToolbar();
  }

  function syncTourIsland() {
    if (!state.tour) return;
    const club = islands[state.tour.idx];
    sceneApi.focusIsland(club.id, "panorama");
    sceneApi.setHovered(club.id);
  }

  function stepTour(delta) {
    if (!state.tour) return;
    state.tour.idx = (state.tour.idx + delta + islands.length) % islands.length;
    state.tour.progress = 0;
    syncTourIsland();
    renderTour();
  }

  function renderTour() {
    const el = document.getElementById("tour-box");
    if (!state.tour) {
      el.classList.add("hidden");
      return;
    }
    el.classList.remove("hidden");
    const club = islands[state.tour.idx];
    el.style.setProperty("--c", club.color);

    el.innerHTML = `
      <div class="tour-bar"><i id="tour-prog-bar" style="width:${state.tour.progress}%"></i></div>
      <div class="tour-main">
        <div class="tour-text">
          <div class="tour-head">
            <span class="tour-step">${state.tour.idx + 1} / ${islands.length}</span>
            <span class="tour-kind">${club.badge}・📍${club.location}</span>
            ${state.tour.paused ? `<span style="color:#c0602a;font-weight:800;">已暫停</span>` : ""}
          </div>
          <h3>${club.name}</h3>
          <p class="tour-tag">👩‍🏫 ${club.teacher}｜🕒 ${club.scheduleText}</p>
          <p class="tour-scene">👀 ${club.sceneDesc}</p>
        </div>
        <div class="tour-ctrl">
          <button id="t-prev" title="上一座島">‹</button>
          <button id="t-pause" title="暫停／繼續">${state.tour.paused ? "▶" : "❚❚"}</button>
          <button id="t-next" title="下一座島">›</button>
          <button id="t-close" title="結束導覽">✕</button>
          <button id="t-detail" class="tour-more">查看社團詳情 ›</button>
        </div>
      </div>
      <div class="tour-dots">
        ${islands
          .map(
            (it, i) => `
          <button class="${i === state.tour.idx ? "on" : ""}" style="--c:${it.color}" data-tdot="${i}" title="${it.short}"></button>
        `
          )
          .join("")}
      </div>
    `;

    document.getElementById("t-prev").onclick = () => stepTour(-1);
    document.getElementById("t-next").onclick = () => stepTour(1);
    document.getElementById("t-pause").onclick = () => {
      state.tour.paused = !state.tour.paused;
      renderTour();
    };
    document.getElementById("t-close").onclick = () => stopTour();
    document.getElementById("t-detail").onclick = () => {
      const targetId = club.id;
      stopTour();
      selectIsland(targetId);
    };
    el.querySelectorAll("[data-tdot]").forEach((b) => {
      b.onclick = () => {
        state.tour.idx = Number(b.dataset.tdot);
        state.tour.progress = 0;
        syncTourIsland();
        renderTour();
      };
    });
  }

  setInterval(() => {
    if (state.tour && !state.tour.paused && state.animate) {
      state.tour.progress += 1.4;
      const bar = document.getElementById("tour-prog-bar");
      if (bar) bar.style.width = `${Math.min(100, state.tour.progress)}%`;
      if (state.tour.progress >= 100) {
        stepTour(1);
      }
    }
  }, 100);

  // =========================================================
  // 弹窗 1：全校平面圖互動導覽 (馬鳴平面.jpg)
  // =========================================================
  function openMapModal() {
    const wrap = document.getElementById("modal-wrap");
    wrap.classList.remove("hidden");
    wrap.innerHTML = `
      <div class="modal-card" style="width:min(880px, 100%);">
        <button class="x modal-close" id="modal-x">×</button>
        <p class="eyebrow">CAMPUS FLOORPLAN & SKY ISLAND MAP</p>
        <h2 style="margin:0 0 6px;font-size:22px;font-weight:900;">🗺️ 馬鳴國小校園平面圖 × 八大社團教室定位</h2>
        <p style="margin:0 0 12px;font-size:13.5px;color:var(--ink-2);">
          點擊平面圖上的任一社團座標標籤，即可立即駕駛鏡頭飛往該座 3D 社團浮空島！
        </p>
        <div class="floorplan-card">
          <img src="./馬鳴平面.jpg" alt="馬鳴國小平面圖" />
          ${islands
            .map(
              (it) => `
            <button
              class="fp-pin"
              style="left:${it.mapPin.x}%;top:${it.mapPin.y}%;--c:${it.color};"
              data-map-jump="${it.id}"
            >
              📍 ${it.short}（${it.location}）
            </button>
          `
            )
            .join("")}
        </div>
      </div>
    `;
    document.getElementById("modal-x").onclick = () => wrap.classList.add("hidden");
    wrap.onclick = (e) => {
      if (e.target === wrap) wrap.classList.add("hidden");
    };
    wrap.querySelectorAll("[data-map-jump]").forEach((btn) => {
      btn.onclick = () => {
        wrap.classList.add("hidden");
        state.view = "panorama";
        renderListView();
        selectIsland(btn.dataset.mapJump);
      };
    });
  }

  // =========================================================
  // 弹窗 2：社團適性小測驗 (Aptitude Quiz)
  // =========================================================
  function openQuizModal() {
    const wrap = document.getElementById("modal-wrap");
    wrap.classList.remove("hidden");
    renderQuizContent();
  }

  function renderQuizContent() {
    const wrap = document.getElementById("modal-wrap");
    const questions = window.MMPS_QUIZ;

    if (state.quizStep >= questions.length) {
      // 計算分數
      const scores = {};
      state.quizAnswers.forEach((ansIdx, qIdx) => {
        const weights = questions[qIdx].a[ansIdx][1];
        Object.entries(weights).forEach(([cid, w]) => {
          scores[cid] = (scores[cid] || 0) + w;
        });
      });
      const ranked = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      const topScore = ranked[0]?.[1] || 1;

      wrap.innerHTML = `
        <div class="modal-card" style="width:min(560px, 100%);">
          <button class="x modal-close" id="modal-x">×</button>
          <p class="eyebrow">APTITUDE RESULT</p>
          <h2 style="margin:0 0 12px;font-size:22px;font-weight:900;">🎉 最適合你的馬鳴社團浮空島是……</h2>
          <div style="display:grid;gap:10px;">
            ${ranked
              .map(([cid, sc], i) => {
                const club = islandMap[cid];
                const pct = Math.round((sc / topScore) * 100);
                return `
                <div style="border:2px solid ${i === 0 ? club.color : "var(--line)"};background:var(--paper-2);border-radius:14px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;">
                  <div>
                    <span style="background:${club.color};color:#fff;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:800;">推薦第 ${i + 1} 名・契合度 ${pct}%</span>
                    <h3 style="margin:6px 0 2px;font-size:18px;">${club.name}</h3>
                    <div style="font-size:12.5px;color:var(--ink-2);">📍 ${club.location}｜🕒 ${club.scheduleText}｜👩‍🏫 ${club.teacher}</div>
                  </div>
                  <button class="tour-btn" style="background:${club.color};padding:8px 14px;" data-quiz-go="${club.id}">飛去看看 ›</button>
                </div>
              `;
              })
              .join("")}
          </div>
          <div style="margin-top:16px;display:flex;justify-content:space-between;">
            <button class="tb" id="quiz-restart" style="background:var(--paper-2);">↻ 重新測驗</button>
            <button class="reg-btn" id="quiz-to-slip">📝 前往填寫報名回條 ›</button>
          </div>
        </div>
      `;

      document.getElementById("modal-x").onclick = () => wrap.classList.add("hidden");
      document.getElementById("quiz-restart").onclick = () => {
        state.quizStep = 0;
        state.quizAnswers = [];
        renderQuizContent();
      };
      document.getElementById("quiz-to-slip").onclick = () => {
        ranked.forEach(([cid]) => state.slip.selectedClubs.add(cid));
        openSlipModal();
      };
      wrap.querySelectorAll("[data-quiz-go]").forEach((b) => {
        b.onclick = () => {
          wrap.classList.add("hidden");
          selectIsland(b.dataset.quizGo);
        };
      });
      return;
    }

    const qObj = questions[state.quizStep];
    wrap.innerHTML = `
      <div class="modal-card" style="width:min(540px, 100%);">
        <button class="x modal-close" id="modal-x">×</button>
        <p class="eyebrow">馬鳴國小社團適性探索（第 ${state.quizStep + 1} / ${questions.length} 題）</p>
        <h2 style="margin:4px 0 12px;font-size:20px;font-weight:900;">${state.quizStep + 1}. ${qObj.q}</h2>
        <div class="opts">
          ${qObj.a
            .map(
              ([label], i) => `
            <button data-qans="${i}">${label}</button>
          `
            )
            .join("")}
        </div>
        ${
          state.quizStep > 0
            ? `<button class="tb" id="quiz-prev" style="background:var(--paper-2);">‹ 上一題</button>`
            : ""
        }
      </div>
    `;

    document.getElementById("modal-x").onclick = () => wrap.classList.add("hidden");
    const prevBtn = document.getElementById("quiz-prev");
    if (prevBtn) {
      prevBtn.onclick = () => {
        state.quizStep--;
        renderQuizContent();
      };
    }
    wrap.querySelectorAll("[data-qans]").forEach((btn) => {
      btn.onclick = () => {
        state.quizAnswers[state.quizStep] = Number(btn.dataset.qans);
        state.quizStep++;
        renderQuizContent();
      };
    });
  }

  // =========================================================
  // 弹窗 3：數位化「115-1社團活動人數調查表」報名回條與衝堂檢查器
  // =========================================================
  function openSlipModal() {
    const wrap = document.getElementById("modal-wrap");
    wrap.classList.remove("hidden");
    renderSlipContent();
  }

  function renderSlipContent() {
    const wrap = document.getElementById("modal-wrap");
    const gNum = Number(state.slip.grade);
    const clubList = islands.filter((i) => i.id !== "hub");

    // 檢查衝堂與年段資格提示
    const warnings = [];
    const sel = state.slip.selectedClubs;
    if (sel.has("taiko_jr") && sel.has("gigo")) {
      warnings.push("⚠️ 【時間重疊提醒】「太鼓初階（週三 13:50-14:50）」與「智高社團（週三 13:30-15:00）」同為週三下午時段，建議擇一報名。");
    }
    if (sel.has("rhythm") && sel.has("gigo")) {
      warnings.push("⚠️ 【時間部分重疊】「節奏樂社（週三 12:40-14:20）」與「智高社團（週三 13:30-15:00）」有 50 分鐘重疊。");
    }
    if (sel.has("rhythm") && sel.has("taiko_sr")) {
      warnings.push("✨ 【完美銜接組合】週三「節奏樂社（14:20下課）」可無縫接著上「太鼓進階（14:50上課）」！");
    }

    wrap.innerHTML = `
      <div class="modal-card" style="width:min(740px, 100%);">
        <button class="x modal-close" id="modal-x">×</button>
        <p class="eyebrow">DIGITAL REGISTRATION SLIP (115-1)</p>
        <h2 style="margin:0 0 4px;font-size:21px;font-weight:900;">📝 臺中市馬鳴國小 115 學年度社團活動報名回條試算</h2>
        <p style="margin:0 0 10px;font-size:13px;color:var(--ink-2);">
          可依孩子興趣複選（不限一項），系統自動幫您檢查「年級資格」與「上課時間是否衝堂」，並可一鍵列印回條於 <b>9/7(一)前</b> 交回學務處！
        </p>

        <div class="slip-form" id="printable-slip">
          <div style="text-align:center;font-weight:900;font-size:16px;margin-bottom:10px;border-bottom:1px dashed var(--line);padding-bottom:6px;">
            臺中市馬鳴國小 115 學年度社團活動調查表回條
          </div>
          <div class="slip-inputs">
            <label>
              年級選擇
              <select id="slip-grade">
                <option value="1" ${gNum === 1 ? "selected" : ""}>一年級（低年級）</option>
                <option value="2" ${gNum === 2 ? "selected" : ""}>二年級（低年級）</option>
                <option value="3" ${gNum === 3 ? "selected" : ""}>三年級（中年級）</option>
                <option value="4" ${gNum === 4 ? "selected" : ""}>四年級（中年級）</option>
                <option value="5" ${gNum === 5 ? "selected" : ""}>五年級（高年級）</option>
                <option value="6" ${gNum === 6 ? "selected" : ""}>六年級（高年級）</option>
              </select>
            </label>
            <label>
              班級名稱
              <input type="text" id="slip-cls" value="${state.slip.cls}" placeholder="例：一年甲班" />
            </label>
            <label>
              座號
              <input type="text" id="slip-seat" value="${state.slip.seat}" placeholder="例：1" />
            </label>
            <label>
              學生姓名
              <input type="text" id="slip-name" value="${state.slip.name}" placeholder="請輸入學生姓名" />
            </label>
          </div>

          <div style="font-size:13px;font-weight:800;margin-bottom:8px;">
            經過我的審慎考慮後，這學期我想參加（已勾選 <span style="color:var(--accent);">${sel.size}</span> 項）：
          </div>

          <div class="slip-checks">
            ${clubList
              .map((c, i) => {
                const eligible = c.gradeCodes.includes(gNum);
                const checked = sel.has(c.id) && eligible;
                return `
                <label class="slip-item ${checked ? "checked" : ""} ${!eligible ? "disabled" : ""}">
                  <input type="checkbox" data-slip-club="${c.id}" ${checked ? "checked" : ""} ${!eligible ? "disabled" : ""} />
                  <div>
                    <div style="font-weight:800;font-size:13.5px;">${i + 1}、${c.short}</div>
                    <div style="font-size:11px;color:var(--ink-2);">📍${c.location}｜${c.scheduleText.replace("星期", "週")}</div>
                    ${!eligible ? `<div style="font-size:10.5px;color:#d62828;font-weight:700;">（限 ${c.gradeTarget}）</div>` : ""}
                  </div>
                </label>
              `;
              })
              .join("")}
          </div>

          ${
            warnings.length > 0
              ? `
            <div class="notice-box" style="margin-top:12px;">
              ${warnings.join("<br/>")}
            </div>
          `
              : ""
          }

          <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:var(--ink-2);border-top:1px dashed var(--line);padding-top:10px;">
            <span>★ 社團活動均免收費用 ★ 學習扶助優先</span>
            <span style="font-weight:800;">家長簽名：___________________</span>
          </div>
        </div>

        <div style="margin-top:14px;display:flex;justify-content:flex-end;gap:8px;">
          <button class="tb" id="slip-close" style="background:var(--paper-2);">繼續瀏覽群島</button>
          <button class="reg-btn" id="slip-print">🖨️ 列印回條／儲存意願</button>
        </div>
      </div>
    `;

    document.getElementById("modal-x").onclick = () => wrap.classList.add("hidden");
    document.getElementById("slip-close").onclick = () => wrap.classList.add("hidden");

    document.getElementById("slip-grade").onchange = (e) => {
      state.slip.grade = e.target.value;
      const gn = Number(e.target.value);
      const cn = ["一", "二", "三", "四", "五", "六"][gn - 1];
      state.slip.cls = `${cn}年甲班`;
      // 移除不符合年級的勾選
      clubList.forEach((c) => {
        if (!c.gradeCodes.includes(gn)) state.slip.selectedClubs.delete(c.id);
      });
      renderSlipContent();
    };
    document.getElementById("slip-cls").oninput = (e) => (state.slip.cls = e.target.value);
    document.getElementById("slip-seat").oninput = (e) => (state.slip.seat = e.target.value);
    document.getElementById("slip-name").oninput = (e) => (state.slip.name = e.target.value);

    wrap.querySelectorAll("[data-slip-club]").forEach((cb) => {
      cb.onchange = () => {
        const cid = cb.dataset.slipClub;
        if (cb.checked) state.slip.selectedClubs.add(cid);
        else state.slip.selectedClubs.delete(cid);
        renderSlipContent();
      };
    });

    document.getElementById("slip-print").onclick = () => {
      showToast("✅ 已儲存報名意願！正在呼叫瀏覽器列印回條…");
      setTimeout(() => window.print(), 300);
    };
  }

  // =========================================================
  // 底部工具列渲染與綁定
  // =========================================================
  function renderToolbar() {
    const timeLabels = {
      auto: "🕒 即時天色",
      day: "☀️ 白天",
      dusk: "🌇 黃昏",
      night: "🌙 星夜"
    };

    document.getElementById("tb-panorama").classList.toggle("on", state.view === "panorama");
    document.getElementById("tb-bird").classList.toggle("on", state.view === "bird");
    document.getElementById("tb-list").classList.toggle("on", state.view === "list");
    document.getElementById("tb-labels").classList.toggle("on", state.showLabels);
    document.getElementById("tb-links").classList.toggle("on", state.showLinks);
    document.getElementById("tb-anim").classList.toggle("on", !state.animate);
    document.getElementById("tb-anim").textContent = state.animate ? "暫停" : "播放";
    document.getElementById("tb-time").classList.toggle("on", state.timeMode !== "auto");
    document.getElementById("tb-time").textContent = timeLabels[state.timeMode];
    document.getElementById("tb-fx").classList.toggle("on", state.fx);
    document.getElementById("tb-log").classList.toggle("on", state.showLog);
    document.getElementById("btn-roam").classList.toggle("on", state.roam);
    document.getElementById("btn-tour").classList.toggle("on", !!state.tour);
    document.getElementById("btn-tour").textContent = state.tour ? "⏹ 結束導覽" : "✈️ 群島導覽";

    document.getElementById("legend-card").classList.toggle(
      "hidden",
      !state.showLinks || !!state.selected
    );
  }

  // =========================================================
  // 啟動入口
  // =========================================================
  window.addEventListener("DOMContentLoaded", () => {
    const stageEl = document.getElementById("stage-canvas");
    const labelLayerEl = document.getElementById("label-layer");

    sceneApi = window.initMMPS3DScene(stageEl, labelLayerEl, {
      onSelectIsland(id) {
        selectIsland(id);
      },
      onHoverIsland(id) {
        state.hovered = id;
        sceneApi.setHovered(id);
      },
      onFindMascot(islandId) {
        const club = islandMap[islandId];
        const isNew = !state.foundMascots.has(islandId);
        state.foundMascots.add(islandId);
        document.getElementById("mascot-count").textContent = state.foundMascots.size;
        showToast(
          isNew
            ? `🦄 找到躲在「${club.short}」的馬鳴小天馬！（${state.foundMascots.size} / ${islands.length}）`
            : `🦄 「${club.short}」的小天馬開心地向你揮手！`
        );
      },
      onPlayerNearIsland(islandId) {
        state.currentNearIsland = islandId;
        const club = islandMap[islandId];
        const txt = document.getElementById("roam-near-text");
        const actBtn = document.getElementById("roam-action-btn");
        if (club && islandId !== "hub") {
          txt.textContent = `📍 已抵達【${club.short}】（${club.location}）`;
          actBtn.style.display = "inline-block";
          actBtn.textContent = `探索 ${club.short} (E)`;
        } else {
          txt.textContent = `📍 目前在【馬鳴主島・行政中心】`;
          actBtn.style.display = "none";
        }
      },
      onPlayerInteract(islandId) {
        if (islandId && islandId !== "hub") {
          selectIsland(islandId);
        }
      }
    });

    // 初始化時間主題與即時上課狀態
    sceneApi.setTimeTheme(resolveTimeTheme(state.timeMode));
    sceneApi.setLiveIslands(resolveLiveClubIds());

    renderQuote();
    updateClock();
    setInterval(updateClock, 15000);
    fetchWaipuWeather();
    renderLiveLog();
    renderToolbar();

    // 綁定名言換句
    document.getElementById("quote-next").onclick = () => {
      state.quoteIdx = (state.quoteIdx + 1) % window.MMPS_QUOTES.length;
      renderQuote();
    };

    // 綁定底部工具列按鈕
    document.getElementById("tb-panorama").onclick = () => {
      state.view = "panorama";
      state.selected = null;
      sceneApi.setSelected(null);
      sceneApi.setViewMode("panorama");
      renderListView();
      renderPanel();
      renderLiveLog();
      renderToolbar();
    };

    document.getElementById("tb-bird").onclick = () => {
      state.view = "bird";
      state.selected = null;
      sceneApi.setSelected(null);
      sceneApi.setViewMode("bird");
      renderListView();
      renderPanel();
      renderLiveLog();
      renderToolbar();
    };

    document.getElementById("tb-list").onclick = () => {
      state.view = state.view === "list" ? "panorama" : "list";
      renderListView();
      renderToolbar();
    };

    document.getElementById("tb-labels").onclick = () => {
      state.showLabels = !state.showLabels;
      sceneApi.setShowLabels(state.showLabels);
      renderToolbar();
    };

    document.getElementById("tb-links").onclick = () => {
      state.showLinks = !state.showLinks;
      sceneApi.setShowLinks(state.showLinks);
      renderToolbar();
    };

    document.getElementById("tb-map").onclick = () => openMapModal();

    document.getElementById("tb-anim").onclick = () => {
      state.animate = !state.animate;
      sceneApi.animateEnabled = state.animate;
      renderToolbar();
    };

    document.getElementById("tb-time").onclick = () => {
      const order = ["auto", "day", "dusk", "night"];
      state.timeMode = order[(order.indexOf(state.timeMode) + 1) % order.length];
      sceneApi.setTimeTheme(resolveTimeTheme(state.timeMode));
      renderToolbar();
    };

    document.getElementById("tb-fx").onclick = () => {
      state.fx = !state.fx;
      document.getElementById("tilt-shift").classList.toggle("off", !state.fx);
      renderToolbar();
    };

    document.getElementById("tb-log").onclick = () => {
      state.showLog = !state.showLog;
      renderLiveLog();
      renderToolbar();
    };

    document.getElementById("btn-tour").onclick = () => {
      if (state.tour) stopTour();
      else startTour();
    };

    // 漫遊模式切換與控制
    function setRoamMode(active) {
      state.roam = active;
      sceneApi.setRoamMode(active);
      document.getElementById("btn-roam").classList.toggle("on", active);
      document.getElementById("roam-hud").classList.toggle("hidden", !active);
      const isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 780;
      document.getElementById("virtual-controls").classList.toggle("hidden", !active || !isMobile);
      if (active) {
        showToast("🎮 已進入漫遊模式！使用鍵盤 WASD 移動、空白鍵跳躍");
      }
    }

    document.getElementById("btn-roam").onclick = () => {
      setRoamMode(!state.roam);
    };

    document.getElementById("roam-exit-btn").onclick = () => {
      setRoamMode(false);
    };

    document.getElementById("roam-action-btn").onclick = () => {
      if (state.currentNearIsland && state.currentNearIsland !== "hub") {
        selectIsland(state.currentNearIsland);
      }
    };

    // 虛擬搖桿與按鈕
    const bindVKey = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        sceneApi.setVirtualInput(key, true);
      });
      el.addEventListener("pointerup", (e) => {
        e.preventDefault();
        sceneApi.setVirtualInput(key, false);
      });
      el.addEventListener("pointerleave", (e) => {
        sceneApi.setVirtualInput(key, false);
      });
    };

    bindVKey("v-up", "forward");
    bindVKey("v-down", "backward");
    bindVKey("v-left", "left");
    bindVKey("v-right", "right");
    bindVKey("v-jump", "jump");

    const vInteract = document.getElementById("v-interact");
    if (vInteract) {
      vInteract.onclick = () => {
        if (state.currentNearIsland && state.currentNearIsland !== "hub") {
          selectIsland(state.currentNearIsland);
        }
      };
    }

    document.getElementById("btn-quiz").onclick = () => openQuizModal();
    document.getElementById("btn-slip").onclick = () => openSlipModal();

    // 鍵盤快捷鍵支援
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.key === "Escape") {
        document.getElementById("modal-wrap").classList.add("hidden");
        if (state.tour) stopTour();
        else if (state.selected) selectIsland(null);
      } else if (e.key === "ArrowRight" && state.selected) {
        const idx = islands.findIndex((i) => i.id === state.selected);
        selectIsland(islands[(idx + 1) % islands.length].id);
      } else if (e.key === "ArrowLeft" && state.selected) {
        const idx = islands.findIndex((i) => i.id === state.selected);
        selectIsland(islands[(idx - 1 + islands.length) % islands.length].id);
      }
    });

    // 開場組裝動畫 (Intro Splash)
    const steps = [
      "凝聚天空之城飛行石能量…",
      "雕琢九座微縮社團浮空島…",
      "架設雲海空橋與 DOC 智高創客中心…",
      "請全校師生與小天馬就位…",
      "歡迎來到馬鳴國小社團群島！"
    ];
    const introEl = document.getElementById("intro-screen");
    const barEl = document.getElementById("intro-bar-fill");
    const stepEl = document.getElementById("intro-step-text");
    let sIdx = 0;
    const introTimer = setInterval(() => {
      sIdx++;
      if (sIdx < steps.length) {
        barEl.style.width = `${((sIdx + 1) / steps.length) * 100}%`;
        stepEl.textContent = steps[sIdx];
      } else {
        clearInterval(introTimer);
        introEl.classList.add("leave");
      }
    }, 420);

    document.getElementById("intro-skip").onclick = () => {
      clearInterval(introTimer);
      introEl.classList.add("leave");
    };
  });
})();
