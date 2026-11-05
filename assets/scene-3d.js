// 馬鳴國小社團群島 - 天空之城 3D 浮空島微縮模型引擎 (Three.js)
(function () {
  const ISLAND_RADIUS = 4.6;
  const ISLAND_HEIGHT = 1.45;
  const RING_RADIUS = 14.8;

  // 計算 9 座浮空島的 3D 座標（中央主島 + 8 座社團環島，高低錯落呈現天空之城立體感）
  const outerIslands = window.MMPS_ISLANDS.filter((i) => i.id !== "hub");
  const ISLAND_POS = { hub: [0, 0.6, 0] };
  const ISLAND_ANGLES = {};
  const startAngle = -Math.PI / 2;

  outerIslands.forEach((item, idx) => {
    const angle = startAngle + (idx * 2 * Math.PI) / outerIslands.length;
    ISLAND_ANGLES[item.id] = angle;
    const yOffset = Math.sin(idx * 1.7) * 0.45;
    ISLAND_POS[item.id] = [
      Math.cos(angle) * RING_RADIUS,
      yOffset,
      Math.sin(angle) * RING_RADIUS
    ];
  });

  window.MMPS_ISLAND_POS = ISLAND_POS;

  // 材質快取
  const matCache = new Map();
  function getMat(color, opts = {}) {
    const key = color + JSON.stringify(opts);
    if (!matCache.has(key)) {
      matCache.set(
        key,
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          roughness: opts.roughness ?? 0.78,
          metalness: opts.metalness ?? 0.06,
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

  // 建立文字招牌 CanvasTexture
  function makeSignTexture(text, bg = "#3b2f2a", fg = "#fffaf2", border = "#e39b2d") {
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
    ctx.font = '900 48px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 66);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  // 八角形 Shape 與 ExtrudeGeometry
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
      depth: depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      curveSegments: 1
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }

  // 基礎幾何體產生器
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

  // 建立手作風微縮樹木
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
      const ico = new THREE.IcosahedronGeometry(0.46, 1);
      const m1 = new THREE.Mesh(ico, getMat(color));
      m1.position.set(0, 0.78, 0);
      m1.castShadow = true;
      g.add(m1);
      const m2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), getMat("#72be5b"));
      m2.position.set(0.24, 0.66, 0.14);
      m2.castShadow = true;
      g.add(m2);
    }
    parent.add(g);
    return g;
  }

  // 建立微縮教室建築（含窗戶、斜屋頂、招牌）
  function addBuilding(parent, opts = {}) {
    const {
      w = 2.6,
      d = 1.25,
      floors = 2,
      wall = "#fff6e8",
      trim = "#d9785a",
      roof = "#c86446",
      sign = "教室",
      pos = [0, 0, -1.9],
      rotY = 0,
      windowMat
    } = opts;
    const g = new THREE.Group();
    g.position.set(pos[0], pos[1], pos[2]);
    g.rotation.y = rotY;
    const h = floors * 0.62;

    // 主牆體
    addBox(g, [w, h, d], wall, [0, h / 2, 0]);
    // 底座與腰線
    addBox(g, [w + 0.08, 0.1, d + 0.08], trim, [0, 0.05, 0]);
    if (floors > 1) {
      addBox(g, [w + 0.05, 0.06, d + 0.05], trim, [0, h * 0.5, 0]);
    }
    // 屋簷與斜屋頂
    addBox(g, [w + 0.18, 0.09, d + 0.18], roof, [0, h + 0.045, 0]);
    addCyl(g, 0.01, (d + 0.15) * 0.65, w + 0.08, roof, [0, h + 0.28, 0], [0, 0, Math.PI / 2], 4);

    // 窗戶（夜間會發光）
    const cols = Math.max(2, Math.floor(w / 0.52));
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < cols; c++) {
        if (f === 0 && c === Math.floor(cols / 2)) continue; // 留給一樓大門
        const wx = -((cols - 1) * 0.48) / 2 + c * 0.48;
        const wy = 0.32 + f * 0.6;
        addBox(g, [0.28, 0.26, 0.03], "#8ecae6", [wx, wy, d / 2 + 0.01], null, {
          material: windowMat
        });
      }
    }
    // 一樓木門與雨遮
    addBox(g, [0.36, 0.44, 0.04], "#7f5539", [0, 0.22, d / 2 + 0.01]);
    addBox(g, [0.54, 0.05, 0.24], trim, [0, 0.48, d / 2 + 0.1]);

    // 建築屋頂立體招牌
    if (sign) {
      const signTex = makeSignTexture(sign, "#3b2f2a", "#fffaf2", trim);
      const signMat = new THREE.MeshBasicMaterial({ map: signTex });
      const signMesh = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.38, 0.06), signMat);
      signMesh.position.set(0, h + 0.42, d / 2 - 0.1);
      g.add(signMesh);
    }

    parent.add(g);
    return g;
  }

  // 建立 Q 版動態師生小人
  function createPerson(opts = {}, animList) {
    const {
      shirt = "#ffffff",
      pants = "#2f3e5c",
      skin = "#f4c89e",
      hair = "#2b2018",
      hat = null,
      goggles = false,
      pose = "stand",
      task = "idle",
      scale = 1,
      pos = [0, 0, 0],
      rotY = 0,
      route = null,
      speed = 0.45,
      seed = 1
    } = opts;

    const root = new THREE.Group();
    root.position.set(pos[0], pos[1], pos[2]);
    root.rotation.y = rotY;

    const body = new THREE.Group();
    body.scale.setScalar(scale);
    if (pose === "sitground") body.position.y = -0.18;
    root.add(body);

    // 雙腿
    const legL = new THREE.Group();
    legL.position.set(-0.06, 0.22, 0);
    addBox(legL, [0.09, 0.22, 0.1], pants, [0, -0.11, 0]);
    body.add(legL);

    const legR = new THREE.Group();
    legR.position.set(0.06, 0.22, 0);
    addBox(legR, [0.09, 0.22, 0.1], pants, [0, -0.11, 0]);
    body.add(legR);

    if (pose === "sit" || pose === "sitground") {
      legL.rotation.x = -Math.PI / 2;
      legR.rotation.x = -Math.PI / 2;
    }

    // 軀幹
    addBox(body, [0.25, 0.28, 0.16], shirt, [0, 0.36, 0]);

    // 雙手
    const armL = new THREE.Group();
    armL.position.set(-0.16, 0.46, 0);
    addBox(armL, [0.07, 0.22, 0.08], shirt, [0, -0.1, 0]);
    body.add(armL);

    const armR = new THREE.Group();
    armR.position.set(0.16, 0.46, 0);
    addBox(armR, [0.07, 0.22, 0.08], shirt, [0, -0.1, 0]);
    body.add(armR);

    // 鼓棒或毛筆道具
    if (task === "drum") {
      addCyl(armL, 0.015, 0.015, 0.28, "#deb887", [0, -0.22, 0.1], [Math.PI / 2.4, 0, 0], 6);
      addCyl(armR, 0.015, 0.015, 0.28, "#deb887", [0, -0.22, 0.1], [Math.PI / 2.4, 0, 0], 6);
    } else if (task === "write") {
      addCyl(armR, 0.012, 0.005, 0.24, "#5c3d2e", [0, -0.2, 0.08], [Math.PI / 3, 0, 0], 6);
    } else if (task === "conduct") {
      addCyl(armR, 0.008, 0.012, 0.32, "#f8f9fa", [0, -0.2, 0.1], [Math.PI / 3, 0, 0], 6);
    }

    // 頭部與頭髮
    addSphere(body, 0.145, skin, [0, 0.64, 0], 12);
    addSphere(body, 0.152, hair, [0, 0.67, -0.02], 12);

    // 護目鏡（智高創客社）
    if (goggles) {
      addBox(body, [0.22, 0.06, 0.05], "#48cae4", [0, 0.65, 0.12]);
    }
    // 帽子／頭巾
    if (hat === "headband") {
      addCyl(body, 0.153, 0.153, 0.045, "#e63946", [0, 0.71, 0], null, 14);
    } else if (hat === "cap") {
      addCyl(body, 0.15, 0.15, 0.07, "#e39b2d", [0, 0.74, 0], null, 12);
    }

    // 註冊動態更新
    animList.push((t) => {
      const phase = t * 4.5 + seed * 1.7;
      if (route && route.length >= 2) {
        // 路徑行走或繞圈
        if (opts.circleRoute) {
          const r = opts.circleRoute.r || 1.2;
          const cx = opts.circleRoute.cx || 0;
          const cz = opts.circleRoute.cz || 0;
          const ang = t * speed + seed;
          root.position.set(cx + Math.cos(ang) * r, pos[1], cz + Math.sin(ang) * r);
          root.rotation.y = -ang + (speed > 0 ? 0 : Math.PI);
        } else {
          const p0 = route[0];
          const p1 = route[1];
          const u = (Math.sin(t * speed + seed) + 1) * 0.5;
          root.position.set(p0[0] + (p1[0] - p0[0]) * u, pos[1], p0[1] + (p1[1] - p0[1]) * u);
          const dir = Math.cos(t * speed + seed) >= 0 ? 1 : -1;
          root.rotation.y = Math.atan2((p1[0] - p0[0]) * dir, (p1[1] - p0[1]) * dir);
        }
        legL.rotation.x = Math.sin(phase * 1.5) * 0.5;
        legR.rotation.x = -Math.sin(phase * 1.5) * 0.5;
        armL.rotation.x = -Math.sin(phase * 1.5) * 0.4;
        armR.rotation.x = Math.sin(phase * 1.5) * 0.4;
        body.position.y = Math.abs(Math.sin(phase * 1.5)) * 0.03;
      } else if (task === "drum") {
        armL.rotation.x = -1.6 + Math.sin(phase * 2.2) * 0.65;
        armR.rotation.x = -1.6 - Math.sin(phase * 2.2) * 0.65;
        body.position.y = Math.abs(Math.sin(phase * 2.2)) * 0.04;
      } else if (task === "write") {
        armR.rotation.x = -1.1 + Math.sin(phase) * 0.15;
        armR.rotation.z = Math.cos(phase * 0.8) * 0.15;
        armL.rotation.x = -0.8;
      } else if (task === "conduct") {
        armR.rotation.x = -1.7 + Math.sin(phase * 1.6) * 0.5;
        armL.rotation.x = -1.3 + Math.cos(phase * 1.6) * 0.35;
      } else if (task === "wave") {
        armR.rotation.z = 2.4 + Math.sin(phase * 1.5) * 0.35;
      } else if (task === "work") {
        armL.rotation.x = -1.1 + Math.sin(phase * 1.3) * 0.3;
        armR.rotation.x = -1.1 - Math.sin(phase * 1.3) * 0.3;
      }
    });

    return root;
  }

  // 建立尋寶彩蛋吉祥物：馬鳴雲端小天馬 (Unicorn/Pony)
  function createMascotPony(islandId, pos, animList, interactiveMeshes) {
    const g = new THREE.Group();
    g.position.set(pos[0], pos[1], pos[2]);
    g.scale.setScalar(0.85);

    const bodyMesh = addBox(g, [0.22, 0.18, 0.34], "#fffaf2", [0, 0.2, 0]);
    const headMesh = addBox(g, [0.16, 0.16, 0.2], "#fffaf2", [0, 0.35, 0.16]);
    // 金色獨角與彩虹鬃毛
    addCyl(g, 0.005, 0.035, 0.16, "#ffd166", [0, 0.48, 0.22], [0.35, 0, 0], 8);
    addBox(g, [0.05, 0.16, 0.12], "#ff6b6b", [0, 0.36, 0.05]);
    addBox(g, [0.05, 0.14, 0.18], "#4fa3d1", [0, 0.22, -0.2], [-0.4, 0, 0]);
    // 小翅膀
    addBox(g, [0.16, 0.03, 0.14], "#bfe3f2", [0.16, 0.26, 0], [0, 0, 0.3]);
    addBox(g, [0.16, 0.03, 0.14], "#bfe3f2", [-0.16, 0.26, 0], [0, 0, -0.3]);
    // 四隻小腳
    [
      [-0.07, -0.11],
      [0.07, -0.11],
      [-0.07, 0.11],
      [0.07, 0.11]
    ].forEach(([lx, lz]) => {
      addBox(g, [0.05, 0.14, 0.05], "#e39b2d", [lx, 0.07, lz]);
    });

    // 點擊判定隱形球體
    const hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitSphere.position.set(0, 0.25, 0);
    hitSphere.userData = { type: "mascot", islandId, group: g, jumpUntil: 0 };
    g.add(hitSphere);
    interactiveMeshes.push(hitSphere);

    animList.push((t) => {
      const now = performance.now();
      if (now < hitSphere.userData.jumpUntil) {
        const p = (hitSphere.userData.jumpUntil - now) / 900;
        g.position.y = pos[1] + Math.sin(p * Math.PI * 2) * 0.65;
        g.rotation.y += 0.18;
      } else {
        g.position.y = pos[1] + Math.abs(Math.sin(t * 2.6 + pos[0])) * 0.05;
        g.rotation.y = Math.sin(t * 0.9 + pos[2]) * 0.4;
      }
    });

    return g;
  }

  // =========================================================
  // 各座社團浮空島專屬微縮場景建造器
  // =========================================================
  const IslandBuilders = {
    // 0. 馬鳴天空主島（校園行政中心 + 司令台 + 跑道縮影 + 飛行石紀念碑）
    hub(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 3.1,
        d: 1.2,
        floors: 2,
        wall: "#fff8ec",
        trim: "#2f7fb5",
        roof: "#236491",
        sign: "馬鳴國小・學務處",
        pos: [0, 0, -2.05],
        windowMat
      });

      // 司令台與升旗台
      addBox(parent, [1.3, 0.18, 0.7], "#f3e5d0", [0, 0.09, -0.85]);
      addBox(parent, [1.1, 0.65, 0.08], "#2f7fb5", [0, 0.42, -1.12]);
      addBox(parent, [1.25, 0.08, 0.75], "#4fa3d1", [0, 0.76, -0.85]);
      addCyl(parent, 0.025, 0.035, 1.85, "#e2e8f0", [0.85, 0.92, -0.85], null, 8);
      const flag = addBox(parent, [0.42, 0.26, 0.02], "#e63946", [1.06, 1.68, -0.85]);

      // 中央迷你操場跑道與球場（對應馬鳴平面圖）
      const trackGroup = new THREE.Group();
      trackGroup.position.set(0, 0.02, 1.05);
      const trackRing = new THREE.Mesh(
        new THREE.RingGeometry(0.95, 1.45, 36),
        getMat("#d9785a")
      );
      trackRing.rotation.x = -Math.PI / 2;
      trackGroup.add(trackRing);

      const court = new THREE.Mesh(
        new THREE.CircleGeometry(0.95, 36),
        getMat("#88c470")
      );
      court.rotation.x = -Math.PI / 2;
      trackGroup.add(court);
      parent.add(trackGroup);

      // 天空之城飛行石能量碑（位於中央）
      const monument = new THREE.Group();
      monument.position.set(0, 0, 1.05);
      addCyl(monument, 0.35, 0.45, 0.18, "#d8cbb8", [0, 0.09, 0], null, 8);
      const crystalMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.32, 0),
        getMat("#5ad2ff", {
          emissive: "#2ec4ff",
          emissiveIntensity: 0.65,
          roughness: 0.2,
          metalness: 0.3
        })
      );
      crystalMesh.position.set(0, 0.68, 0);
      monument.add(crystalMesh);
      parent.add(monument);

      animList.push((t) => {
        crystalMesh.position.y = 0.68 + Math.sin(t * 2.2) * 0.1;
        crystalMesh.rotation.y = t * 0.9;
        flag.rotation.y = Math.sin(t * 4) * 0.18;
      });

      // 師生動態
      parent.add(
        createPerson(
          { shirt: "#2f7fb5", pants: "#1d3557", pos: [0, 0.18, -0.75], task: "wave", seed: 1 },
          animList
        )
      );
      parent.add(
        createPerson(
          {
            shirt: "#ffd166",
            pants: "#2f3e5c",
            pos: [0, 0, 1.05],
            route: [0, 1],
            circleRoute: { cx: 0, cz: 1.05, r: 1.2 },
            speed: 0.75,
            seed: 2
          },
          animList
        )
      );
      parent.add(
        createPerson(
          {
            shirt: "#ff8fa3",
            pants: "#2f3e5c",
            pos: [0, 0, 1.05],
            route: [0, 1],
            circleRoute: { cx: 0, cz: 1.05, r: 1.2 },
            speed: 0.75,
            seed: 5
          },
          animList
        )
      );
    },

    // 1. 獨輪車社島（操場跑道 + 3位動態騎獨輪車繞圈學生 + 練習扶手架）
    unicycle(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 2.3,
        d: 1.05,
        floors: 1,
        wall: "#fff4eb",
        trim: "#e76f51",
        roof: "#d45d3f",
        sign: "操場・獨輪車社",
        pos: [0, 0, -2.15],
        windowMat
      });

      // 橢圓操場跑道
      const track = new THREE.Group();
      track.position.set(0, 0.02, 0.45);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.85, 42), getMat("#e07a5f"));
      ring.rotation.x = -Math.PI / 2;
      track.add(ring);

      const whiteLine = new THREE.Mesh(new THREE.RingGeometry(1.48, 1.52, 42), getMat("#fffaf2"));
      whiteLine.rotation.x = -Math.PI / 2;
      whiteLine.position.y = 0.005;
      track.add(whiteLine);

      const turf = new THREE.Mesh(new THREE.CircleGeometry(1.15, 42), getMat("#80ed99"));
      turf.rotation.x = -Math.PI / 2;
      track.add(turf);
      parent.add(track);

      // 初學者平衡練習欄杆
      addBox(parent, [1.5, 0.04, 0.04], "#f4a261", [-2.2, 0.52, -0.4], [0, Math.PI / 3, 0]);
      addBox(parent, [0.05, 0.54, 0.05], "#8d6e4f", [-2.55, 0.27, -0.95]);
      addBox(parent, [0.05, 0.54, 0.05], "#8d6e4f", [-1.85, 0.27, 0.15]);

      // 吳老師在場中央指導
      parent.add(
        createPerson(
          {
            shirt: "#e76f51",
            pants: "#264653",
            hat: "cap",
            pos: [0, 0, 0.45],
            task: "wave",
            seed: 10
          },
          animList
        )
      );

      // 建立 3 位騎著 3D 獨輪車繞操場的學生
      const riderColors = ["#ffbe0b", "#3a86ff", "#ff006e"];
      riderColors.forEach((shirtColor, idx) => {
        const riderGroup = new THREE.Group();
        // 3D 獨輪車輪胎與車架
        const wheelGroup = new THREE.Group();
        wheelGroup.position.set(0, 0.22, 0);
        const tire = new THREE.Mesh(
          new THREE.TorusGeometry(0.19, 0.035, 10, 20),
          getMat("#2b2d42")
        );
        tire.rotation.y = Math.PI / 2;
        wheelGroup.add(tire);
        const hub = addBox(wheelGroup, [0.14, 0.05, 0.05], "#e76f51", [0, 0, 0]);
        riderGroup.add(wheelGroup);

        // 豎管與座墊
        addCyl(riderGroup, 0.02, 0.02, 0.32, "#adb5bd", [0, 0.36, 0], null, 8);
        addBox(riderGroup, [0.14, 0.05, 0.2], "#e63946", [0, 0.5, 0]);

        // 騎乘學生（雙手張開平衡）
        const student = createPerson(
          {
            shirt: shirtColor,
            pants: "#2b2d42",
            hat: "cap",
            pos: [0, 0.34, 0],
            scale: 0.92,
            seed: idx + 20
          },
          animList
        );
        riderGroup.add(student);
        parent.add(riderGroup);

        animList.push((t) => {
          const ang = t * 0.85 + (idx * Math.PI * 2) / 3;
          const r = 1.5;
          riderGroup.position.set(Math.cos(ang) * r, 0, 0.45 + Math.sin(ang) * r);
          riderGroup.rotation.y = -ang;
          riderGroup.rotation.z = Math.sin(t * 5 + idx) * 0.08; // 平衡微幅搖擺
          wheelGroup.rotation.x = t * 5;
        });
      });
    },

    // 2. 書法社島（2F 會議室 + 巨型毛筆硯台雕塑 + 書法桌揮毫 + 彭校長巡堂）
    calligraphy(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 2.5,
        d: 1.15,
        floors: 2,
        wall: "#fdf8f0",
        trim: "#8d5b4c",
        roof: "#5c3d2e",
        sign: "2F 會議室・書法社",
        pos: [-0.3, 0, -2.0],
        windowMat
      });

      // 巨型文房四寶藝術裝置（硯台 + 懸空運筆毛筆）
      const inkstone = new THREE.Group();
      inkstone.position.set(1.85, 0, -0.5);
      addCyl(inkstone, 0.65, 0.72, 0.16, "#2b2d42", [0, 0.08, 0], null, 16);
      addCyl(inkstone, 0.5, 0.5, 0.18, "#111116", [0, 0.09, 0], null, 16, { roughness: 0.15 });

      const giantBrush = new THREE.Group();
      giantBrush.position.set(0, 0.85, 0);
      addCyl(giantBrush, 0.055, 0.05, 1.15, "#a47148", [0, 0.45, 0], null, 12);
      addCyl(giantBrush, 0.07, 0.055, 0.16, "#d4a373", [0, -0.15, 0], null, 12);
      addCyl(giantBrush, 0.068, 0.005, 0.34, "#1a1a1a", [0, -0.38, 0], null, 12);
      inkstone.add(giantBrush);
      parent.add(inkstone);

      animList.push((t) => {
        giantBrush.position.x = Math.sin(t * 1.6) * 0.22;
        giantBrush.position.z = Math.cos(t * 1.2) * 0.22;
        giantBrush.rotation.z = Math.cos(t * 1.6) * 0.16;
      });

      // 春聯展示架
      addBox(parent, [0.06, 1.35, 0.06], "#6c4632", [2.15, 0.67, 1.1]);
      addBox(parent, [0.06, 1.35, 0.06], "#6c4632", [1.35, 0.67, 1.1]);
      addBox(parent, [0.95, 0.06, 0.06], "#6c4632", [1.75, 1.32, 1.1]);
      addBox(parent, [0.26, 0.85, 0.02], "#d62828", [1.55, 0.82, 1.1]);
      addBox(parent, [0.26, 0.85, 0.02], "#d62828", [1.95, 0.82, 1.1]);

      // 4 張書法桌與揮毫學生
      [
        [-1.4, 0.2],
        [-0.3, 0.2],
        [-1.4, 1.35],
        [-0.3, 1.35]
      ].forEach(([dx, dz], idx) => {
        const desk = new THREE.Group();
        desk.position.set(dx, 0, dz);
        addBox(desk, [0.76, 0.05, 0.46], "#6f4518", [0, 0.42, 0]);
        addBox(desk, [0.06, 0.42, 0.42], "#583101", [-0.32, 0.21, 0]);
        addBox(desk, [0.06, 0.42, 0.42], "#583101", [0.32, 0.21, 0]);
        // 宣紙與硯台
        addBox(desk, [0.46, 0.015, 0.32], "#fffdf7", [-0.05, 0.45, 0]);
        addBox(desk, [0.1, 0.03, 0.14], "#1f1f24", [0.25, 0.45, 0]);
        parent.add(desk);

        parent.add(
          createPerson(
            {
              shirt: ["#e0fbfc", "#ffd166", "#caffbf", "#ffcad4"][idx],
              pants: "#2f3e5c",
              pose: "sit",
              task: "write",
              pos: [dx, 0, dz + 0.34],
              rotY: Math.PI,
              seed: idx + 30
            },
            animList
          )
        );
      });

      // 彭校長巡視指導
      parent.add(
        createPerson(
          {
            shirt: "#3d5a80",
            pants: "#1d2d44",
            pos: [-0.85, 0, -0.55],
            route: [
              [-1.6, -0.45],
              [0.3, -0.45]
            ],
            speed: 0.45,
            seed: 99
          },
          animList
        )
      );
    },

    // 3. 太鼓初階社島（2F 視聽教室・低年級太鼓陣與慶典燈籠）
    taiko_jr(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 2.6,
        d: 1.15,
        floors: 2,
        wall: "#fff5f5",
        trim: "#e63946",
        roof: "#b51724",
        sign: "2F 視聽教室・太鼓初階",
        pos: [0, 0, -2.05],
        windowMat
      });

      // 祭典紅白燈籠柱
      [-2.1, 2.1].forEach((lx) => {
        addCyl(parent, 0.04, 0.05, 1.5, "#6c4632", [lx, 0.75, -0.6], null, 8);
        addSphere(parent, 0.18, "#e63946", [lx, 1.35, -0.6], 12, {
          emissive: "#e63946",
          emissiveIntensity: 0.35
        });
      });

      // 4 座低年級練習太鼓與擊鼓小鼓手
      [
        [-1.35, 0.25],
        [-0.45, 0.45],
        [0.45, 0.45],
        [1.35, 0.25]
      ].forEach(([tx, tz], idx) => {
        const drumGroup = new THREE.Group();
        drumGroup.position.set(tx, 0, tz);
        // 木鼓架
        addBox(drumGroup, [0.38, 0.26, 0.32], "#8d5b4c", [0, 0.13, 0]);
        // 太鼓桶身與鼓面
        addCyl(
          drumGroup,
          0.26,
          0.26,
          0.38,
          "#9c3d2b",
          [0, 0.44, 0],
          [Math.PI / 3.2, 0, 0],
          16
        );
        addCyl(
          drumGroup,
          0.24,
          0.24,
          0.4,
          "#f8edeb",
          [0, 0.44, 0],
          [Math.PI / 3.2, 0, 0],
          16
        );
        parent.add(drumGroup);

        parent.add(
          createPerson(
            {
              shirt: "#e63946",
              pants: "#1d3557",
              hat: "headband",
              task: "drum",
              scale: 0.88,
              pos: [tx, 0, tz + 0.48],
              rotY: Math.PI,
              seed: idx + 40
            },
            animList
          )
        );
      });

      // 施老師在前方帶動節拍
      parent.add(
        createPerson(
          {
            shirt: "#ffb703",
            pants: "#1d3557",
            task: "conduct",
            pos: [0, 0, 1.65],
            rotY: Math.PI,
            seed: 49
          },
          animList
        )
      );
    },

    // 4. 太鼓進階社島（2F 視聽教室主舞台・巨型大太鼓 Odaiko + 弧形公演鼓陣）
    taiko_sr(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 2.7,
        d: 1.15,
        floors: 2,
        wall: "#fff0f0",
        trim: "#c1121f",
        roof: "#780000",
        sign: "視聽教室・太鼓進階",
        pos: [0, 0, -2.1],
        windowMat
      });

      // 木質公演舞台高台
      addBox(parent, [3.6, 0.16, 2.2], "#d4a373", [0, 0.08, 0.1]);

      // 中央巨型大太鼓 (Odaiko) 與高架台
      const odaiko = new THREE.Group();
      odaiko.position.set(0, 0.16, -0.35);
      addBox(odaiko, [0.9, 0.45, 0.6], "#5c3d2e", [0, 0.22, 0]);
      addCyl(odaiko, 0.56, 0.56, 0.72, "#9e2a2b", [0, 0.82, 0], [Math.PI / 2, 0, 0], 20);
      addCyl(odaiko, 0.52, 0.52, 0.75, "#fff8e8", [0, 0.82, 0], [Math.PI / 2, 0, 0], 20);
      parent.add(odaiko);

      // 兩側弧形中太鼓陣
      [
        [-1.35, 0.25, 0.3],
        [-0.85, 0.75, 0.15],
        [0.85, 0.75, -0.15],
        [1.35, 0.25, -0.3]
      ].forEach(([dx, dz, rot], idx) => {
        const d = new THREE.Group();
        d.position.set(dx, 0.16, dz);
        d.rotation.y = rot;
        addBox(d, [0.4, 0.3, 0.34], "#6c4632", [0, 0.15, 0]);
        addCyl(d, 0.29, 0.29, 0.44, "#780000", [0, 0.48, 0], [Math.PI / 3, 0, 0], 16);
        addCyl(d, 0.27, 0.27, 0.46, "#fff8e8", [0, 0.48, 0], [Math.PI / 3, 0, 0], 16);
        parent.add(d);

        parent.add(
          createPerson(
            {
              shirt: "#1d3557",
              pants: "#f1faee",
              hat: "headband",
              task: "drum",
              pos: [dx, 0.16, dz + 0.48],
              rotY: Math.PI + rot,
              seed: idx + 50
            },
            animList
          )
        );
      });

      // 大太鼓主奏者與施老師
      parent.add(
        createPerson(
          {
            shirt: "#c1121f",
            pants: "#1d3557",
            hat: "headband",
            task: "drum",
            pos: [0, 0.16, 0.28],
            rotY: Math.PI,
            seed: 55
          },
          animList
        )
      );
      parent.add(
        createPerson(
          {
            shirt: "#fca311",
            pants: "#14213d",
            task: "conduct",
            pos: [0, 0, 1.85],
            rotY: Math.PI,
            seed: 59
          },
          animList
        )
      );
    },

    // 5. 節奏樂社島（2F 英語教室・木琴鐵琴打擊樂團 + 漂浮金色音符 + 吳老師指揮）
    rhythm(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 2.6,
        d: 1.15,
        floors: 2,
        wall: "#fff9ed",
        trim: "#f4a261",
        roof: "#e76f51",
        sign: "英語教室・節奏樂社",
        pos: [0, 0, -2.05],
        windowMat
      });

      // 木琴与鐵琴 (Xylophone & Marimba)
      [-1.15, 0, 1.15].forEach((mx, idx) => {
        const inst = new THREE.Group();
        inst.position.set(mx, 0, 0.2);
        addBox(inst, [0.88, 0.06, 0.44], "#8d5b4c", [0, 0.48, 0]);
        addCyl(inst, 0.03, 0.03, 0.48, "#495057", [-0.36, 0.24, 0], null, 8);
        addCyl(inst, 0.03, 0.03, 0.48, "#495057", [0.36, 0.24, 0], null, 8);
        // 琴鍵
        const barColors = ["#e63946", "#f4a261", "#e9c46a", "#2a9d8f", "#457b9d", "#6c5ce7"];
        for (let b = 0; b < 6; b++) {
          addBox(
            inst,
            [0.1, 0.03, 0.38 - b * 0.03],
            idx === 1 ? "#ffd166" : barColors[b],
            [-0.3 + b * 0.12, 0.52, 0]
          );
        }
        parent.add(inst);

        parent.add(
          createPerson(
            {
              shirt: ["#ffd166", "#a8dadc", "#ffcad4"][idx],
              pants: "#264653",
              task: "drum",
              pos: [mx, 0, -0.25],
              rotY: 0,
              seed: idx + 60
            },
            animList
          )
        );
      });

      // 指揮台與吳老師
      addBox(parent, [0.7, 0.16, 0.6], "#c1121f", [0, 0.08, 1.55]);
      parent.add(
        createPerson(
          {
            shirt: "#264653",
            pants: "#1d3557",
            task: "conduct",
            pos: [0, 0.16, 1.55],
            rotY: Math.PI,
            seed: 68
          },
          animList
        )
      );

      // 漂浮空中的 3D 金色音符環
      const notesGroup = new THREE.Group();
      notesGroup.position.set(0, 1.6, 0.3);
      for (let i = 0; i < 5; i++) {
        const n = new THREE.Group();
        const a = (i * Math.PI * 2) / 5;
        n.position.set(Math.cos(a) * 1.4, (i % 2) * 0.3, Math.sin(a) * 1.1);
        addSphere(n, 0.09, "#ffb703", [0, 0, 0], 10, {
          emissive: "#ffb703",
          emissiveIntensity: 0.4
        });
        addBox(n, [0.03, 0.28, 0.03], "#ffb703", [0.07, 0.14, 0]);
        addBox(n, [0.14, 0.05, 0.03], "#ffb703", [0.12, 0.26, 0]);
        notesGroup.add(n);
      }
      parent.add(notesGroup);
      animList.push((t) => {
        notesGroup.rotation.y = t * 0.55;
        notesGroup.position.y = 1.55 + Math.sin(t * 2) * 0.12;
      });
    },

    // 6. 舞獅社島（1F 風雨教室・傳統梅花樁 + 兩頭動態跳躍醒獅 + 鑼鼓陣）
    lion(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 2.7,
        d: 1.2,
        floors: 1,
        wall: "#fff6e5",
        trim: "#d97706",
        roof: "#b45309",
        sign: "1F 風雨教室・舞獅社",
        pos: [0, 0, -2.05],
        windowMat
      });

      // 高低梅花樁陣列
      [
        [-1.3, 0.2, 0.28],
        [-0.75, 0.2, 0.42],
        [-0.2, 0.2, 0.56],
        [0.35, 0.2, 0.42],
        [0.9, 0.2, 0.28]
      ].forEach(([px, pz, ph]) => {
        addCyl(parent, 0.12, 0.14, ph, "#9c6644", [px, ph / 2, pz], null, 12);
        addCyl(parent, 0.16, 0.16, 0.04, "#d62828", [px, ph + 0.02, pz], null, 12);
      });

      // 建造 2 組精緻 3D 醒獅（獅頭 + 獅被 + 舞獅學生）
      [
        { x: -0.9, z: 1.15, mainColor: "#e63946", trimColor: "#ffb703", phase: 0 },
        { x: 0.9, z: 1.15, mainColor: "#f77f00", trimColor: "#fcbf49", phase: 2.2 }
      ].forEach((cfg) => {
        const lionGroup = new THREE.Group();
        lionGroup.position.set(cfg.x, 0, cfg.z);

        // 獅頭
        const head = new THREE.Group();
        head.position.set(0, 0.62, 0.22);
        addSphere(head, 0.28, cfg.mainColor, [0, 0.05, 0], 14);
        // 獅眼與絨球額頭
        addSphere(head, 0.07, "#ffffff", [-0.12, 0.12, 0.22], 10);
        addSphere(head, 0.07, "#ffffff", [0.12, 0.12, 0.22], 10);
        addSphere(head, 0.035, "#111111", [-0.12, 0.12, 0.27], 8);
        addSphere(head, 0.035, "#111111", [0.12, 0.12, 0.27], 8);
        addSphere(head, 0.09, cfg.trimColor, [0, 0.28, 0.15], 10);
        addBox(head, [0.38, 0.08, 0.2], "#ffffff", [0, -0.12, 0.14]); // 白鬍鬚
        lionGroup.add(head);

        // 獅身披風與獅尾學生腳
        addBox(lionGroup, [0.44, 0.32, 0.68], cfg.mainColor, [0, 0.44, -0.22]);
        addBox(lionGroup, [0.46, 0.08, 0.7], cfg.trimColor, [0, 0.3, -0.22]);
        addBox(lionGroup, [0.1, 0.26, 0.1], cfg.mainColor, [-0.12, 0.13, 0.18]);
        addBox(lionGroup, [0.1, 0.26, 0.1], cfg.mainColor, [0.12, 0.13, 0.18]);
        addBox(lionGroup, [0.1, 0.26, 0.1], cfg.mainColor, [-0.12, 0.13, -0.45]);
        addBox(lionGroup, [0.1, 0.26, 0.1], cfg.mainColor, [0.12, 0.13, -0.45]);

        parent.add(lionGroup);

        animList.push((t) => {
          const u = t * 3.8 + cfg.phase;
          lionGroup.position.y = Math.abs(Math.sin(u)) * 0.22;
          head.rotation.x = Math.sin(u * 1.5) * 0.28;
          head.rotation.z = Math.cos(u) * 0.2;
          lionGroup.rotation.y = Math.sin(u * 0.5) * 0.35;
        });
      });

      // 黃老師擊大鼓助陣
      addCyl(parent, 0.28, 0.28, 0.42, "#b51724", [1.95, 0.35, -0.2], null, 16);
      parent.add(
        createPerson(
          {
            shirt: "#d97706",
            pants: "#1d3557",
            task: "drum",
            pos: [1.95, 0, -0.68],
            rotY: 0,
            seed: 75
          },
          animList
        )
      );
    },

    // 7. 英語社島（2F 英語教室・旋轉地球儀 + 巨型 ABC 積木 + 讀者劇場）
    english(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 2.6,
        d: 1.15,
        floors: 2,
        wall: "#f5f3ff",
        trim: "#6c5ce7",
        roof: "#4834d4",
        sign: "2F 英語教室・英語社",
        pos: [0, 0, -2.05],
        windowMat
      });

      // 旋轉 3D 地球儀裝置
      const globeStand = new THREE.Group();
      globeStand.position.set(-1.65, 0, 0.35);
      addCyl(globeStand, 0.22, 0.32, 0.14, "#8d6e4f", [0, 0.07, 0], null, 14);
      addCyl(globeStand, 0.04, 0.04, 0.6, "#d4a373", [0, 0.35, 0], null, 10);
      const globe = new THREE.Group();
      globe.position.set(0, 0.92, 0);
      globe.rotation.z = 0.38;
      addSphere(globe, 0.48, "#4ea8de", [0, 0, 0], 18);
      addSphere(globe, 0.49, "#52b788", [0.12, 0.1, 0.05], 8);
      globeStand.add(globe);
      parent.add(globeStand);
      animList.push((t) => {
        globe.rotation.y = t * 0.7;
      });

      // 巨型 ABC 彩色字母方塊
      [
        { ch: "A", color: "#ff595e", pos: [1.55, 0.28, -0.2], rot: 0.15 },
        { ch: "B", color: "#ffca3a", pos: [2.05, 0.28, 0.25], rot: -0.2 },
        { ch: "C", color: "#1982c4", pos: [1.78, 0.82, 0.02], rot: 0.08 }
      ].forEach((b) => {
        const tex = makeSignTexture(b.ch, b.color, "#ffffff", "#ffffff");
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.54, 0.54, 0.54),
          new THREE.MeshBasicMaterial({ map: tex })
        );
        mesh.position.set(b.pos[0], b.pos[1], b.pos[2]);
        mesh.rotation.y = b.rot;
        mesh.castShadow = true;
        parent.add(mesh);
      });

      // 林老師與圍坐進行英語讀者劇場的學生
      parent.add(
        createPerson(
          {
            shirt: "#6c5ce7",
            pants: "#2b2d42",
            task: "wave",
            pos: [0, 0, 0.05],
            rotY: 0,
            seed: 80
          },
          animList
        )
      );
      [
        [-0.75, 1.05, Math.PI * 0.85],
        [-0.25, 1.25, Math.PI * 0.95],
        [0.25, 1.25, -Math.PI * 0.95],
        [0.75, 1.05, -Math.PI * 0.85]
      ].forEach(([sx, sz, srot], idx) => {
        parent.add(
          createPerson(
            {
              shirt: ["#ff9f1c", "#2ec4b6", "#ffbf69", "#a8dadc"][idx],
              pants: "#2b2d42",
              pose: "sitground",
              task: "wave",
              pos: [sx, 0, sz],
              rotY: srot,
              seed: idx + 82
            },
            animList
          )
        );
      });
    },

    // 8. 智高社團島（2F DOC 教室・動態咬合智高齒輪組 + 智高機械手臂 + 創客實驗桌）
    gigo(parent, animList, windowMat) {
      addBuilding(parent, {
        w: 2.7,
        d: 1.15,
        floors: 2,
        wall: "#edfaf8",
        trim: "#2a9d8f",
        roof: "#1d7066",
        sign: "2F DOC教室・智高社",
        pos: [0, 0, -2.05],
        windowMat
      });

      // 巨型動態咬合 3D 智高齒輪牆 (Interlocking Gigo Gears)
      const gearFrame = new THREE.Group();
      gearFrame.position.set(-1.65, 0, 0.15);
      addBox(gearFrame, [0.12, 1.65, 1.5], "#457b9d", [0, 0.82, 0]);

      function createGear(r, color, y, z) {
        const g = new THREE.Group();
        g.position.set(0.12, y, z);
        addCyl(g, r, r, 0.1, color, [0, 0, 0], [0, 0, Math.PI / 2], 16);
        addCyl(g, r * 0.35, r * 0.35, 0.14, "#fffaf2", [0, 0, 0], [0, 0, Math.PI / 2], 12);
        const teeth = 8;
        for (let i = 0; i < teeth; i++) {
          const a = (i * Math.PI * 2) / teeth;
          addBox(
            g,
            [0.09, r * 0.32, r * 0.32],
            color,
            [0, Math.cos(a) * (r + 0.04), Math.sin(a) * (r + 0.04)],
            [a, 0, 0]
          );
        }
        gearFrame.add(g);
        return g;
      }

      const gear1 = createGear(0.36, "#f4a261", 0.95, -0.32);
      const gear2 = createGear(0.28, "#2a9d8f", 0.95, 0.32);
      const gear3 = createGear(0.24, "#e9c46a", 0.45, 0.02);
      parent.add(gearFrame);

      // 智高機關王機械手臂裝置
      const armBase = new THREE.Group();
      armBase.position.set(1.65, 0, 0.25);
      addCyl(armBase, 0.35, 0.42, 0.18, "#264653", [0, 0.09, 0], null, 12);
      const armTurret = new THREE.Group();
      armTurret.position.set(0, 0.18, 0);
      addBox(armTurret, [0.22, 0.55, 0.22], "#e76f51", [0, 0.27, 0]);
      const armUpper = new THREE.Group();
      armUpper.position.set(0, 0.52, 0);
      addBox(armUpper, [0.16, 0.65, 0.16], "#ffd166", [0, 0.28, 0.15], [0.5, 0, 0]);
      armTurret.add(armUpper);
      armBase.add(armTurret);
      parent.add(armBase);

      animList.push((t) => {
        gear1.rotation.x = t * 1.4;
        gear2.rotation.x = -t * 1.8;
        gear3.rotation.x = t * 2.1;
        armTurret.rotation.y = Math.sin(t * 1.2) * 0.85;
        armUpper.rotation.x = Math.sin(t * 2.4) * 0.35;
      });

      // DOC 創客工作桌與組裝智高積木的師生
      [-0.45, 0.55].forEach((tx, idx) => {
        addBox(parent, [0.78, 0.44, 0.48], "#f8f9fa", [tx, 0.22, 0.45]);
        // 桌上彩色智高積木顆粒
        addBox(parent, [0.16, 0.14, 0.16], "#e63946", [tx - 0.12, 0.51, 0.45]);
        addBox(parent, [0.16, 0.2, 0.16], "#2a9d8f", [tx + 0.08, 0.54, 0.42]);
        parent.add(
          createPerson(
            {
              shirt: idx === 0 ? "#48cae4" : "#ffd166",
              pants: "#264653",
              goggles: true,
              task: "work",
              pos: [tx, 0, 0.92],
              rotY: Math.PI,
              seed: idx + 90
            },
            animList
          )
        );
      });

      // 陳老師指導
      parent.add(
        createPerson(
          {
            shirt: "#2a9d8f",
            pants: "#1d3557",
            goggles: true,
            task: "wave",
            pos: [0.05, 0, -0.45],
            rotY: 0,
            seed: 95
          },
          animList
        )
      );
    }
  };

  // =========================================================
  // 主場景初始化與渲染迴圈
  // =========================================================
  window.initMMPS3DScene = function (containerEl, labelLayerEl, callbacks) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#bfe3f2");
    scene.fog = new THREE.FogExp2("#cde8f2", 0.0085);

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

    // 燈光系統（支援白天／黃昏／星夜模式切換）
    const hemiLight = new THREE.HemisphereLight("#cfe8ff", "#b98e5a", 1.15);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight("#fff1d6", 1.45);
    dirLight.position.set(26, 42, 24);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 5;
    dirLight.shadow.camera.far = 110;
    const d = 28;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // 夜間發光材質（窗戶、提燈）
    const windowMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#90e0ef"),
      emissive: new THREE.Color("#ffd166"),
      emissiveIntensity: 0.1,
      roughness: 0.25
    });

    const animList = [];
    const interactiveMeshes = [];
    const islandGroups = {};
    const liveRings = {};
    const labelEls = {};

    // 共用浮空島頂部八角形幾何體
    const grassGeo = makeOctagonExtrude(ISLAND_RADIUS, 0.22, 0.1);
    const stripeGeo = makeOctagonExtrude(ISLAND_RADIUS * 0.99, 0.2, 0.06);
    const soilGeo = makeOctagonExtrude(ISLAND_RADIUS * 0.97, 0.95, 0.12);

    // 建立 9 座「天空之城」浮空島
    window.MMPS_ISLANDS.forEach((island, idx) => {
      const pos = ISLAND_POS[island.id];
      const root = new THREE.Group();
      root.position.set(pos[0], pos[1], pos[2]);
      scene.add(root);

      const floatGroup = new THREE.Group();
      root.add(floatGroup);

      // 1. 浮空島草地平台與主題色環
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

      // 2. 天空之城特色：錐形多層浮空岩層底座 + 古代金紋環 + 底部發光飛行石核心
      addCyl(floatGroup, 3.6, 2.35, 1.45, "#8d6e53", [0, -0.55, 0], null, 8);
      addCyl(floatGroup, 2.5, 2.55, 0.14, "#e39b2d", [0, -0.75, 0], null, 8, {
        metalness: 0.4,
        roughness: 0.35
      });
      addCyl(floatGroup, 2.3, 1.05, 1.35, "#745840", [0, -1.85, 0], null, 7);

      // 底部發光飛行石核心 (Levitation Crystal Core)
      const crystalCore = new THREE.Mesh(
        new THREE.OctahedronGeometry(island.id === "hub" ? 0.85 : 0.58, 0),
        getMat(island.crystal, {
          emissive: island.crystal,
          emissiveIntensity: 0.75,
          roughness: 0.15
        })
      );
      crystalCore.position.set(0, -2.75, 0);
      floatGroup.add(crystalCore);

      // 島底專屬托島雲朵墊
      const underCloud = new THREE.Group();
      underCloud.position.set(0, -2.1, 0);
      [
        [2.6, 0, -0.3, 0.85],
        [-2.5, 0.1, 0.4, 0.8],
        [0.4, -0.2, 2.5, 0.75],
        [-0.5, -0.1, -2.5, 0.75]
      ].forEach(([cx, cy, cz, cr]) => {
        const m = new THREE.Mesh(
          new THREE.IcosahedronGeometry(cr, 1),
          getMat("#ffffff", { transparent: true, opacity: 0.88, roughness: 1 })
        );
        m.position.set(cx, cy, cz);
        underCloud.add(m);
      });
      floatGroup.add(underCloud);

      // 3. 島面裝飾：邊緣綠樹與松樹
      const contentGroup = new THREE.Group();
      contentGroup.position.y = ISLAND_HEIGHT + 0.08;
      floatGroup.add(contentGroup);

      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * Math.PI * 2 + 0.25;
        // 避開正前方橋樑與後方建築正中央
        if (Math.sin(ang) < -0.55 && Math.abs(Math.cos(ang)) < 0.75) continue;
        const r = 3.85 + (a % 2) * 0.15;
        addTree(
          contentGroup,
          [Math.cos(ang) * r, 0, Math.sin(ang) * r],
          0.55 + (a % 3) * 0.08,
          a % 3 === 0 ? "pine" : "round"
        );
      }

      // 4. 建造該社團專屬微縮場景
      if (IslandBuilders[island.id]) {
        IslandBuilders[island.id](contentGroup, animList, windowMat);
      }

      // 5. 放置隱藏尋寶吉祥物「馬鳴小天馬」
      const ponyAngle = idx * 1.1 + 0.6;
      createMascotPony(
        island.id,
        [Math.cos(ponyAngle) * 3.1, 0, Math.sin(ponyAngle) * 3.1],
        animList,
        interactiveMeshes
      );
      contentGroup.add(interactiveMeshes[interactiveMeshes.length - 1].parent);

      // 6. 上課中 LIVE 動態光環（當符合時段時顯示）
      const liveRingGroup = new THREE.Group();
      liveRingGroup.position.set(0, ISLAND_HEIGHT + 0.15, 0);
      const ringMesh = new THREE.Mesh(
        new THREE.RingGeometry(4.45, 4.72, 32),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(island.color),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85
        })
      );
      ringMesh.rotation.x = -Math.PI / 2;
      liveRingGroup.add(ringMesh);
      liveRingGroup.visible = false;
      floatGroup.add(liveRingGroup);
      liveRings[island.id] = liveRingGroup;

      // 7. 點擊與 Hover 感應柱
      const hitCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(ISLAND_RADIUS, ISLAND_RADIUS * 0.7, 4.2, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitCyl.position.y = 0.6;
      hitCyl.userData = { type: "island", islandId: island.id };
      floatGroup.add(hitCyl);
      interactiveMeshes.push(hitCyl);

      // 8. HTML 3D 浮動名牌
      const el = document.createElement("button");
      el.className = "nameplate";
      el.style.setProperty("--c", island.color);
      el.innerHTML = `
        <span class="dot"></span>
        <span>${island.short}</span>
        <em>${island.badge}</em>
        <span class="live-pill" style="display:none">LIVE 上課中</span>
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

    // =========================================================
    // 雲海空橋 (Sky Bridges connecting Central Hub to 8 Club Islands)
    // =========================================================
    outerIslands.forEach((island, idx) => {
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
          ISLAND_HEIGHT +
          0.6 * (1 - u) +
          (ISLAND_HEIGHT + targetY) * u +
          Math.sin(u * Math.PI) * 0.75;
        addBox(
          bridgeGroup,
          [0.24, 0.06, 0.95],
          p % 2 === 0 ? "#d6ab76" : "#c4925a",
          [r, archY, 0]
        );
        if (p % 4 === 0) {
          addBox(bridgeGroup, [0.06, 0.36, 0.06], "#8d6e4f", [r, archY + 0.18, 0.44]);
          addBox(bridgeGroup, [0.06, 0.36, 0.06], "#8d6e4f", [r, archY + 0.18, -0.44]);
        }
      }
    });

    // =========================================================
    // 跨島串聯虛線光弧 (Cross-Island Sky Links)
    // =========================================================
    const linksGroup = new THREE.Group();
    linksGroup.visible = false;
    scene.add(linksGroup);
    const linkLabels = [];

    window.MMPS_LINKS.forEach((lnk) => {
      const p1 = ISLAND_POS[lnk.from];
      const p2 = ISLAND_POS[lnk.to];
      if (!p1 || !p2) return;
      const mid = [(p1[0] + p2[0]) / 2, Math.max(p1[1], p2[1]) + 5.2, (p1[2] + p2[2]) / 2];
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(p1[0], p1[1] + 2.2, p1[2]),
        new THREE.Vector3(mid[0], mid[1], mid[2]),
        new THREE.Vector3(p2[0], p2[1] + 2.2, p2[2])
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.075, 8, false);
      const tubeMesh = new THREE.Mesh(
        tubeGeo,
        getMat("#e39b2d", { emissive: "#e39b2d", emissiveIntensity: 0.45 })
      );
      linksGroup.add(tubeMesh);

      const lbl = document.createElement("div");
      lbl.className = "link-label";
      lbl.style.display = "none";
      lbl.textContent = lnk.label;
      labelLayerEl.appendChild(lbl);
      linkLabels.push({ el: lbl, pos: new THREE.Vector3(mid[0], mid[1] + 0.4, mid[2]) });
    });

    // =========================================================
    // 「天空之城」立體多層雲海、飛空艇與熱氣球
    // =========================================================
    const cloudMat = getMat("#ffffff", { transparent: true, opacity: 0.9, roughness: 1 });
    const clouds = [];

    // 環繞浮空群島的 38 朵立體蓬鬆雲團（高低錯落）
    for (let i = 0; i < 38; i++) {
      const cg = new THREE.Group();
      const puffs = [
        [0, 0, 0, 1.5],
        [1.3, -0.2, 0.2, 1.1],
        [-1.25, -0.25, -0.1, 1.15],
        [0.3, 0.55, 0.15, 1.05],
        [-0.4, -0.1, 0.9, 0.95]
      ];
      puffs.forEach(([px, py, pz, pr]) => {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(pr, 1), cloudMat);
        m.position.set(px, py, pz);
        cg.add(m);
      });
      const isDeep = i < 22;
      const orbitR = isDeep ? 6 + (i * 7) % 34 : 21 + (i * 11) % 24;
      const orbitY = isDeep ? -4.8 - (i % 5) * 1.4 : 5.5 + (i % 4) * 2.5;
      const scale = isDeep ? 1.35 + (i % 4) * 0.35 : 0.75 + (i % 3) * 0.25;
      cg.scale.setScalar(scale);
      scene.add(cg);
      clouds.push({
        group: cg,
        r: orbitR,
        y: orbitY,
        angle: (i * Math.PI * 2) / 19,
        speed: (0.012 + (i % 5) * 0.004) * (i % 2 === 0 ? 1 : -1)
      });
    }

    // 建造 2 艘「天空之城復古飛空艇 (Laputa Sky Airships)」
    for (let s = 0; s < 2; s++) {
      const ship = new THREE.Group();
      const balloon = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 18, 14),
        getMat(s === 0 ? "#e76f51" : "#2f7fb5")
      );
      balloon.scale.set(0.85, 0.85, 1.85);
      balloon.position.y = 0.9;
      ship.add(balloon);

      // 金色環帶與吊艙
      addBox(ship, [1.9, 0.12, 0.35], "#ffd166", [0, 0.9, 0]);
      addBox(ship, [0.55, 0.38, 1.4], "#8d5b4c", [0, 0, 0]);
      // 旋轉螺旋槳
      const prop = addBox(ship, [0.75, 0.08, 0.06], "#ffd166", [0, 0.1, -0.78]);
      scene.add(ship);

      const shipR = 23 + s * 6;
      const shipY = 6.2 + s * 2.4;
      const dir = s === 0 ? 1 : -1;
      animList.push((t) => {
        const ang = t * 0.06 * dir + s * Math.PI;
        ship.position.set(
          Math.cos(ang) * shipR,
          shipY + Math.sin(t * 1.5 + s) * 0.35,
          Math.sin(ang) * shipR
        );
        ship.rotation.y = -ang + (dir > 0 ? 0 : Math.PI);
        prop.rotation.z = t * 14;
      });
    }

    // 建造 3 顆彩色熱氣球
    ["#ffbe0b", "#ff006e", "#2a9d8f"].forEach((bColor, idx) => {
      const balloon = new THREE.Group();
      addSphere(balloon, 0.85, bColor, [0, 1.1, 0], 16);
      addCyl(balloon, 0.32, 0.22, 0.35, bColor, [0, 0.35, 0], null, 12);
      addBox(balloon, [0.34, 0.26, 0.34], "#a47148", [0, -0.1, 0]);
      scene.add(balloon);

      const br = 20 + idx * 5;
      const by = 4.5 + idx * 1.8;
      animList.push((t) => {
        const ang = -t * 0.035 + idx * 2.1;
        balloon.position.set(
          Math.cos(ang) * br,
          by + Math.sin(t * 1.1 + idx) * 0.55,
          Math.sin(ang) * br
        );
      });
    });

    // =========================================================
    // 鏡頭控制與互動狀態 (Orbit + Pan + Zoom + FlyTo)
    // =========================================================
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

      // 滑鼠懸停 Raycast
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
          if (ud.type === "mascot") {
            ud.jumpUntil = performance.now() + 900;
            callbacks.onFindMascot(ud.islandId);
          } else if (ud.type === "island") {
            callbacks.onSelectIsland(ud.islandId);
          }
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

    
    // =========================================================
    // 漫遊模式：可操控小學生探險家 (RPG Third-Person Controller)
    // =========================================================
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, ISLAND_HEIGHT + 0.1, 2.2); // 初始在主島中央
    playerGroup.visible = false;
    scene.add(playerGroup);

    // 玩家身體組件
    const pBody = new THREE.Group();
    playerGroup.add(pBody);

    // 雙腳
    const pLegL = new THREE.Group();
    pLegL.position.set(-0.08, 0.24, 0);
    addBox(pLegL, [0.1, 0.26, 0.12], "#1d3557", [0, -0.13, 0]);
    pBody.add(pLegL);

    const pLegR = new THREE.Group();
    pLegR.position.set(0.08, 0.24, 0);
    addBox(pLegR, [0.1, 0.26, 0.12], "#1d3557", [0, -0.13, 0]);
    pBody.add(pLegR);

    // 軀幹（亮黃/藍色活潑休閒 T-shirt）
    addBox(pBody, [0.32, 0.34, 0.2], "#e63946", [0, 0.42, 0]);

    // 黃色雙肩書包
    addBox(pBody, [0.26, 0.28, 0.12], "#ffd166", [0, 0.42, -0.14]);

    // 雙手
    const pArmL = new THREE.Group();
    pArmL.position.set(-0.21, 0.52, 0);
    addBox(pArmL, [0.08, 0.26, 0.09], "#e63946", [0, -0.12, 0]);
    pBody.add(pArmL);

    const pArmR = new THREE.Group();
    pArmR.position.set(0.21, 0.52, 0);
    addBox(pArmR, [0.08, 0.26, 0.09], "#e63946", [0, -0.12, 0]);
    pBody.add(pArmR);

    // 頭部與小鴨舌帽
    addSphere(pBody, 0.17, "#f4c89e", [0, 0.74, 0], 14);
    addSphere(pBody, 0.175, "#2b2018", [0, 0.77, -0.02], 14);
    addCyl(pBody, 0.176, 0.176, 0.06, "#2a9d8f", [0, 0.85, 0], null, 14);
    addBox(pBody, [0.22, 0.03, 0.15], "#2a9d8f", [0, 0.84, 0.14]);

    // 腳底陰影圓盤
    const pShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.35, 16),
      new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.35, depthWrite: false })
    );
    pShadow.rotation.x = -Math.PI / 2;
    pShadow.position.y = 0.015;
    playerGroup.add(pShadow);

    // 漫遊控制狀態
    const roamState = {
      active: false,
      x: 0,
      z: 2.2,
      y: ISLAND_HEIGHT + 0.1,
      vy: 0,
      onGround: true,
      yaw: 0,
      speed: 0,
      runAnim: 0,
      keys: { forward: false, backward: false, left: false, right: false, jump: false, sprint: false },
      nearIsland: "hub"
    };

    // 鍵盤監聽
    window.addEventListener("keydown", (e) => {
      if (!roamState.active) return;
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
      if (e.code === "KeyE") {
        if (callbacks.onPlayerInteract) callbacks.onPlayerInteract(roamState.nearIsland);
      }
    });

    window.addEventListener("keyup", (e) => {
      if (!roamState.active) return;
      if (e.code === "KeyW" || e.code === "ArrowUp") roamState.keys.forward = false;
      if (e.code === "KeyS" || e.code === "ArrowDown") roamState.keys.backward = false;
      if (e.code === "KeyA" || e.code === "ArrowLeft") roamState.keys.left = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") roamState.keys.right = false;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") roamState.keys.sprint = false;
    });

    // 地形高度與島嶼/橋樑判定
    function getGroundHeight(x, z) {
      // 1. 中央主島
      const dHub = Math.hypot(x, z);
      if (dHub <= ISLAND_RADIUS * 0.96) {
        return { y: ISLAND_HEIGHT + 0.1, island: "hub", valid: true };
      }

      // 2. 8 座社團環島
      for (let i = 0; i < outerIslands.length; i++) {
        const item = outerIslands[i];
        const pos = ISLAND_POS[item.id];
        const dist = Math.hypot(x - pos[0], z - pos[2]);
        if (dist <= ISLAND_RADIUS * 0.96) {
          return { y: ISLAND_HEIGHT + pos[1] + 0.1, island: item.id, valid: true };
        }
      }

      // 3. 八條雲海空橋 (Bridge Connection)
      const r = Math.hypot(x, z);
      const angle = Math.atan2(z, x); // -PI ~ PI
      const startR = ISLAND_RADIUS * 0.88;
      const endR = RING_RADIUS - ISLAND_RADIUS * 0.88;

      if (r >= startR && r <= endR + 1.2) {
        for (let i = 0; i < outerIslands.length; i++) {
          const item = outerIslands[i];
          const bAngle = ISLAND_ANGLES[item.id];
          let diff = Math.abs(angle - bAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

          const maxAngularWidth = 0.85 / r; // 橋面寬度約 0.95
          if (diff <= maxAngularWidth) {
            const u = Math.min(1, Math.max(0, (r - startR) / (endR - startR)));
            const targetY = ISLAND_POS[item.id][1];
            const arch = Math.sin(u * Math.PI) * 0.75;
            const y = (ISLAND_HEIGHT + 0.1) * (1 - u) + (ISLAND_HEIGHT + targetY + 0.1) * u + arch;
            return { y: y, island: item.id, valid: true };
          }
        }
      }

      // 邊緣或雲海安全托底
      return { y: ISLAND_HEIGHT + 0.1, island: null, valid: false };
    }

    // 外部控制 API
    const api = {
      selectedId: null,
      hoveredId: null,
      animateEnabled: true,
      showLabels: true,
      showLinks: false,
      activeLiveIds: new Set(["hub"]),

            roamMode: false,
      setRoamMode(enabled) {
        this.roamMode = enabled;
        roamState.active = enabled;
        playerGroup.visible = enabled;
        if (enabled) {
          camState.goalRadius = 9.2;
          camState.goalPhi = 0.96;
        } else {
          this.focusIsland(this.selectedId, "panorama");
        }
      },
      setVirtualInput(key, val) {
        if (roamState.keys[key] !== undefined) {
          roamState.keys[key] = val;
        }
        if (key === "jump" && val && roamState.onGround) {
          roamState.vy = 0.19;
          roamState.onGround = false;
        }
      },
      triggerNearInteract() {
        if (callbacks.onPlayerInteract) callbacks.onPlayerInteract(roamState.nearIsland);
      },

      focusIsland(id, viewMode = "panorama") {
        this.selectedId = id;
        if (!id) {
          if (viewMode === "bird") {
            camState.goalTarget.set(0, 0, 0);
            camState.goalPhi = 0.24;
            camState.goalRadius = 46;
          } else {
            camState.goalTarget.set(0, 0.8, 0);
            camState.goalPhi = 0.92;
            camState.goalRadius = 41;
          }
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
        } else if (mode === "panorama") {
          camState.goalTarget.set(0, 0.8, 0);
          camState.goalPhi = 0.92;
          camState.goalRadius = 41;
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

      setLiveIslands(ids) {
        this.activeLiveIds = new Set(ids);
        Object.keys(liveRings).forEach((k) => {
          const isLive = this.activeLiveIds.has(k) && k !== "hub";
          liveRings[k].visible = isLive;
          const pill = labelEls[k]?.querySelector(".live-pill");
          if (pill) pill.style.display = isLive ? "inline-flex" : "none";
        });
      },

      setTimeTheme(theme) {
        const themes = {
          day: {
            bg: "#bfe3f2",
            fog: "#cde8f2",
            sun: "#fff1d6",
            sunI: 1.45,
            hemiSky: "#cfe8ff",
            hemiGround: "#b98e5a",
            winEmissive: 0.08
          },
          dusk: {
            bg: "#f4c7a8",
            fog: "#f1cdb4",
            sun: "#ffb27a",
            sunI: 1.25,
            hemiSky: "#f6c3a4",
            hemiGround: "#7a5a48",
            winEmissive: 0.45
          },
          night: {
            bg: "#1b2644",
            fog: "#223056",
            sun: "#9ab4ff",
            sunI: 0.65,
            hemiSky: "#4f62a3",
            hemiGround: "#252b48",
            winEmissive: 0.95
          }
        };
        const cfg = themes[theme] || themes.day;
        scene.background.set(cfg.bg);
        scene.fog.color.set(cfg.fog);
        dirLight.color.set(cfg.sun);
        dirLight.intensity = cfg.sunI;
        hemiLight.color.set(cfg.hemiSky);
        hemiLight.groundColor.set(cfg.hemiGround);
        windowMat.emissiveIntensity = cfg.winEmissive;
        document.body.style.background = cfg.bg;
      }
    };

    // 主動畫迴圈
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

        // 雲海緩慢漂流
        clouds.forEach((c) => {
          const a = c.angle + clockTime * c.speed;
          c.group.position.set(
            Math.cos(a) * c.r,
            c.y + Math.sin(clockTime * 0.8 + c.angle) * 0.25,
            Math.sin(a) * c.r
          );
        });
      }

      // 浮空島上下輕盈懸浮與選取抬升
      Object.keys(islandGroups).forEach((id) => {
        const ig = islandGroups[id];
        const isActive = id === api.selectedId || id === api.hoveredId;
        const targetLift = id === api.selectedId ? 0.55 : id === api.hoveredId ? 0.32 : 0;
        ig.hoverLift += (targetLift - ig.hoverLift) * 0.12;
        const bob = api.animateEnabled ? Math.sin(clockTime * 1.6 + ig.phase) * 0.16 : 0;
        ig.floatGroup.position.y = bob + ig.hoverLift;
        ig.crystalCore.rotation.y = clockTime * 1.4 + ig.phase;

        if (liveRings[id].visible) {
          liveRings[id].rotation.z = clockTime * 1.2;
          const s = 1 + Math.sin(clockTime * 4) * 0.04;
          liveRings[id].scale.set(s, 1, s);
        }

        // 更新 HTML 3D 名牌投影位置
        const p = ISLAND_POS[id];
        tempVec.set(
          p[0],
          p[1] + ig.floatGroup.position.y + ISLAND_HEIGHT + (id === "hub" ? 3.8 : 3.2),
          p[2]
        );
        tempVec.project(camera);
        const el = labelEls[id];
        if (tempVec.z > 1) {
          el.style.display = "none";
        } else {
          el.style.display = "inline-flex";
          const x = (tempVec.x * 0.5 + 0.5) * window.innerWidth;
          const y = (-tempVec.y * 0.5 + 0.5) * window.innerHeight;
          el.style.left = `${x}px`;
          el.style.top = `${y}px`;
        }
      });

      // 更新跨島連線標籤位置
      if (api.showLinks) {
        linkLabels.forEach((l) => {
          tempVec.copy(l.pos).project(camera);
          if (tempVec.z > 1) {
            l.el.style.display = "none";
          } else {
            l.el.style.display = "block";
            l.el.style.left = `${(tempVec.x * 0.5 + 0.5) * window.innerWidth}px`;
            l.el.style.top = `${(-tempVec.y * 0.5 + 0.5) * window.innerHeight}px`;
          }
        });
      }

      // 鏡頭平滑阻尼插值
      camState.theta += (camState.goalTheta - camState.theta) * 0.085;
      camState.phi += (camState.goalPhi - camState.phi) * 0.085;
      camState.radius += (camState.goalRadius - camState.radius) * 0.085;
      camState.target.lerp(camState.goalTarget, 0.085);

      const cx =
        camState.target.x + camState.radius * Math.sin(camState.phi) * Math.sin(camState.theta);
      const cy = camState.target.y + camState.radius * Math.cos(camState.phi);
      const cz =
        camState.target.z + camState.radius * Math.sin(camState.phi) * Math.cos(camState.theta);
      camera.position.set(cx, cy, cz);
      camera.lookAt(camState.target);

      
      // 漫遊模式角色運動更新
      if (roamState.active) {
        const moveSpeed = (roamState.keys.sprint ? 0.14 : 0.082);
        let moveX = 0;
        let moveZ = 0;

        // 依相機水平朝向計算前後左右
        const forwardTheta = camState.theta;
        const sinT = Math.sin(forwardTheta);
        const cosT = Math.cos(forwardTheta);

        if (roamState.keys.forward) {
          moveX -= sinT;
          moveZ -= cosT;
        }
        if (roamState.keys.backward) {
          moveX += sinT;
          moveZ += cosT;
        }
        if (roamState.keys.left) {
          moveX -= cosT;
          moveZ += sinT;
        }
        if (roamState.keys.right) {
          moveX += cosT;
          moveZ -= sinT;
        }

        const len = Math.hypot(moveX, moveZ);
        if (len > 0.001) {
          moveX = (moveX / len) * moveSpeed;
          moveZ = (moveZ / len) * moveSpeed;

          // 碰撞與防墜判定：預先探測下一步地面
          const nextCheck = getGroundHeight(roamState.x + moveX, roamState.z + moveZ);
          if (nextCheck.valid) {
            roamState.x += moveX;
            roamState.z += moveZ;
          } else {
            // 輕微阻擋邊界，不讓玩家跌下雲海
            const checkX = getGroundHeight(roamState.x + moveX, roamState.z);
            if (checkX.valid) roamState.x += moveX;
            const checkZ = getGroundHeight(roamState.x, roamState.z + moveZ);
            if (checkZ.valid) roamState.z += moveZ;
          }

          roamState.yaw = Math.atan2(moveX, moveZ);
          roamState.runAnim += dt * (roamState.keys.sprint ? 18 : 11);
          pLegL.rotation.x = Math.sin(roamState.runAnim) * 0.72;
          pLegR.rotation.x = -Math.sin(roamState.runAnim) * 0.72;
          pArmL.rotation.x = -Math.sin(roamState.runAnim) * 0.65;
          pArmR.rotation.x = Math.sin(roamState.runAnim) * 0.65;
        } else {
          pLegL.rotation.x *= 0.8;
          pLegR.rotation.x *= 0.8;
          pArmL.rotation.x *= 0.8;
          pArmR.rotation.x *= 0.8;
        }

        // 重力與垂直位移
        const ground = getGroundHeight(roamState.x, roamState.z);
        roamState.y += roamState.vy;
        roamState.vy -= 0.012; // 重力加速度

        if (roamState.y <= ground.y) {
          roamState.y = ground.y;
          roamState.vy = 0;
          roamState.onGround = true;
        }

        playerGroup.position.set(roamState.x, roamState.y, roamState.z);
        playerGroup.rotation.y = roamState.yaw;

        // 偵測是否走到某座社團島
        if (ground.island && ground.island !== roamState.nearIsland) {
          roamState.nearIsland = ground.island;
          if (callbacks.onPlayerNearIsland) {
            callbacks.onPlayerNearIsland(ground.island);
          }
        }

        // 第三人稱跟隨相機目標鎖定小學生
        camState.goalTarget.set(roamState.x, roamState.y + 0.85, roamState.z);
      }

      renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);
    return api;
  };
})();
