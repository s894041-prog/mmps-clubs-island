// 馬鳴國小・天空打字群島 - 互動 UI、打字闖關引擎、十指虛擬鍵盤、音效與排行榜系統
(function () {
  const PROFILE_KEY = "mmps_player_profile";
  const RECORDS_KEY = "mmps_typing_records_v1";

  // =========================================================
  // 1. Web Audio 合成音效系統（免外部音檔、零延遲）
  // =========================================================
  class SoundFX {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }
    playHit(combo = 1) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const baseFreq = 520 + Math.min(combo, 20) * 18;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.065);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }
    playMiss() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.linearRampToValueAtTime(135, now + 0.11);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    }
    playWordClear() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      });
    }
    playFanfare(stars = 1) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const seq =
        stars >= 3
          ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
          : stars === 2
          ? [523.25, 659.25, 783.99, 1046.5]
          : [440, 554.37, 659.25];
      seq.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      });
    }
  }

  const sfx = new SoundFX();

  // =========================================================
  // 2. 玩家設定檔與闖關紀錄管理 (localStorage)
  // =========================================================
  function loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        return {
          name: p.name || "馬鳴小騎士",
          title: p.title || "三年級打字冒險家",
          shirtColor: p.shirtColor || "#3a86ff",
          hatColor: p.hatColor || "#fbbf24",
          badgeColor: p.badgeColor || "#2a9d8f"
        };
      }
    } catch (e) {}
    return {
      name: "馬鳴小騎士",
      title: "三年級打字冒險家",
      shirtColor: "#3a86ff",
      hatColor: "#fbbf24",
      badgeColor: "#2a9d8f"
    };
  }

  function saveProfile(profile) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {}
  }

  function loadRecords() {
    try {
      const raw = localStorage.getItem(RECORDS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }

  function saveRecords(records) {
    try {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    } catch (e) {}
  }

  // =========================================================
  // 3. 題目拆解為「逐鍵指導序列」工具
  // =========================================================
  function buildKeystrokeSteps(island, promptObj) {
    const mode = island.mode;
    const targetStr = promptObj.target;
    const steps = [];

    // 單鍵定位 (island1) 或 26 英文字母 (island2)
    if (mode === "key_drill" || mode === "en_word") {
      for (const ch of targetStr) {
        if (ch === " ") {
          const sp = window.CODE_TO_KEYOBJ["Space"];
          steps.push({
            displayChar: "␣",
            zyChar: "",
            code: "Space",
            keyObj: sp,
            needShift: false,
            charGroup: " "
          });
          continue;
        }
        const isUpper = ch >= "A" && ch <= "Z" && mode === "en_word";
        const keyObj = window.EN_TO_KEYOBJ[ch.toUpperCase()] || window.EN_TO_KEYOBJ[ch.toLowerCase()];
        if (keyObj) {
          steps.push({
            displayChar: ch,
            zyChar: keyObj.zy || "",
            code: keyObj.code,
            keyObj,
            needShift: isUpper,
            charGroup: ch
          });
        }
      }
      return steps;
    }

    // 單一注音符號鍵位 (island4)
    if (mode === "zy_key") {
      for (const zy of targetStr) {
        const keyObj = window.ZY_TO_KEYOBJ[zy];
        if (keyObj) {
          steps.push({
            displayChar: zy,
            zyChar: zy,
            code: keyObj.code,
            keyObj,
            needShift: false,
            charGroup: zy
          });
        }
      }
      return steps;
    }

    // 中文單字、語詞、短句、魔王混合 (island5 ~ island8)
    for (let i = 0; i < targetStr.length; i++) {
      const ch = targetStr[i];
      if (ch === " ") continue;

      // 先檢查是否為英數符號
      if (/^[A-Za-z0-9]$/.test(ch)) {
        const isUpper = ch >= "A" && ch <= "Z";
        const keyObj = window.EN_TO_KEYOBJ[ch.toUpperCase()] || window.EN_TO_KEYOBJ[ch];
        if (keyObj) {
          steps.push({
            displayChar: ch,
            zyChar: keyObj.en,
            code: keyObj.code,
            keyObj,
            needShift: isUpper,
            charGroup: ch,
            charIndex: i
          });
        }
        continue;
      }

      // 中文字：查詢注音拆碼
      let zySpell = window.CHAR_ZHUYIN_DICT[ch];
      if (!zySpell && promptObj.zy && targetStr.length === 1) {
        zySpell = promptObj.zy;
      }
      if (!zySpell) {
        zySpell = "ㄇㄚˉ";
      }

      for (const z of zySpell) {
        const keyObj = window.ZY_TO_KEYOBJ[z];
        if (keyObj) {
          steps.push({
            displayChar: z === "ˉ" ? "ˉ(空白)" : z,
            zyChar: z,
            code: keyObj.code,
            keyObj,
            needShift: false,
            charGroup: ch,
            charIndex: i,
            fullZy: zySpell
          });
        }
      }
    }
    return steps;
  }

  // =========================================================
  // 4. 主程式初始化
  // =========================================================
  window.addEventListener("DOMContentLoaded", () => {
    let profile = loadProfile();
    let records = loadRecords();
    let selectedIslandId = "hub";
    let sceneApi = null;

    // DOM 參考
    const stageEl = document.getElementById("canvas-stage");
    const labelLayerEl = document.getElementById("label-layer");
    const missionListEl = document.getElementById("mission-list");
    const dockEl = document.getElementById("island-dock");
    const totalStarsEl = document.getElementById("total-stars-count");
    const detailPanelEl = document.getElementById("detail-panel");
    const detailContentEl = document.getElementById("detail-content");

    // 啟動 3D 場景
    sceneApi = window.initMMPS3DScene(stageEl, labelLayerEl, {
      onSelectIsland(id) {
        selectIsland(id, true);
      },
      onHoverIsland() {},
      onPlayerNearIsland(id) {
        selectIsland(id, false);
        updateRoamProximityBanner(id);
      }
    });

    sceneApi.updatePlayerCustom(profile);

    // 計算星星與更新 UI
    function getStarsMap() {
      const map = {};
      window.MMPS_ISLANDS.forEach((isl) => {
        if (isl.id === "hub") return;
        map[isl.id] = (records[isl.id] && records[isl.id].bestStars) || 0;
      });
      return map;
    }

    function getTotalStars() {
      const map = getStarsMap();
      return Object.values(map).reduce((a, b) => a + b, 0);
    }

    function refreshProgressUI() {
      const starsMap = getStarsMap();
      const total = getTotalStars();
      if (totalStarsEl) totalStarsEl.textContent = `${total} / 24`;
      sceneApi.updateIslandStars(starsMap);
      renderMissionSidebar(starsMap);
      renderBottomDock(starsMap);
      updateProfileUI();
    }

    function updateProfileUI() {
      const topName = document.getElementById("top-player-name");
      const topDot = document.getElementById("top-player-dot");
      if (topName) topName.textContent = profile.name;
      if (topDot) topDot.style.background = profile.shirtColor;
      sceneApi.updatePlayerCustom(profile);
    }

    // 渲染左側「小三打字闖關地圖」清單
    function renderMissionSidebar(starsMap) {
      if (!missionListEl) return;
      missionListEl.innerHTML = "";
      window.MMPS_ISLANDS.forEach((isl) => {
        const item = document.createElement("button");
        item.className = "mission-item" + (isl.id === selectedIslandId ? " active" : "");
        const st = starsMap[isl.id] || 0;
        const starStr = isl.id === "hub" ? "🏰 主島" : st > 0 ? "⭐".repeat(st) : "☆☆☆";
        const bestScore = records[isl.id] ? records[isl.id].bestScore : null;
        item.innerHTML = `
          <span class="m-dot" style="background:${isl.color}"></span>
          <div class="m-info">
            <div class="m-title">${isl.short}</div>
            <div class="m-sub">${isl.badge}${bestScore !== null ? `｜最佳 ${bestScore}${isl.unit}` : ""}</div>
          </div>
          <span class="m-stars">${starStr}</span>
        `;
        item.addEventListener("click", () => {
          selectIsland(isl.id, true);
          if (sceneApi.roamMode) {
            sceneApi.teleportPlayerToIsland(isl.id);
            updateRoamProximityBanner(isl.id);
          }
        });
        missionListEl.appendChild(item);
      });
    }

    // 渲染底部快速導覽列
    function renderBottomDock(starsMap) {
      if (!dockEl) return;
      dockEl.innerHTML = "";
      window.MMPS_ISLANDS.forEach((isl) => {
        const btn = document.createElement("button");
        btn.className = "dock-btn" + (isl.id === selectedIslandId ? " active" : "");
        const st = starsMap[isl.id] || 0;
        btn.innerHTML = `
          <span class="dock-dot" style="background:${isl.color}"></span>
          <span>${isl.short}</span>
          ${isl.id !== "hub" && st > 0 ? `<span class="dock-star">${"⭐".repeat(st)}</span>` : ""}
        `;
        btn.addEventListener("click", () => {
          selectIsland(isl.id, true);
          if (sceneApi.roamMode) {
            sceneApi.teleportPlayerToIsland(isl.id);
            updateRoamProximityBanner(isl.id);
          }
        });
        dockEl.appendChild(btn);
      });
    }

    // 選擇島嶼並開啟右側詳情與英雄榜面板
    function selectIsland(id, moveCamera = true) {
      selectedIslandId = id || "hub";
      sceneApi.setSelected(selectedIslandId);
      if (moveCamera && !sceneApi.roamMode) {
        sceneApi.focusIsland(selectedIslandId);
      }
      const starsMap = getStarsMap();
      renderMissionSidebar(starsMap);
      renderBottomDock(starsMap);
      renderIslandDetail(selectedIslandId);
    }

    // 建立單島排行榜（合併玩家最佳紀錄與小三 NPC 基準）
    function getIslandLeaderboard(island) {
      const list = (island.npcBenchmarks || []).map((n) => ({
        name: n.name,
        score: n.score,
        stars: n.stars,
        acc: n.acc,
        detail: n.detail,
        isPlayer: false
      }));

      const rec = records[island.id];
      if (rec && rec.bestScore > 0) {
        list.push({
          name: `👑 ${profile.name}（你）`,
          score: rec.bestScore,
          stars: rec.bestStars,
          acc: rec.bestAcc,
          detail: `${rec.bestScore} ${island.unit}｜正確率 ${rec.bestAcc}%`,
          isPlayer: true
        });
      }
      list.sort((a, b) => b.score - a.score || b.acc - a.acc);
      return list;
    }

    function renderIslandDetail(islandId) {
      const island = window.MMPS_ISLANDS_MAP[islandId] || window.MMPS_ISLANDS[0];
      if (!detailContentEl) return;
      detailPanelEl.classList.remove("hidden");

      const rec = records[island.id];
      const board = getIslandLeaderboard(island);

      const tipsHtml = (island.tips || [])
        .map((t) => `<li>${t}</li>`)
        .join("");

      const boardHtml = board
        .map(
          (row, idx) => `
          <div class="lb-row ${row.isPlayer ? "is-player" : ""}">
            <span class="lb-rank">#${idx + 1}</span>
            <div class="lb-main">
              <div class="lb-name">${row.name}</div>
              <div class="lb-detail">${row.detail}</div>
            </div>
            <span class="lb-stars">${"⭐".repeat(row.stars || 1)}</span>
          </div>
        `
        )
        .join("");

      const isHub = island.id === "hub";
      const thresholdBadges = !isHub
        ? `
        <div class="benchmark-grid">
          <div class="bm-card bronze">
            <div class="bm-star">⭐ 銅星及格</div>
            <div class="bm-val">${island.thresholds.bronze} ${island.unit}</div>
          </div>
          <div class="bm-card silver">
            <div class="bm-star">⭐⭐ 銀星熟練</div>
            <div class="bm-val">${island.thresholds.silver} ${island.unit}</div>
          </div>
          <div class="bm-card gold">
            <div class="bm-star">⭐⭐⭐ 金星高手</div>
            <div class="bm-val">${island.thresholds.gold} ${island.unit}</div>
          </div>
        </div>
        <div class="bm-note">⏱️ 測驗時間：<b>${island.duration} 秒</b>｜🎯 過關正確率門檻：<b>≥ ${island.thresholds.minAcc}%</b></div>
      `
        : `
        <div class="hub-summary-card">
          <div class="hub-stat">
            <span>目前總星數</span>
            <strong>⭐ ${getTotalStars()} / 24</strong>
          </div>
          <div class="hub-stat">
            <span>已過關島嶼</span>
            <strong>🏝️ ${Object.values(getStarsMap()).filter((v) => v > 0).length} / 8 座</strong>
          </div>
        </div>
      `;

      const myRecordHtml =
        !isHub && rec
          ? `
        <div class="my-best-banner">
          <span>🏆 你的最佳紀錄：<b>${rec.bestScore} ${island.unit}</b>（正確率 ${rec.bestAcc}%）</span>
          <span>${"⭐".repeat(rec.bestStars)}</span>
        </div>
      `
          : !isHub
          ? `<div class="my-best-banner empty">🌱 你還沒挑戰過這座島嶼，快按下方按鈕開始闖關吧！</div>`
          : "";

      detailContentEl.innerHTML = `
        <div class="dp-header" style="border-left: 5px solid ${island.color}">
          <div class="dp-badge-row">
            <span class="dp-badge" style="background:${island.color}">${island.badge}</span>
            <span class="dp-cat">${island.category}</span>
          </div>
          <h2 class="dp-title">${island.name}</h2>
          <p class="dp-tagline">${island.tagline}</p>
        </div>

        ${myRecordHtml}

        <div class="dp-cta-group">
          <button id="btn-launch-typing" class="btn-primary-launch" style="background: linear-gradient(135deg, ${island.color}, #1d4ed8)">
            ${isHub ? "🎯 進入主島熱身練習（基準鍵體驗）" : `🎮 開始挑戰【${island.short}】（${island.duration}秒）`}
          </button>
          ${
            isHub
              ? `<button id="btn-open-cert" class="btn-secondary-cert">🏆 檢視全島總榜 ＆ 列印打字榮譽證書</button>`
              : `<button id="btn-teleport-here" class="btn-secondary-cert">🏃 傳送我的人物到這座島上</button>`
          }
        </div>

        <div class="dp-section">
          <h3>📏 國小三年級過關基準</h3>
          ${thresholdBadges}
        </div>

        <div class="dp-section">
          <h3>💡 小三打字小撇步</h3>
          <ul class="dp-tips">${tipsHtml}</ul>
        </div>

        <div class="dp-section">
          <h3>🏅 本島英雄排行榜（含小三基準守衛）</h3>
          <div class="lb-list">${boardHtml}</div>
        </div>
      `;

      const launchBtn = document.getElementById("btn-launch-typing");
      if (launchBtn) {
        launchBtn.addEventListener("click", () => {
          openTypingCockpit(isHub ? "island1" : island.id);
        });
      }

      const certBtn = document.getElementById("btn-open-cert");
      if (certBtn) {
        certBtn.addEventListener("click", () => openCertificateModal());
      }

      const tpBtn = document.getElementById("btn-teleport-here");
      if (tpBtn) {
        tpBtn.addEventListener("click", () => {
          enableRoamWithIsland(island.id);
        });
      }
    }

    // =========================================================
    // 5. 虛擬十指鍵盤渲染器 (支援英數 + 臺灣大千注音 + Shift/空白鍵)
    // =========================================================
    const vkContainer = document.getElementById("vk-rows-container");
    const vkFingerBanner = document.getElementById("vk-finger-banner");
    const vkKeyElements = {};

    function initVirtualKeyboard() {
      if (!vkContainer) return;
      vkContainer.innerHTML = "";

      window.KEYBOARD_ROWS.forEach((row, rIdx) => {
        const rowEl = document.createElement("div");
        rowEl.className = `vk-row vk-row-${rIdx}`;
        row.forEach((k) => {
          const fInfo = window.FINGER_MAP[k.finger] || { color: "#64748b", short: "" };
          const keyEl = document.createElement("div");
          keyEl.className = "vk-key" + (k.home ? " is-home" : "") + (k.bump ? " has-bump" : "");
          keyEl.dataset.code = k.code;
          keyEl.style.setProperty("--finger-color", fInfo.color);
          keyEl.innerHTML = `
            <span class="vk-en">${k.en}</span>
            <span class="vk-zy">${k.zy || ""}</span>
            ${k.bump ? `<span class="vk-bump-bar"></span>` : ""}
          `;
          rowEl.appendChild(keyEl);
          vkKeyElements[k.code] = keyEl;
        });
        vkContainer.appendChild(rowEl);
      });

      // 第 5 排：左右 Shift 與 空白鍵（一聲）
      const bottomRow = document.createElement("div");
      bottomRow.className = "vk-row vk-row-bottom";

      const shiftL = document.createElement("div");
      shiftL.className = "vk-key vk-wide";
      shiftL.dataset.code = "ShiftLeft";
      shiftL.style.setProperty("--finger-color", window.FINGER_MAP.L5.color);
      shiftL.innerHTML = `<span class="vk-en">⇧ Shift</span><span class="vk-zy">大寫切換</span>`;

      const spaceEl = document.createElement("div");
      spaceEl.className = "vk-key vk-space";
      spaceEl.dataset.code = "Space";
      spaceEl.style.setProperty("--finger-color", window.FINGER_MAP.THUMB.color);
      spaceEl.innerHTML = `<span class="vk-en">Space 空白鍵</span><span class="vk-zy">一聲 ˉ（雙手大拇指）</span>`;

      const shiftR = document.createElement("div");
      shiftR.className = "vk-key vk-wide";
      shiftR.dataset.code = "ShiftRight";
      shiftR.style.setProperty("--finger-color", window.FINGER_MAP.R5.color);
      shiftR.innerHTML = `<span class="vk-en">⇧ Shift</span><span class="vk-zy">大寫切換</span>`;

      bottomRow.appendChild(shiftL);
      bottomRow.appendChild(spaceEl);
      bottomRow.appendChild(shiftR);
      vkContainer.appendChild(bottomRow);

      vkKeyElements["ShiftLeft"] = shiftL;
      vkKeyElements["ShiftRight"] = shiftR;
      vkKeyElements["Space"] = spaceEl;
    }

    function highlightVirtualKey(stepObj) {
      Object.values(vkKeyElements).forEach((el) => {
        el.classList.remove("target", "shift-target");
      });
      if (!stepObj) {
        if (vkFingerBanner) vkFingerBanner.textContent = "準備開始！請把左右食指放在 F 與 J 定位鍵上";
        return;
      }

      const targetEl = vkKeyElements[stepObj.code];
      if (targetEl) targetEl.classList.add("target");

      if (stepObj.needShift) {
        if (vkKeyElements["ShiftLeft"]) vkKeyElements["ShiftLeft"].classList.add("shift-target");
        if (vkKeyElements["ShiftRight"]) vkKeyElements["ShiftRight"].classList.add("shift-target");
      }

      const fInfo = (stepObj.keyObj && window.FINGER_MAP[stepObj.keyObj.finger]) || window.FINGER_MAP.THUMB;
      const bumpNote = stepObj.keyObj && stepObj.keyObj.bump ? "（凸點定位鍵）" : "";
      const shiftNote = stepObj.needShift ? "先按住【⇧ Shift】不放，再" : "";
      const zyLabel = stepObj.keyObj && stepObj.keyObj.zy ? `｜注音：【${stepObj.keyObj.zy}】` : "";

      if (vkFingerBanner) {
        vkFingerBanner.innerHTML = `
          🖐️ 請${shiftNote}用 <strong style="color:${fInfo.color}">【${fInfo.name}】</strong>
          按下鍵盤 <kbd>${stepObj.keyObj ? stepObj.keyObj.en : stepObj.code}</kbd> 鍵 ${bumpNote} ${zyLabel}
        `;
      }
    }

    initVirtualKeyboard();

    // =========================================================
    // 6. 打字闖關座艙引擎 (#typing-cockpit)
    // =========================================================
    const cockpitEl = document.getElementById("typing-cockpit");
    const cpTitleEl = document.getElementById("cp-island-title");
    const cpRuleEl = document.getElementById("cp-rule-desc");
    const cpTimerEl = document.getElementById("cp-timer");
    const cpScoreEl = document.getElementById("cp-score");
    const cpAccEl = document.getElementById("cp-acc");
    const cpComboEl = document.getElementById("cp-combo");
    const cpStarsLiveEl = document.getElementById("cp-stars-live");
    const cpTargetBigEl = document.getElementById("cp-target-big");
    const cpZyStepsEl = document.getElementById("cp-zy-steps");
    const cpHintEl = document.getElementById("cp-hint-text");
    const cpImeWrapEl = document.getElementById("cp-ime-wrap");
    const cpImeInputEl = document.getElementById("cp-ime-input");
    const cpModeToggleEl = document.getElementById("cp-mode-toggle");
    const cpResultOverlayEl = document.getElementById("cp-result-overlay");

    let game = {
      active: false,
      island: null,
      inputMode: "guided", // "guided" (注音/按鍵直通導引) | "ime" (真實中文輸入框)
      timeLeft: 60,
      timerId: null,
      promptQueue: [],
      currentPrompt: null,
      steps: [],
      stepIndex: 0,
      completedCount: 0, // 完成的題數/字數/鍵數 (依 island.mode 計分)
      correctKeys: 0,
      totalKeys: 0,
      combo: 0,
      maxCombo: 0
    };

    function shuffleArray(arr) {
      const copy = arr.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    function openTypingCockpit(islandId) {
      const island = window.MMPS_ISLANDS_MAP[islandId] || window.MMPS_ISLANDS[1];
      game.island = island;
      game.active = true;
      sceneApi.typingActive = true;

      // 預設使用「注音/按鍵導引直通車」，小三學生不需煩惱輸入法切換也能練習每個注音按鍵
      game.inputMode = "guided";
      updateModeToggleUI();

      cockpitEl.classList.remove("hidden");
      cpResultOverlayEl.classList.add("hidden");

      startRound();
    }

    function closeTypingCockpit() {
      game.active = false;
      sceneApi.typingActive = false;
      if (game.timerId) clearInterval(game.timerId);
      game.timerId = null;
      cockpitEl.classList.add("hidden");
      refreshProgressUI();
      renderIslandDetail(selectedIslandId);
    }

    function isChineseModeIsland(island) {
      return ["zh_char", "zh_word", "zh_sentence", "mixed_boss"].includes(island.mode);
    }

    function updateModeToggleUI() {
      if (!game.island) return;
      const canSwitchIme = isChineseModeIsland(game.island);
      if (cpModeToggleEl) {
        cpModeToggleEl.style.display = canSwitchIme ? "inline-flex" : "none";
        cpModeToggleEl.textContent =
          game.inputMode === "guided"
            ? "🎯 目前：注音按鍵導引模式（免切輸入法）｜點此切換真實選字輸入框"
            : "⌨️ 目前：真實中文輸入框模式（需切微軟注音）｜點此切回按鍵導引";
      }
      if (cpImeWrapEl) {
        cpImeWrapEl.classList.toggle("hidden", !(canSwitchIme && game.inputMode === "ime"));
      }
      if (canSwitchIme && game.inputMode === "ime" && cpImeInputEl) {
        cpImeInputEl.value = "";
        setTimeout(() => cpImeInputEl.focus(), 50);
      }
    }

    function startRound() {
      if (game.timerId) clearInterval(game.timerId);
      const isl = game.island;
      game.active = true;
      game.timeLeft = isl.duration || 60;
      game.completedCount = 0;
      game.correctKeys = 0;
      game.totalKeys = 0;
      game.combo = 0;
      game.maxCombo = 0;
      game.promptQueue = shuffleArray(isl.prompts);

      if (cpTitleEl) cpTitleEl.textContent = `${isl.name}`;
      if (cpRuleEl) cpRuleEl.textContent = isl.ruleDesc;
      cpResultOverlayEl.classList.add("hidden");

      nextPrompt();
      updateCockpitHUD();

      game.timerId = setInterval(() => {
        if (!game.active) return;
        game.timeLeft -= 1;
        updateCockpitHUD();
        if (game.timeLeft <= 0) {
          finishRound();
        }
      }, 1000);
    }

    function nextPrompt() {
      if (game.promptQueue.length === 0) {
        game.promptQueue = shuffleArray(game.island.prompts);
      }
      game.currentPrompt = game.promptQueue.pop();
      game.steps = buildKeystrokeSteps(game.island, game.currentPrompt);
      game.stepIndex = 0;
      if (cpImeInputEl) cpImeInputEl.value = "";
      renderCurrentPrompt();
    }

    function renderCurrentPrompt() {
      const p = game.currentPrompt;
      const isl = game.island;
      if (!p) return;

      // 渲染大題目區
      if (isl.mode === "en_word" || isl.mode === "zh_word" || isl.mode === "zh_sentence" || isl.mode === "mixed_boss") {
        // 顯示每個字元的完成進度
        const activeStep = game.steps[game.stepIndex];
        const activeCharIdx = activeStep && activeStep.charIndex !== undefined ? activeStep.charIndex : game.stepIndex;
        let html = "";
        for (let i = 0; i < p.target.length; i++) {
          const ch = p.target[i];
          const cls = i < activeCharIdx ? "ch-done" : i === activeCharIdx ? "ch-current" : "ch-todo";
          html += `<span class="prompt-char ${cls}">${ch}</span>`;
        }
        cpTargetBigEl.innerHTML = html;
      } else {
        cpTargetBigEl.innerHTML = `<span class="prompt-single">${p.target}</span>`;
      }

      // 渲染注音/按鍵分解步驟膠囊
      if (cpZyStepsEl) {
        cpZyStepsEl.innerHTML = game.steps
          .map((st, idx) => {
            const stateCls = idx < game.stepIndex ? "done" : idx === game.stepIndex ? "active" : "";
            const keyHint = st.keyObj ? `<small>(${st.keyObj.en})</small>` : "";
            return `<span class="zy-pill ${stateCls}">${st.displayChar} ${keyHint}</span>`;
          })
          .join(`<span class="zy-arrow">➔</span>`);
      }

      if (cpHintEl) {
        const sub = p.sub ? `【${p.sub}】` : "";
        cpHintEl.textContent = `${sub} ${p.hint || ""}`;
      }

      highlightVirtualKey(game.steps[game.stepIndex]);
    }

    function computeEarnedStars(isl, score, acc) {
      if (acc < isl.thresholds.minAcc || score < isl.thresholds.bronze) return 0;
      if (score >= isl.thresholds.gold) return 3;
      if (score >= isl.thresholds.silver) return 2;
      return 1;
    }

    function updateCockpitHUD() {
      const isl = game.island;
      if (!isl) return;
      const acc = game.totalKeys > 0 ? Math.round((game.correctKeys / game.totalKeys) * 100) : 100;
      const stars = computeEarnedStars(isl, game.completedCount, acc);

      if (cpTimerEl) cpTimerEl.textContent = `${game.timeLeft}s`;
      if (cpScoreEl) cpScoreEl.textContent = `${game.completedCount} ${isl.unit}`;
      if (cpAccEl) cpAccEl.textContent = `${acc}%`;
      if (cpComboEl) cpComboEl.textContent = `${game.combo} 🔥`;
      if (cpStarsLiveEl) {
        cpStarsLiveEl.textContent = stars > 0 ? "⭐".repeat(stars) : "☆☆☆（加油！）";
      }
    }

    // 處理「注音/按鍵導引模式」的實體鍵盤按下事件
    window.addEventListener("keydown", (e) => {
      if (!game.active) return;

      if (e.code === "Escape") {
        e.preventDefault();
        closeTypingCockpit();
        return;
      }

      // 若在真實 IME 中文輸入框模式，交給 input 事件處理
      if (isChineseModeIsland(game.island) && game.inputMode === "ime") {
        return;
      }

      // 忽略單獨按 Shift / Ctrl / Alt / Meta
      if (["ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight", "CapsLock"].includes(e.code)) {
        return;
      }

      const step = game.steps[game.stepIndex];
      if (!step) return;

      e.preventDefault();
      game.totalKeys += 1;

      const codeMatched = e.code === step.code;
      const shiftMatched = step.needShift ? e.shiftKey : true;

      const pressedEl = vkKeyElements[e.code];

      if (codeMatched && shiftMatched) {
        game.correctKeys += 1;
        game.combo += 1;
        if (game.combo > game.maxCombo) game.maxCombo = game.combo;

        if (pressedEl) {
          pressedEl.classList.add("hit-ok");
          setTimeout(() => pressedEl.classList.remove("hit-ok"), 160);
        }

        // 若是單鍵計分模式 (island1, island2, island3, island4, island8)
        if (["key_drill", "en_word", "zy_key", "mixed_boss"].includes(game.island.mode)) {
          game.completedCount += 1;
        }

        game.stepIndex += 1;

        if (game.stepIndex >= game.steps.length) {
          // 整題完成！若是單字/語詞/句子模式，完成一題計 1 分
          if (["zh_char", "zh_word", "zh_sentence"].includes(game.island.mode)) {
            game.completedCount += 1;
          }
          sfx.playWordClear();
          updateCockpitHUD();
          nextPrompt();
        } else {
          sfx.playHit(game.combo);
          updateCockpitHUD();
          renderCurrentPrompt();
        }
      } else {
        // 按錯鍵或忘記按 Shift
        game.combo = 0;
        sfx.playMiss();
        if (pressedEl) {
          pressedEl.classList.add("hit-miss");
          setTimeout(() => pressedEl.classList.remove("hit-miss"), 240);
        }
        if (codeMatched && !shiftMatched && cpHintEl) {
          cpHintEl.textContent = "⚠️ 這個字母是大寫喔！請先按住【⇧ Shift】再按字母鍵！";
        }
        updateCockpitHUD();
      }
    });

    // 處理「真實中文輸入框 (IME) 模式」
    if (cpImeInputEl) {
      cpImeInputEl.addEventListener("input", () => {
        if (!game.active || !game.currentPrompt) return;
        const val = cpImeInputEl.value.trim();
        const target = game.currentPrompt.target;
        if (val === target) {
          game.totalKeys += target.length;
          game.correctKeys += target.length;
          game.combo += 1;
          if (game.island.mode === "mixed_boss") {
            game.completedCount += target.length;
          } else {
            game.completedCount += 1;
          }
          sfx.playWordClear();
          updateCockpitHUD();
          nextPrompt();
        }
      });
    }

    if (cpModeToggleEl) {
      cpModeToggleEl.addEventListener("click", () => {
        game.inputMode = game.inputMode === "guided" ? "ime" : "guided";
        updateModeToggleUI();
      });
    }

    // 結算關卡與儲存最佳紀錄
    function finishRound() {
      game.active = false;
      if (game.timerId) clearInterval(game.timerId);
      game.timerId = null;

      const isl = game.island;
      const acc = game.totalKeys > 0 ? Math.round((game.correctKeys / game.totalKeys) * 100) : 100;
      const stars = computeEarnedStars(isl, game.completedCount, acc);
      sfx.playFanfare(stars);

      const prev = records[isl.id] || { bestScore: 0, bestStars: 0, bestAcc: 0 };
      const isNewBest = game.completedCount > prev.bestScore || stars > prev.bestStars;

      records[isl.id] = {
        bestScore: Math.max(prev.bestScore, game.completedCount),
        bestStars: Math.max(prev.bestStars, stars),
        bestAcc: game.completedCount >= prev.bestScore ? acc : prev.bestAcc,
        updatedAt: new Date().toISOString()
      };
      saveRecords(records);
      refreshProgressUI();

      const starBig = stars > 0 ? "⭐".repeat(stars) : "💪 再接再厲";
      const rankList = getIslandLeaderboard(isl);
      const myRankIdx = rankList.findIndex((r) => r.isPlayer);

      const nextIslandOrder = isl.order < 8 ? isl.order + 1 : 1;
      const nextIsland = window.MMPS_ISLANDS.find((x) => x.order === nextIslandOrder);

      cpResultOverlayEl.classList.remove("hidden");
      cpResultOverlayEl.innerHTML = `
        <div class="res-card">
          <div class="res-badge">${isl.name}・闖關結算</div>
          <div class="res-stars">${starBig}</div>
          <h3 class="res-title">
            ${
              stars === 3
                ? "太神啦！榮獲最高榮譽【三星金獎】！"
                : stars === 2
                ? "超棒的！榮獲【二星銀獎】熟練認證！"
                : stars === 1
                ? "恭喜過關！獲得【一星銅獎】小三基準認證！"
                : "差一點點就過關囉！看準發光按鍵再試一次！"
            }
          </h3>
          ${isNewBest && game.completedCount > 0 ? `<div class="res-newbest">🎉 刷新個人最佳紀錄！</div>` : ""}

          <div class="res-stats-grid">
            <div class="res-stat">
              <span>本次成績</span>
              <strong>${game.completedCount} ${isl.unit}</strong>
            </div>
            <div class="res-stat">
              <span>打字正確率</span>
              <strong>${acc}%</strong>
            </div>
            <div class="res-stat">
              <span>最高連擊</span>
              <strong>${game.maxCombo} 🔥</strong>
            </div>
            <div class="res-stat">
              <span>本島英雄榜排名</span>
              <strong>${myRankIdx >= 0 ? `第 ${myRankIdx + 1} 名` : "未上榜"}</strong>
            </div>
          </div>

          <div class="res-actions">
            <button id="btn-res-retry" class="btn-res-primary">🔄 再挑戰一次</button>
            ${
              nextIsland
                ? `<button id="btn-res-next" class="btn-res-next">⏭️ 前往【${nextIsland.short}】</button>`
                : ""
            }
            <button id="btn-res-cert" class="btn-res-secondary">🏆 榮譽證書</button>
            <button id="btn-res-close" class="btn-res-secondary">🏝️ 返回 3D 群島</button>
          </div>
        </div>
      `;

      document.getElementById("btn-res-retry").addEventListener("click", () => startRound());
      const nextBtn = document.getElementById("btn-res-next");
      if (nextBtn && nextIsland) {
        nextBtn.addEventListener("click", () => {
          selectIsland(nextIsland.id, true);
          openTypingCockpit(nextIsland.id);
        });
      }
      document.getElementById("btn-res-cert").addEventListener("click", () => {
        closeTypingCockpit();
        openCertificateModal();
      });
      document.getElementById("btn-res-close").addEventListener("click", () => closeTypingCockpit());
    }

    // 座艙頂部按鈕綁定
    document.getElementById("btn-cp-restart").addEventListener("click", () => startRound());
    document.getElementById("btn-cp-finish-now").addEventListener("click", () => finishRound());
    document.getElementById("btn-cp-close").addEventListener("click", () => closeTypingCockpit());

    // =========================================================
    // 7. 角色漫遊模式與靠近島嶼一鍵開玩 HUD
    // =========================================================
    const btnRoam = document.getElementById("btn-roam-toggle");
    const roamHudEl = document.getElementById("roam-hud");
    const roamIslandNameEl = document.getElementById("roam-island-name");
    const btnRoamPlay = document.getElementById("btn-roam-play");

    function updateRoamProximityBanner(islandId) {
      const isl = window.MMPS_ISLANDS_MAP[islandId] || window.MMPS_ISLANDS[0];
      if (roamIslandNameEl) roamIslandNameEl.textContent = isl.name;
      if (btnRoamPlay) {
        btnRoamPlay.textContent = isl.id === "hub" ? "📜 查看英雄榜" : `🎮 挑戰【${isl.short}】`;
        btnRoamPlay.onclick = () => {
          if (isl.id === "hub") {
            openCertificateModal();
          } else {
            openTypingCockpit(isl.id);
          }
        };
      }
    }

    function enableRoamWithIsland(targetIslandId) {
      sceneApi.setRoamMode(true);
      if (targetIslandId) sceneApi.teleportPlayerToIsland(targetIslandId);
      btnRoam.classList.add("active");
      roamHudEl.classList.remove("hidden");
      updateRoamProximityBanner(targetIslandId || selectedIslandId || "hub");
    }

    if (btnRoam) {
      btnRoam.addEventListener("click", () => {
        const next = !sceneApi.roamMode;
        sceneApi.setRoamMode(next);
        btnRoam.classList.toggle("active", next);
        roamHudEl.classList.toggle("hidden", !next);
        if (next) {
          sceneApi.teleportPlayerToIsland(selectedIslandId || "hub");
          updateRoamProximityBanner(selectedIslandId || "hub");
        }
      });
    }

    // 行動裝置虛擬方向鍵支援
    document.querySelectorAll("[data-move]").forEach((btn) => {
      const dir = btn.dataset.move;
      const codeMap = { up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD", jump: "Space" };
      const code = codeMap[dir];
      const fire = (type) => window.dispatchEvent(new KeyboardEvent(type, { code }));
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        fire("keydown");
      });
      btn.addEventListener("pointerup", () => fire("keyup"));
      btn.addEventListener("pointerleave", () => fire("keyup"));
    });

    // =========================================================
    // 8. 角色造型與名字設定彈窗 (#avatar-modal)
    // =========================================================
    const avatarModal = document.getElementById("avatar-modal");
    const inputName = document.getElementById("inp-player-name");
    const inputTitle = document.getElementById("inp-player-title");

    function openAvatarModal() {
      inputName.value = profile.name;
      inputTitle.value = profile.title;
      avatarModal.classList.remove("hidden");
    }

    document.getElementById("btn-open-avatar").addEventListener("click", openAvatarModal);
    document.getElementById("btn-close-avatar").addEventListener("click", () => avatarModal.classList.add("hidden"));

    document.querySelectorAll("[data-shirt]").forEach((sw) => {
      sw.addEventListener("click", () => {
        profile.shirtColor = sw.dataset.shirt;
        updateProfileUI();
      });
    });
    document.querySelectorAll("[data-hat]").forEach((sw) => {
      sw.addEventListener("click", () => {
        profile.hatColor = sw.dataset.hat;
        updateProfileUI();
      });
    });

    document.getElementById("btn-save-avatar").addEventListener("click", () => {
      profile.name = (inputName.value || "").trim() || "馬鳴小騎士";
      profile.title = (inputTitle.value || "").trim() || "三年級打字冒險家";
      saveProfile(profile);
      updateProfileUI();
      renderIslandDetail(selectedIslandId);
      avatarModal.classList.add("hidden");
    });

    // =========================================================
    // 9. 榮譽證書與總排行榜彈窗 (#cert-modal)
    // =========================================================
    const certModal = document.getElementById("cert-modal");
    const certBody = document.getElementById("cert-body");

    function openCertificateModal() {
      const starsMap = getStarsMap();
      const total = getTotalStars();
      const taskIslands = window.MMPS_ISLANDS.filter((x) => x.id !== "hub");
      const rankTitle =
        total >= 20
          ? "👑 天空之城傳奇打字宗師"
          : total >= 12
          ? "🌟 馬鳴國小銀翼鍵盤騎士"
          : total >= 5
          ? "⚔️ 三年級打字冒險勇者"
          : "🌱 鍵盤王國見習小騎士";

      const rowsHtml = taskIslands
        .map((isl) => {
          const rec = records[isl.id];
          const st = starsMap[isl.id] || 0;
          return `
            <tr>
              <td><b>${isl.name}</b></td>
              <td>${isl.category}</td>
              <td>${rec ? `${rec.bestScore} ${isl.unit}` : "尚未挑戰"}</td>
              <td>${rec ? `${rec.bestAcc}%` : "-"}</td>
              <td>${st > 0 ? "⭐".repeat(st) : "☆☆☆"}</td>
            </tr>
          `;
        })
        .join("");

      const today = new Date().toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      certBody.innerHTML = `
        <div class="cert-paper">
          <div class="cert-header">
            <div class="cert-school">臺中市外埔區馬鳴國民小學・資訊教育闖關認證</div>
            <h2 class="cert-main-title">🏆 天空打字群島・榮譽闖關證書</h2>
          </div>
          <div class="cert-recipient">
            茲證明三年級小騎士 <span class="cert-player-name">${profile.name}</span>（稱號：${profile.title}）
            於「馬鳴國小・天空打字群島」完成八大中英打字島嶼探索，累積榮獲
            <strong class="cert-total-stars">⭐ ${total} / 24 顆星</strong>，
            特授予榮譽階級：<span class="cert-rank-badge">${rankTitle}</span>！
          </div>
          <table class="cert-table">
            <thead>
              <tr>
                <th>任務島嶼名稱</th>
                <th>能力領域</th>
                <th>最佳紀錄</th>
                <th>最高正確率</th>
                <th>星等評級</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="cert-footer">
            <span>📅 發證日期：${today}</span>
            <span>🏫 馬鳴國小・天空之城鍵盤王國 敬頒</span>
          </div>
        </div>
      `;
      certModal.classList.remove("hidden");
    }

    document.getElementById("btn-open-cert-top").addEventListener("click", openCertificateModal);
    document.getElementById("btn-close-cert").addEventListener("click", () => certModal.classList.add("hidden"));
    document.getElementById("btn-print-cert").addEventListener("click", () => window.print());

    // =========================================================
    // 10. 頂部工具列（視角、日夜、音效、收合詳情）
    // =========================================================
    document.getElementById("btn-close-detail").addEventListener("click", () => {
      detailPanelEl.classList.add("hidden");
    });

    const btnSound = document.getElementById("btn-sound");
    if (btnSound) {
      btnSound.addEventListener("click", () => {
        sfx.enabled = !sfx.enabled;
        btnSound.textContent = sfx.enabled ? "🔊 音效：開" : "🔇 音效：關";
      });
    }

    const btnTheme = document.getElementById("btn-theme");
    const themes = ["day", "dusk", "night"];
    const themeNames = { day: "☀️ 晴空", dusk: "🌇 夕陽", night: "🌙 星夜" };
    let themeIdx = 0;
    if (btnTheme) {
      btnTheme.addEventListener("click", () => {
        themeIdx = (themeIdx + 1) % themes.length;
        const t = themes[themeIdx];
        sceneApi.setTimeTheme(t);
        btnTheme.textContent = themeNames[t];
      });
    }

    const btnView = document.getElementById("btn-view");
    let viewMode = "panorama";
    if (btnView) {
      btnView.addEventListener("click", () => {
        viewMode = viewMode === "panorama" ? "bird" : "panorama";
        sceneApi.setViewMode(viewMode);
        btnView.textContent = viewMode === "panorama" ? "🔭 全景視角" : "🦅 鳥瞰全島";
      });
    }

    // 初始載入主島
    refreshProgressUI();
    selectIsland("hub", false);
  });
})();
