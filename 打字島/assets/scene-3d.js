// 馬鳴國小・天空打字群島 - 3D 浮空島微縮模型與第三人稱漫遊引擎 (Three.js)
(function () {
  const ISLAND_RADIUS = 4.6;
  const ISLAND_HEIGHT = 1.45;
  const RING_RADIUS = 15.0;

  const outerIslands = window.MMPS_ISLANDS.filter((i) => i.id !== "hub");
  const ISLAND_POS = { hub: [0, 0.6, 0] };
  const ISLAND_ANGLES = {};
  const startAngle = -Math.PI / 2;

  outerIslands.forEach((item, idx) => {
    const angle = startAngle + (idx * 2 * Math.PI) / outerIslands.length;
    ISLAND_ANGLES[item.id] = angle;
    const yOffset = Math.sin(idx * 1.5) * 0.45;
    ISLAND_POS[item.id] = [
      Math.cos(angle) * RING_RADIUS,
      yOffset,
      Math.sin(angle) * RING_RADIUS
    ];
  });

  window.MMPS_ISLAND_POS = ISLAND_POS;

  const matCache = new Map();
  function getMat(color, opts = {}) {
    const key = color + JSON.stringify(opts);
    if (!matCache.has(key)) {
      matCache.set(
        key,
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          roughness: opts.roughness ?? 0.75,
          metalness: opts.metalness ?? 0.08,
          transparent: !!opts.transparent,
          opacity: opts.opacity ?? 1,
          emissive: opts.emissive ? new THREE.Color(opts.emissive) : new THREE.Color(0x000000),
          emissiveIntensity: opts.emissiveIntensity ?? 0,
          side: opts.side ?? THREE.FrontSide
        })
      );
    }
    return matCache.get(key);
  }

  function makeSignTexture(text, bg = "#2c221e", fg = "#fffaf2", border = "#e39b2d", fontSize = 46) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = border;
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 496, 112);
    ctx.fillStyle = fg;
    ctx.font = `900 ${fontSize}px "Noto Sans TC", "Microsoft JhengHei", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 66);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  function makeKeycapTexture(mainText, subText = "", bg = "#fffaf2", fg = "#1f2937", border = "#d97706") {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = border;
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, 236, 236);
    ctx.fillStyle = fg;
    ctx.font = '900 110px "Noto Sans TC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(mainText, 128, subText ? 105 : 130);
    if (subText) {
      ctx.fillStyle = border;
      ctx.font = '900 54px "Noto Sans TC", sans-serif';
      ctx.fillText(subText, 128, 195);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  function makeOctagonShape(radius) {
    const shape = new THREE.Shape();
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 8 + (i * Math.PI) / 4;
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }

  function makeOctagonExtrude(radius, depth, bevel) {
    const geo = new THREE.ExtrudeGeometry(makeOctagonShape(radius), {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      curveSegments: 1
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }

  function addBox(parent, size, color, pos, rot, opts = {}) {
    const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const mesh = new THREE.Mesh(geo, opts.material || getMat(color, opts));
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = opts.castShadow ?? true;
    mesh.receiveShadow = opts.receiveShadow ?? true;
    parent.add(mesh);
    return mesh;
  }

  function addCyl(parent, rt, rb, h, color, pos, rot, seg = 16, opts = {}) {
    const geo = new THREE.CylinderGeometry(rt, rb, h, seg);
    const mesh = new THREE.Mesh(geo, opts.material || getMat(color, opts));
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = opts.castShadow ?? true;
    mesh.receiveShadow = opts.receiveShadow ?? true;
    parent.add(mesh);
    return mesh;
  }

  function addSphere(parent, r, color, pos, seg = 14, opts = {}) {
    const geo = new THREE.SphereGeometry(r, seg, seg);
    const mesh = new THREE.Mesh(geo, opts.material || getMat(color, opts));
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = opts.castShadow ?? true;
    mesh.receiveShadow = opts.receiveShadow ?? true;
    parent.add(mesh);
    return mesh;
  }

  function addKeyBlock(parent, mainTxt, subTxt, color, pos, size = 0.65) {
    const g = new THREE.Group();
    g.position.set(pos[0], pos[1], pos[2]);
    addBox(g, [size, size * 0.75, size], color, [0, (size * 0.75) / 2, 0]);
    const tex = makeKeycapTexture(mainTxt, subTxt, "#fffaf2", "#1f2937", color);
    const top = new THREE.Mesh(
      new THREE.PlaneGeometry(size * 0.86, size * 0.86),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    top.rotation.x = -Math.PI / 2;
    top.position.y = size * 0.75 + 0.01;
    g.add(top);
    parent.add(g);
    return g;
  }

  function addTree(parent, pos, scale = 0.7, kind = "round", color = "#5aa84c") {
    const g = new THREE.Group();
    g.position.set(pos[0], pos[1], pos[2]);
    g.scale.setScalar(scale);
    addCyl(g, 0.08, 0.13, 0.55, "#8d6e4f", [0, 0.27, 0], null, 8);
    if (kind === "pine") {
      addCyl(g, 0.02, 0.52, 0.65, "#4c9141", [0, 0.68, 0], null, 8);
      addCyl(g, 0.02, 0.42, 0.58, "#58a34c", [0, 1.02, 0], null, 8);
      addCyl(g, 0.01, 0.3, 0.48, "#67b35a", [0, 1.32, 0], null, 8);
    } else {
      const m1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 1), getMat(color));
      m1.position.set(0, 0.78, 0);
      m1.castShadow = true;
      g.add(m1);
    }
    parent.add(g);
    return g;
  }

  function addBuilding(parent, opts = {}) {
    const {
      w = 2.6,
      d = 1.2,
      floors = 2,
      wall = "#fff6e8",
      trim = "#3b82f6",
      roof = "#2563eb",
      sign = "任務館",
      pos = [0, 0, -1.95],
      windowMat
    } = opts;
    const g = new THREE.Group();
    g.position.set(pos[0], pos[1], pos[2]);
    const h = floors * 0.62;
    addBox(g, [w, h, d], wall, [0, h / 2, 0]);
    addBox(g, [w + 0.08, 0.1, d + 0.08], trim, [0, 0.05, 0]);
    addBox(g, [w + 0.18, 0.09, d + 0.18], roof, [0, h + 0.045, 0]);
    addCyl(g, 0.01, (d + 0.15) * 0.65, w + 0.08, roof, [0, h + 0.28, 0], [0, 0, Math.PI / 2], 4);

    const cols = Math.max(2, Math.floor(w / 0.55));
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < cols; c++) {
        if (f === 0 && c === Math.floor(cols / 2)) continue;
        const wx = -((cols - 1) * 0.48) / 2 + c * 0.48;
        const wy = 0.32 + f * 0.6;
        addBox(g, [0.26, 0.24, 0.03], "#8ecae6", [wx, wy, d / 2 + 0.01], null, {
          material: windowMat
        });
      }
    }
    addBox(g, [0.36, 0.44, 0.04], "#7f5539", [0, 0.22, d / 2 + 0.01]);
    if (sign) {
      const signTex = makeSignTexture(sign, "#2c221e", "#fffaf2", trim);
      const signMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.65, 0.38, 0.06),
        new THREE.MeshBasicMaterial({ map: signTex })
      );
      signMesh.position.set(0, h + 0.42, d / 2 - 0.1);
      g.add(signMesh);
    }
    parent.add(g);
    return g;
  }

  function createNPC(opts = {}, animList) {
    const { shirt = "#3b82f6", pants = "#1e293b", pos = [0, 0, 0], rotY = 0, seed = 1 } = opts;
    const root = new THREE.Group();
    root.position.set(pos[0], pos[1], pos[2]);
    root.rotation.y = rotY;
    addBox(root, [0.09, 0.22, 0.1], pants, [-0.06, 0.11, 0]);
    addBox(root, [0.09, 0.22, 0.1], pants, [0.06, 0.11, 0]);
    addBox(root, [0.25, 0.28, 0.16], shirt, [0, 0.36, 0]);
    const armR = new THREE.Group();
    armR.position.set(0.16, 0.46, 0);
    addBox(armR, [0.07, 0.22, 0.08], shirt, [0, -0.1, 0]);
    root.add(armR);
    addBox(root, [0.07, 0.22, 0.08], shirt, [-0.16, 0.36, 0]);
    addSphere(root, 0.145, "#f4c89e", [0, 0.64, 0], 12);
    addSphere(root, 0.15, "#2b2018", [0, 0.67, -0.02], 12);
    animList.push((t) => {
      armR.rotation.z = 2.4 + Math.sin(t * 5 + seed) * 0.35;
    });
    return root;
  }

  // =========================================================
  // 九座打字任務島專屬 3D 微縮場景
  // =========================================================
  const IslandBuilders = {
    // 0. 鍵盤王國主島（巨型 F/J 定位鍵盤紀念碑 + 英雄頒獎台）
    hub(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 3.0,
        d: 1.2,
        floors: 2,
        trim: "#2f7fb5",
        roof: "#1d4ed8",
        sign: "馬鳴打字王國・英雄殿",
        pos: [0, 0, -2.05],
        windowMat
      });

      // 中央 F 與 J 定位凸點巨型鍵帽雙塔
      const fKey = addKeyBlock(parent, "F", "ㄑ(左食)", "#06d6a0", [-0.85, 0, 0.2], 0.9);
      const jKey = addKeyBlock(parent, "J", "ㄨ(右食)", "#118ab2", [0.85, 0, 0.2], 0.9);
      // 凸點金條
      addBox(fKey, [0.35, 0.05, 0.08], "#fbbf24", [0, 0.7, 0.28]);
      addBox(jKey, [0.35, 0.05, 0.08], "#fbbf24", [0, 0.7, 0.28]);

      // 榮耀頒獎台 (1st, 2nd, 3rd)
      addBox(parent, [0.65, 0.48, 0.65], "#fbbf24", [0, 0.24, 1.55]);
      addBox(parent, [0.6, 0.34, 0.6], "#94a3b8", [-0.68, 0.17, 1.55]);
      addBox(parent, [0.6, 0.24, 0.6], "#d97706", [0.68, 0.12, 1.55]);

      parent.add(createNPC({ shirt: "#f59e0b", pos: [0, 0.48, 1.55], seed: 1 }, animList));
    },

    // 1. 基準鍵定位島（中排 8 鍵石碑陣 A S D F - J K L ;）
    island1(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 2.5,
        d: 1.1,
        floors: 1,
        trim: "#10b981",
        roof: "#059669",
        sign: "島1・基準鍵定位",
        pos: [0, 0, -2.05],
        windowMat
      });

      const homeKeys = [
        ["A", "ㄇ", "#ef476f", -2.1, 0.3],
        ["S", "ㄋ", "#f78c6b", -1.5, 0.5],
        ["D", "ㄎ", "#ffd166", -0.9, 0.65],
        ["F", "ㄑ", "#06d6a0", -0.3, 0.75],
        ["J", "ㄨ", "#118ab2", 0.3, 0.75],
        ["K", "ㄜ", "#3a86ff", 0.9, 0.65],
        ["L", "ㄠ", "#8338ec", 1.5, 0.5],
        [";", "ㄤ", "#ec4899", 2.1, 0.3]
      ];
      homeKeys.forEach(([en, zy, col, kx, kz], i) => {
        const kb = addKeyBlock(parent, en, zy, col, [kx, 0, kz], 0.52);
        animList.push((t) => {
          kb.position.y = Math.max(0, Math.sin(t * 3 - i * 0.5)) * 0.12;
        });
      });
      parent.add(createNPC({ shirt: "#10b981", pos: [0, 0, -0.5], seed: 2 }, animList));
    },

    // 2. 英打字母冒險島（漂浮 A-Z 彩色積木陣）
    island2(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 2.5,
        d: 1.1,
        floors: 2,
        trim: "#3a86ff",
        roof: "#1d4ed8",
        sign: "島2・英打26字母",
        pos: [0, 0, -2.05],
        windowMat
      });

      const letters = [
        ["Q", "#ef476f", -1.5, 0.6, 0.1],
        ["W", "#f78c6b", -0.5, 0.9, 0.1],
        ["E", "#ffd166", 0.5, 0.7, 0.1],
        ["R", "#06d6a0", 1.5, 0.8, 0.1],
        ["A", "#3a86ff", -1.0, 0.2, 1.1],
        ["B", "#8338ec", 0, 0.2, 1.2],
        ["C", "#ec4899", 1.0, 0.2, 1.1]
      ];
      letters.forEach(([ch, col, lx, ly, lz], idx) => {
        const b = addKeyBlock(parent, ch, "英打", col, [lx, ly, lz], 0.56);
        animList.push((t) => {
          b.position.y = ly + Math.sin(t * 2.2 + idx) * 0.15;
        });
      });
      parent.add(createNPC({ shirt: "#3a86ff", pos: [0, 0, -0.5], seed: 3 }, animList));
    },

    // 3. 大小寫與單字島（Shift 魔法升降台 + Apple/Book 單字牆）
    island3(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 2.6,
        d: 1.15,
        floors: 2,
        trim: "#8338ec",
        roof: "#6d28d9",
        sign: "島3・大小寫與單字",
        pos: [0, 0, -2.05],
        windowMat
      });

      const shiftBlock = addKeyBlock(parent, "Shift", "大寫魔法", "#8338ec", [-1.3, 0, 0.4], 0.85);
      const capA = addKeyBlock(parent, "A", "Apple", "#f59e0b", [0.8, 0.3, 0.4], 0.75);
      animList.push((t) => {
        capA.position.y = 0.25 + Math.abs(Math.sin(t * 2)) * 0.45;
      });
      parent.add(createNPC({ shirt: "#8338ec", pos: [-0.2, 0, 1.2], seed: 4 }, animList));
    },

    // 4. 注音鍵位探索島（ㄅㄆㄇㄈ 聲母／ㄧㄨㄩ 介音／ㄚㄛㄜ 韻母三色圖騰）
    island4(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 2.6,
        d: 1.15,
        floors: 2,
        trim: "#f59e0b",
        roof: "#d97706",
        sign: "島4・注音鍵位尋蹤",
        pos: [0, 0, -2.05],
        windowMat
      });

      [
        ["ㄅ", "1", "#ef476f", -1.5, 0.2],
        ["ㄆ", "Q", "#f59e0b", -0.5, 0.2],
        ["ㄇ", "A", "#10b981", 0.5, 0.2],
        ["ㄈ", "Z", "#3a86ff", 1.5, 0.2],
        ["ㄧ", "U", "#8338ec", -0.9, 1.15],
        ["ㄨ", "J", "#ec4899", 0, 1.15],
        ["ㄩ", "M", "#06d6a0", 0.9, 1.15]
      ].forEach(([zy, en, col, zx, zz], idx) => {
        const blk = addKeyBlock(parent, zy, en, col, [zx, 0, zz], 0.58);
        animList.push((t) => {
          blk.rotation.y = Math.sin(t * 1.5 + idx) * 0.2;
        });
      });
    },

    // 5. 聲調與單字島（五聲調音階拱門 ˉ ˊ ˇ ˋ ˙）
    island5(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 2.6,
        d: 1.15,
        floors: 2,
        trim: "#ec4899",
        roof: "#db2777",
        sign: "島5・五聲調與單字",
        pos: [0, 0, -2.05],
        windowMat
      });

      [
        ["ˉ", "空白", "#10b981", -1.6],
        ["ˊ", "6", "#3a86ff", -0.8],
        ["ˇ", "3", "#f59e0b", 0],
        ["ˋ", "4", "#ef4444", 0.8],
        ["˙", "7", "#8338ec", 1.6]
      ].forEach(([tone, k, col, tx]) => {
        addKeyBlock(parent, tone, k, col, [tx, 0, 0.5], 0.56);
      });
      parent.add(createNPC({ shirt: "#ec4899", pos: [0, 0, 1.4], seed: 5 }, animList));
    },

    // 6. 生活語詞森林島（金蘋果語詞果樹林）
    island6(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 2.5,
        d: 1.1,
        floors: 1,
        trim: "#e76f51",
        roof: "#c2410c",
        sign: "島6・生活語詞森林",
        pos: [0, 0, -2.05],
        windowMat
      });

      [
        [-1.4, 0.3],
        [0, 0.1],
        [1.4, 0.3],
        [-0.8, 1.2],
        [0.8, 1.2]
      ].forEach(([tx, tz]) => {
        const tg = addTree(parent, [tx, 0, tz], 0.95, "round", "#4ade80");
        addSphere(tg, 0.12, "#fbbf24", [0.28, 0.75, 0.25], 10);
        addSphere(tg, 0.12, "#ef4444", [-0.25, 0.82, 0.2], 10);
      });
      parent.add(createNPC({ shirt: "#e76f51", pos: [0, 0, 1.4], seed: 6 }, animList));
    },

    // 7. 短句飛空艇島（蒸汽競速飛空艇）
    island7(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 2.5,
        d: 1.1,
        floors: 2,
        trim: "#0ea5e9",
        roof: "#0284c7",
        sign: "島7・短句飛空艇",
        pos: [0, 0, -2.05],
        windowMat
      });

      const blimp = new THREE.Group();
      blimp.position.set(0, 1.25, 0.6);
      const hull = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 12), getMat("#0ea5e9"));
      hull.scale.set(1.8, 0.85, 0.85);
      blimp.add(hull);
      addBox(blimp, [0.7, 0.3, 0.4], "#f59e0b", [0, -0.7, 0]);
      parent.add(blimp);

      animList.push((t) => {
        blimp.position.y = 1.25 + Math.sin(t * 2.2) * 0.2;
        blimp.rotation.z = Math.sin(t * 1.5) * 0.06;
      });
      parent.add(createNPC({ shirt: "#0ea5e9", pos: [-1.2, 0, 0.8], seed: 7 }, animList));
    },

    // 8. 天空之城魔王島（中英數終極挑戰殿堂 + 旋轉魔王核心與金皇冠）
    island8(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 2.8,
        d: 1.2,
        floors: 2,
        wall: "#fef2f2",
        trim: "#dc2626",
        roof: "#991b1b",
        sign: "島8・天空魔王總考驗",
        pos: [0, 0, -2.05],
        windowMat
      });

      // 四根能量方尖碑
      [
        [-1.6, 0.1],
        [1.6, 0.1],
        [-1.3, 1.3],
        [1.3, 1.3]
      ].forEach(([ox, oz]) => {
        addCyl(parent, 0.08, 0.22, 1.2, "#475569", [ox, 0.6, oz], null, 6);
        addSphere(parent, 0.14, "#ef4444", [ox, 1.3, oz], 10, {
          emissive: "#ef4444",
          emissiveIntensity: 0.6
        });
      });

      // 中央漂浮魔王寶石與皇冠
      const bossCore = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.52, 0),
        getMat("#fbbf24", { emissive: "#f59e0b", emissiveIntensity: 0.7, roughness: 0.2 })
      );
      bossCore.position.set(0, 1.1, 0.6);
      parent.add(bossCore);
      animList.push((t) => {
        bossCore.rotation.y = t * 1.8;
        bossCore.position.y = 1.05 + Math.sin(t * 2.6) * 0.16;
      });
    }
  };

  // =========================================================
  // 初始化 3D 舞台與外部控制 API
  // =========================================================
  window.initMMPS3DScene = function (containerEl, labelLayerEl, callbacks) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#bfe3f2");
    scene.fog = new THREE.FogExp2("#cde8f2", 0.0082);

    const camera = new THREE.PerspectiveCamera(
      32,
      window.innerWidth / window.innerHeight,
      0.5,
      420
    );
    camera.position.set(0, 32, 46);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerEl.innerHTML = "";
    containerEl.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight("#cfe8ff", "#b98e5a", 1.15);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight("#fff1d6", 1.45);
    dirLight.position.set(26, 42, 24);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    const d = 28;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    const windowMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#90e0ef"),
      emissive: new THREE.Color("#ffd166"),
      emissiveIntensity: 0.1,
      roughness: 0.25
    });

    const animList = [];
    const interactiveMeshes = [];
    const islandGroups = {};
    const starTrophyGroups = {};
    const labelEls = {};

    const grassGeo = makeOctagonExtrude(ISLAND_RADIUS, 0.22, 0.1);
    const stripeGeo = makeOctagonExtrude(ISLAND_RADIUS * 0.99, 0.2, 0.06);
    const soilGeo = makeOctagonExtrude(ISLAND_RADIUS * 0.97, 0.95, 0.12);

    // 建立 9 座浮空島
    window.MMPS_ISLANDS.forEach((island, idx) => {
      const pos = ISLAND_POS[island.id];
      const root = new THREE.Group();
      root.position.set(pos[0], pos[1], pos[2]);
      scene.add(root);

      const floatGroup = new THREE.Group();
      root.add(floatGroup);

      const grassMesh = new THREE.Mesh(grassGeo, getMat(island.grass));
      grassMesh.position.y = ISLAND_HEIGHT - 0.22;
      grassMesh.receiveShadow = true;
      floatGroup.add(grassMesh);

      const stripeMesh = new THREE.Mesh(stripeGeo, getMat(island.color));
      stripeMesh.position.y = ISLAND_HEIGHT - 0.52;
      floatGroup.add(stripeMesh);

      const soilMesh = new THREE.Mesh(soilGeo, getMat(island.rock));
      soilMesh.position.y = ISLAND_HEIGHT - 1.35;
      soilMesh.castShadow = true;
      soilMesh.receiveShadow = true;
      floatGroup.add(soilMesh);

      // 天空之城錐形岩層與底部發光飛行石
      addCyl(floatGroup, 3.6, 2.35, 1.45, "#8d6e53", [0, -0.55, 0], null, 8);
      addCyl(floatGroup, 2.5, 2.55, 0.14, "#e39b2d", [0, -0.75, 0], null, 8);
      addCyl(floatGroup, 2.3, 1.05, 1.35, "#745840", [0, -1.85, 0], null, 7);

      const crystalCore = new THREE.Mesh(
        new THREE.OctahedronGeometry(island.id === "hub" ? 0.85 : 0.58, 0),
        getMat(island.crystal, { emissive: island.crystal, emissiveIntensity: 0.75, roughness: 0.15 })
      );
      crystalCore.position.set(0, -2.75, 0);
      floatGroup.add(crystalCore);

      const contentGroup = new THREE.Group();
      contentGroup.position.y = ISLAND_HEIGHT + 0.08;
      floatGroup.add(contentGroup);

      for (let a = 0; a < 10; a++) {
        const ang = (a / 10) * Math.PI * 2 + 0.3;
        if (Math.sin(ang) < -0.5 && Math.abs(Math.cos(ang)) < 0.8) continue;
        const r = 3.9;
        addTree(contentGroup, [Math.cos(ang) * r, 0, Math.sin(ang) * r], 0.58, a % 2 === 0 ? "pine" : "round");
      }

      if (IslandBuilders[island.id]) {
        IslandBuilders[island.id](contentGroup, animList, windowMat);
      }

      // 島嶼上空 3D 過關星星獎盃群組 (1~3顆星)
      const starGroup = new THREE.Group();
      starGroup.position.set(0, 2.85, -1.8);
      contentGroup.add(starGroup);
      starTrophyGroups[island.id] = starGroup;

      const hitCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(ISLAND_RADIUS, ISLAND_RADIUS * 0.7, 4.2, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitCyl.position.y = 0.6;
      hitCyl.userData = { type: "island", islandId: island.id };
      floatGroup.add(hitCyl);
      interactiveMeshes.push(hitCyl);

      const el = document.createElement("button");
      el.className = "nameplate";
      el.style.setProperty("--c", island.color);
      el.innerHTML = `
        <span class="dot"></span>
        <span>${island.short}</span>
        <em>${island.badge}</em>
        <span class="stars-pill" id="np-stars-${island.id}"></span>
      `;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        callbacks.onSelectIsland(island.id);
      });
      el.addEventListener("mouseenter", () => callbacks.onHoverIsland(island.id));
      el.addEventListener("mouseleave", () => callbacks.onHoverIsland(null));
      labelLayerEl.appendChild(el);
      labelEls[island.id] = el;

      islandGroups[island.id] = {
        root,
        floatGroup,
        crystalCore,
        baseY: pos[1],
        hoverLift: 0,
        phase: idx * 0.85
      };
    });

    // 雲海空橋
    outerIslands.forEach((island) => {
      const angle = ISLAND_ANGLES[island.id];
      const bridgeGroup = new THREE.Group();
      bridgeGroup.rotation.y = -angle;
      scene.add(bridgeGroup);

      const startR = ISLAND_RADIUS * 0.92;
      const endR = RING_RADIUS - ISLAND_RADIUS * 0.92;
      const bridgeLen = endR - startR;
      const planks = 18;
      const targetY = ISLAND_POS[island.id][1];

      for (let p = 0; p < planks; p++) {
        const u = (p + 0.5) / planks;
        const r = startR + u * bridgeLen;
        const archY =
          ISLAND_HEIGHT + 0.6 * (1 - u) + (ISLAND_HEIGHT + targetY) * u + Math.sin(u * Math.PI) * 0.75;
        addBox(bridgeGroup, [0.24, 0.06, 0.95], p % 2 === 0 ? "#d6ab76" : "#c4925a", [r, archY, 0]);
      }
    });

    // 跨島學習路線光弧
    const linksGroup = new THREE.Group();
    linksGroup.visible = false;
    scene.add(linksGroup);
    const linkLabels = [];

    window.MMPS_LINKS.forEach((lnk) => {
      const p1 = ISLAND_POS[lnk.from];
      const p2 = ISLAND_POS[lnk.to];
      if (!p1 || !p2) return;
      const mid = [(p1[0] + p2[0]) / 2, Math.max(p1[1], p2[1]) + 4.8, (p1[2] + p2[2]) / 2];
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(p1[0], p1[1] + 2.0, p1[2]),
        new THREE.Vector3(mid[0], mid[1], mid[2]),
        new THREE.Vector3(p2[0], p2[1] + 2.0, p2[2])
      ]);
      const tubeMesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 28, 0.075, 8, false),
        getMat("#f59e0b", { emissive: "#f59e0b", emissiveIntensity: 0.45 })
      );
      linksGroup.add(tubeMesh);

      const lbl = document.createElement("div");
      lbl.className = "link-label";
      lbl.style.display = "none";
      lbl.textContent = lnk.label;
      labelLayerEl.appendChild(lbl);
      linkLabels.push({ el: lbl, pos: new THREE.Vector3(mid[0], mid[1] + 0.35, mid[2]) });
    });

    // 雲海環境
    const cloudMat = getMat("#ffffff", { transparent: true, opacity: 0.9, roughness: 1 });
    const clouds = [];
    for (let i = 0; i < 34; i++) {
      const cg = new THREE.Group();
      [
        [0, 0, 0, 1.5],
        [1.3, -0.2, 0.2, 1.1],
        [-1.25, -0.25, -0.1, 1.15]
      ].forEach(([px, py, pz, pr]) => {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(pr, 1), cloudMat);
        m.position.set(px, py, pz);
        cg.add(m);
      });
      const isDeep = i < 20;
      const orbitR = isDeep ? 6 + (i * 7) % 34 : 21 + (i * 11) % 24;
      const orbitY = isDeep ? -4.8 - (i % 5) * 1.4 : 5.5 + (i % 4) * 2.5;
      cg.scale.setScalar(isDeep ? 1.4 : 0.85);
      scene.add(cg);
      clouds.push({
        group: cg,
        r: orbitR,
        y: orbitY,
        angle: (i * Math.PI * 2) / 17,
        speed: (0.012 + (i % 5) * 0.004) * (i % 2 === 0 ? 1 : -1)
      });
    }

    // =========================================================
    // 玩家可操控角色 (RPG Third-Person Explorer)
    // =========================================================
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, ISLAND_HEIGHT + 0.7, 2.2);
    playerGroup.visible = false;
    scene.add(playerGroup);

    const pBody = new THREE.Group();
    playerGroup.add(pBody);

    const pLegL = new THREE.Group();
    pLegL.position.set(-0.08, 0.24, 0);
    addBox(pLegL, [0.1, 0.26, 0.12], "#1d3557", [0, -0.13, 0]);
    pBody.add(pLegL);

    const pLegR = new THREE.Group();
    pLegR.position.set(0.08, 0.24, 0);
    addBox(pLegR, [0.1, 0.26, 0.12], "#1d3557", [0, -0.13, 0]);
    pBody.add(pLegR);

    const pTorsoMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#10b981"), roughness: 0.7 });
    addBox(pBody, [0.32, 0.34, 0.2], "#10b981", [0, 0.42, 0], null, { material: pTorsoMat });
    addBox(pBody, [0.26, 0.28, 0.12], "#ffd166", [0, 0.42, -0.14]); // 黃色小書包

    const pArmL = new THREE.Group();
    pArmL.position.set(-0.21, 0.52, 0);
    addBox(pArmL, [0.08, 0.26, 0.09], "#10b981", [0, -0.12, 0], null, { material: pTorsoMat });
    pBody.add(pArmL);

    const pArmR = new THREE.Group();
    pArmR.position.set(0.21, 0.52, 0);
    addBox(pArmR, [0.08, 0.26, 0.09], "#10b981", [0, -0.12, 0], null, { material: pTorsoMat });
    pBody.add(pArmR);

    addSphere(pBody, 0.17, "#f4c89e", [0, 0.74, 0], 14);
    addSphere(pBody, 0.175, "#2b2018", [0, 0.77, -0.02], 14);
    const pHatMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#3b82f6"), roughness: 0.6 });
    addCyl(pBody, 0.176, 0.176, 0.06, "#3b82f6", [0, 0.85, 0], null, 14, { material: pHatMat });
    addBox(pBody, [0.22, 0.03, 0.15], "#3b82f6", [0, 0.84, 0.14], null, { material: pHatMat });

    const pNameplateEl = document.createElement("div");
    pNameplateEl.className = "player-nameplate hidden";
    pNameplateEl.innerHTML = `<span class="p-badge" id="p-np-badge">打字勇者</span><span id="p-np-name">馬鳴小創客</span>`;
    labelLayerEl.appendChild(pNameplateEl);

    const roamState = {
      active: false,
      x: 0,
      z: 2.2,
      y: ISLAND_HEIGHT + 0.7,
      vy: 0,
      onGround: true,
      yaw: 0,
      runAnim: 0,
      keys: { forward: false, backward: false, left: false, right: false, jump: false, sprint: false },
      nearIsland: "hub"
    };

    window.addEventListener("keydown", (e) => {
      if (!roamState.active || api.typingActive) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.code === "KeyW" || e.code === "ArrowUp") roamState.keys.forward = true;
      if (e.code === "KeyS" || e.code === "ArrowDown") roamState.keys.backward = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft") roamState.keys.left = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") roamState.keys.right = true;
      if (e.code === "Space") {
        if (roamState.onGround) {
          roamState.vy = 0.19;
          roamState.onGround = false;
        }
        e.preventDefault();
      }
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") roamState.keys.sprint = true;
      if (e.code === "KeyE" || e.code === "Enter") {
        if (callbacks.onPlayerInteract) callbacks.onPlayerInteract(roamState.nearIsland);
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") roamState.keys.forward = false;
      if (e.code === "KeyS" || e.code === "ArrowDown") roamState.keys.backward = false;
      if (e.code === "KeyA" || e.code === "ArrowLeft") roamState.keys.left = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") roamState.keys.right = false;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") roamState.keys.sprint = false;
    });

    function getGroundHeight(x, z) {
      const dHub = Math.hypot(x, z);
      if (dHub <= ISLAND_RADIUS * 0.96) {
        return { y: ISLAND_HEIGHT + 0.7, island: "hub", valid: true };
      }
      for (let i = 0; i < outerIslands.length; i++) {
        const item = outerIslands[i];
        const pos = ISLAND_POS[item.id];
        const dist = Math.hypot(x - pos[0], z - pos[2]);
        if (dist <= ISLAND_RADIUS * 0.96) {
          return { y: ISLAND_HEIGHT + pos[1] + 0.1, island: item.id, valid: true };
        }
      }
      const r = Math.hypot(x, z);
      const angle = Math.atan2(z, x);
      const startR = ISLAND_RADIUS * 0.88;
      const endR = RING_RADIUS - ISLAND_RADIUS * 0.88;
      if (r >= startR && r <= endR + 1.2) {
        for (let i = 0; i < outerIslands.length; i++) {
          const item = outerIslands[i];
          const bAngle = ISLAND_ANGLES[item.id];
          let diff = Math.abs(angle - bAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff <= 0.9 / r) {
            const u = Math.min(1, Math.max(0, (r - startR) / (endR - startR)));
            const targetY = ISLAND_POS[item.id][1];
            const arch = Math.sin(u * Math.PI) * 0.75;
            const y = (ISLAND_HEIGHT + 0.7) * (1 - u) + (ISLAND_HEIGHT + targetY + 0.1) * u + arch;
            return { y, island: item.id, valid: true };
          }
        }
      }
      return { y: ISLAND_HEIGHT + 0.1, island: null, valid: false };
    }

    // 鏡頭控制
    const camState = {
      theta: 0.25,
      phi: 0.92,
      radius: 42,
      target: new THREE.Vector3(0, 0.8, 0),
      goalTheta: 0.25,
      goalPhi: 0.92,
      goalRadius: 42,
      goalTarget: new THREE.Vector3(0, 0.8, 0),
      dragging: false,
      panning: false,
      lastX: 0,
      lastY: 0,
      pointerDownX: 0,
      pointerDownY: 0
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", (e) => {
      camState.dragging = true;
      camState.panning = e.button === 2 || e.shiftKey;
      camState.lastX = e.clientX;
      camState.lastY = e.clientY;
      camState.pointerDownX = e.clientX;
      camState.pointerDownY = e.clientY;
    });

    window.addEventListener("pointermove", (e) => {
      if (camState.dragging) {
        const dx = e.clientX - camState.lastX;
        const dy = e.clientY - camState.lastY;
        camState.lastX = e.clientX;
        camState.lastY = e.clientY;
        if (camState.panning) {
          const panSpeed = 0.032 * (camState.radius / 35);
          const right = new THREE.Vector3(Math.cos(camState.theta), 0, -Math.sin(camState.theta));
          const forward = new THREE.Vector3(Math.sin(camState.theta), 0, Math.cos(camState.theta));
          camState.goalTarget.addScaledVector(right, -dx * panSpeed);
          camState.goalTarget.addScaledVector(forward, -dy * panSpeed);
        } else {
          camState.goalTheta -= dx * 0.0065;
          camState.goalPhi = Math.max(0.22, Math.min(1.42, camState.goalPhi - dy * 0.0055));
        }
        return;
      }
      const rect = dom.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(interactiveMeshes, false);
      if (hits.length > 0) {
        dom.style.cursor = "pointer";
        const ud = hits[0].object.userData;
        if (ud.type === "island") callbacks.onHoverIsland(ud.islandId);
      } else {
        dom.style.cursor = "grab";
        callbacks.onHoverIsland(null);
      }
    });

    window.addEventListener("pointerup", (e) => {
      const moved = Math.hypot(e.clientX - camState.pointerDownX, e.clientY - camState.pointerDownY);
      camState.dragging = false;
      if (moved < 6 && e.target === dom) {
        const rect = dom.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(interactiveMeshes, false);
        if (hits.length > 0) {
          const ud = hits[0].object.userData;
          if (ud.type === "island") callbacks.onSelectIsland(ud.islandId);
        }
      }
    });

    dom.addEventListener("contextmenu", (e) => e.preventDefault());
    dom.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        camState.goalRadius = Math.max(10, Math.min(68, camState.goalRadius + e.deltaY * 0.025));
      },
      { passive: false }
    );

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const api = {
      selectedId: null,
      hoveredId: null,
      animateEnabled: true,
      showLabels: true,
      showLinks: false,
      roamMode: false,
      typingActive: false,

      setRoamMode(enabled) {
        this.roamMode = enabled;
        roamState.active = enabled;
        playerGroup.visible = enabled;
        pNameplateEl.classList.toggle("hidden", !enabled);
        if (enabled) {
          camState.goalRadius = 9.5;
          camState.goalPhi = 0.96;
        } else {
          this.focusIsland(this.selectedId, "panorama");
        }
      },

      teleportPlayerToIsland(islandId) {
        const p = ISLAND_POS[islandId] || [0, 0.6, 0];
        roamState.x = p[0];
        roamState.z = p[2] + 1.8;
        roamState.y = ISLAND_HEIGHT + p[1] + 0.2;
        roamState.nearIsland = islandId;
      },

      updatePlayerCustom(cfg) {
        if (!cfg) return;
        const nameEl = document.getElementById("p-np-name");
        const badgeEl = document.getElementById("p-np-badge");
        if (cfg.name && nameEl) nameEl.textContent = cfg.name;
        if (cfg.title && badgeEl) badgeEl.textContent = cfg.title;
        if (cfg.shirtColor) pTorsoMat.color.set(cfg.shirtColor);
        if (cfg.hatColor) pHatMat.color.set(cfg.hatColor);
        if (cfg.badgeColor && badgeEl) badgeEl.style.background = cfg.badgeColor;
      },

      updateIslandStars(starsByIsland) {
        Object.keys(starTrophyGroups).forEach((id) => {
          const grp = starTrophyGroups[id];
          while (grp.children.length) grp.remove(grp.children[0]);
          const count = starsByIsland[id] || 0;
          const npStar = document.getElementById(`np-stars-${id}`);
          if (npStar) {
            npStar.textContent = count > 0 ? "⭐".repeat(count) : "";
          }
          for (let s = 0; s < count; s++) {
            const starMesh = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.32, 0),
              getMat("#fbbf24", { emissive: "#f59e0b", emissiveIntensity: 0.75, roughness: 0.2 })
            );
            starMesh.position.set((s - (count - 1) / 2) * 0.75, 0, 0);
            grp.add(starMesh);
          }
        });
      },

      focusIsland(id, viewMode = "panorama") {
        this.selectedId = id;
        if (!id) {
          camState.goalTarget.set(0, 0.8, 0);
          camState.goalPhi = viewMode === "bird" ? 0.24 : 0.92;
          camState.goalRadius = viewMode === "bird" ? 47 : 42;
          return;
        }
        const p = ISLAND_POS[id];
        if (!p) return;
        const offsetX = window.innerWidth > 900 ? 2.2 : 0;
        camState.goalTarget.set(p[0] + offsetX, p[1] + 1.4, p[2]);
        camState.goalRadius = id === "hub" ? 16.5 : 14.2;
        camState.goalPhi = 1.02;
        if (id !== "hub") {
          camState.goalTheta = Math.atan2(p[0], p[2]) + 0.25;
        }
      },

      setViewMode(mode) {
        if (mode === "bird") {
          camState.goalTarget.set(0, 0, 0);
          camState.goalPhi = 0.23;
          camState.goalRadius = 47;
        } else {
          camState.goalTarget.set(0, 0.8, 0);
          camState.goalPhi = 0.92;
          camState.goalRadius = 42;
        }
      },

      setHovered(id) {
        this.hoveredId = id;
        Object.keys(labelEls).forEach((k) => {
          labelEls[k].classList.toggle("on", k === this.selectedId || k === this.hoveredId);
        });
      },

      setSelected(id) {
        this.selectedId = id;
        Object.keys(labelEls).forEach((k) => {
          labelEls[k].classList.toggle("on", k === this.selectedId || k === this.hoveredId);
        });
      },

      setShowLabels(v) {
        this.showLabels = v;
        Object.values(labelEls).forEach((el) => el.classList.toggle("hidden", !v));
      },

      setShowLinks(v) {
        this.showLinks = v;
        linksGroup.visible = v;
        linkLabels.forEach((l) => (l.el.style.display = v ? "block" : "none"));
      },

      setTimeTheme(theme) {
        const themes = {
          day: { bg: "#bfe3f2", fog: "#cde8f2", sun: "#fff1d6", sunI: 1.45, win: 0.08 },
          dusk: { bg: "#f4c7a8", fog: "#f1cdb4", sun: "#ffb27a", sunI: 1.25, win: 0.45 },
          night: { bg: "#1b2644", fog: "#223056", sun: "#9ab4ff", sunI: 0.65, win: 0.95 }
        };
        const cfg = themes[theme] || themes.day;
        scene.background.set(cfg.bg);
        scene.fog.color.set(cfg.fog);
        dirLight.color.set(cfg.sun);
        dirLight.intensity = cfg.sunI;
        windowMat.emissiveIntensity = cfg.win;
      }
    };

    let clockTime = 0;
    let lastStamp = performance.now();
    const tempVec = new THREE.Vector3();

    function animate(now) {
      requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - lastStamp) / 1000);
      lastStamp = now;

      if (api.animateEnabled) {
        clockTime += dt;
        animList.forEach((fn) => fn(clockTime));
        clouds.forEach((c) => {
          const a = c.angle + clockTime * c.speed;
          c.group.position.set(Math.cos(a) * c.r, c.y, Math.sin(a) * c.r);
        });
        Object.values(starTrophyGroups).forEach((grp) => {
          grp.children.forEach((st, i) => {
            st.rotation.y = clockTime * 2.2 + i;
            st.position.y = Math.sin(clockTime * 3 + i) * 0.1;
          });
        });
      }

      Object.keys(islandGroups).forEach((id) => {
        const ig = islandGroups[id];
        const targetLift = id === api.selectedId ? 0.55 : id === api.hoveredId ? 0.32 : 0;
        ig.hoverLift += (targetLift - ig.hoverLift) * 0.12;
        const bob = api.animateEnabled ? Math.sin(clockTime * 1.6 + ig.phase) * 0.15 : 0;
        ig.floatGroup.position.y = bob + ig.hoverLift;
        ig.crystalCore.rotation.y = clockTime * 1.4 + ig.phase;

        const p = ISLAND_POS[id];
        tempVec.set(p[0], p[1] + ig.floatGroup.position.y + ISLAND_HEIGHT + 3.3, p[2]);
        tempVec.project(camera);
        const el = labelEls[id];
        if (tempVec.z > 1) {
          el.style.display = "none";
        } else {
          el.style.display = "inline-flex";
          el.style.left = `${(tempVec.x * 0.5 + 0.5) * window.innerWidth}px`;
          el.style.top = `${(-tempVec.y * 0.5 + 0.5) * window.innerHeight}px`;
        }
      });

      if (api.showLinks) {
        linkLabels.forEach((l) => {
          tempVec.copy(l.pos).project(camera);
          if (tempVec.z > 1) l.el.style.display = "none";
          else {
            l.el.style.display = "block";
            l.el.style.left = `${(tempVec.x * 0.5 + 0.5) * window.innerWidth}px`;
            l.el.style.top = `${(-tempVec.y * 0.5 + 0.5) * window.innerHeight}px`;
          }
        });
      }

      // 漫遊角色更新
      if (roamState.active && !api.typingActive) {
        const moveSpeed = roamState.keys.sprint ? 0.14 : 0.085;
        let moveX = 0;
        let moveZ = 0;
        const sinT = Math.sin(camState.theta);
        const cosT = Math.cos(camState.theta);
        if (roamState.keys.forward) { moveX -= sinT; moveZ -= cosT; }
        if (roamState.keys.backward) { moveX += sinT; moveZ += cosT; }
        if (roamState.keys.left) { moveX -= cosT; moveZ += sinT; }
        if (roamState.keys.right) { moveX += cosT; moveZ -= sinT; }

        const len = Math.hypot(moveX, moveZ);
        if (len > 0.001) {
          moveX = (moveX / len) * moveSpeed;
          moveZ = (moveZ / len) * moveSpeed;
          const nextCheck = getGroundHeight(roamState.x + moveX, roamState.z + moveZ);
          if (nextCheck.valid) {
            roamState.x += moveX;
            roamState.z += moveZ;
          } else {
            if (getGroundHeight(roamState.x + moveX, roamState.z).valid) roamState.x += moveX;
            if (getGroundHeight(roamState.x, roamState.z + moveZ).valid) roamState.z += moveZ;
          }
          roamState.yaw = Math.atan2(moveX, moveZ);
          roamState.runAnim += dt * 13;
          pLegL.rotation.x = Math.sin(roamState.runAnim) * 0.7;
          pLegR.rotation.x = -Math.sin(roamState.runAnim) * 0.7;
          pArmL.rotation.x = -Math.sin(roamState.runAnim) * 0.65;
          pArmR.rotation.x = Math.sin(roamState.runAnim) * 0.65;
        } else {
          pLegL.rotation.x *= 0.8;
          pLegR.rotation.x *= 0.8;
          pArmL.rotation.x *= 0.8;
          pArmR.rotation.x *= 0.8;
        }

        const ground = getGroundHeight(roamState.x, roamState.z);
        roamState.y += roamState.vy;
        roamState.vy -= 0.012;
        if (roamState.y <= ground.y) {
          roamState.y = ground.y;
          roamState.vy = 0;
          roamState.onGround = true;
        }
        playerGroup.position.set(roamState.x, roamState.y, roamState.z);
        playerGroup.rotation.y = roamState.yaw;

        if (ground.island && ground.island !== roamState.nearIsland) {
          roamState.nearIsland = ground.island;
          if (callbacks.onPlayerNearIsland) callbacks.onPlayerNearIsland(ground.island);
        }
        camState.goalTarget.set(roamState.x, roamState.y + 0.85, roamState.z);

        tempVec.set(roamState.x, roamState.y + 1.25, roamState.z);
        tempVec.project(camera);
        if (tempVec.z > 1) pNameplateEl.classList.add("hidden");
        else {
          pNameplateEl.classList.remove("hidden");
          pNameplateEl.style.left = `${(tempVec.x * 0.5 + 0.5) * window.innerWidth}px`;
          pNameplateEl.style.top = `${(-tempVec.y * 0.5 + 0.5) * window.innerHeight}px`;
        }
      } else if (!roamState.active) {
        pNameplateEl.classList.add("hidden");
      }

      camState.theta += (camState.goalTheta - camState.theta) * 0.085;
      camState.phi += (camState.goalPhi - camState.phi) * 0.085;
      camState.radius += (camState.goalRadius - camState.radius) * 0.085;
      camState.target.lerp(camState.goalTarget, 0.085);

      camera.position.set(
        camState.target.x + camState.radius * Math.sin(camState.phi) * Math.sin(camState.theta),
        camState.target.y + camState.radius * Math.cos(camState.phi),
        camState.target.z + camState.radius * Math.sin(camState.phi) * Math.cos(camState.theta)
      );
      camera.lookAt(camState.target);
      renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);
    return api;
  };
})();
