// 馬鳴國小・天空打字群島 - 國小三年級中英打字課程、鍵位對照與基準題庫
window.TYPING_CONFIG = {
  title: "馬鳴國小・天空打字群島",
  subtitle: "三年級中英打字冒險島・十指鍵盤與注音闖關",
  schoolName: "臺中市外埔區馬鳴國民小學",
  gradeStandard: "國小三年級資訊教育基準",
  coordinates: { lat: 24.324, lon: 120.654, place: "臺中外埔" }
};

// 十指分工顏色與名稱定義
window.FINGER_MAP = {
  L5: { name: "左手小指", hand: "左手", color: "#ef476f", short: "左小" },
  L4: { name: "左手無名指", hand: "左手", color: "#f78c6b", short: "左無" },
  L3: { name: "左手中指", hand: "左手", color: "#ffd166", short: "左中" },
  L2: { name: "左手食指", hand: "左手", color: "#06d6a0", short: "左食" },
  THUMB: { name: "左右大拇指", hand: "雙手", color: "#a855f7", short: "拇指" },
  R2: { name: "右手食指", hand: "右手", color: "#118ab2", short: "右食" },
  R3: { name: "右手中指", hand: "右手", color: "#3a86ff", short: "右中" },
  R4: { name: "右手無名指", hand: "右手", color: "#8338ec", short: "右無" },
  R5: { name: "右手小指", hand: "右手", color: "#ec4899", short: "右小" }
};

// 臺灣標準大千注音鍵盤 4 排配置（含英數、注音、手指分工、聲韻分區）
window.KEYBOARD_ROWS = [
  [
    { code: "Digit1", key: "1", en: "1", zy: "ㄅ", finger: "L5", zone: "initial" },
    { code: "Digit2", key: "2", en: "2", zy: "ㄉ", finger: "L4", zone: "initial" },
    { code: "Digit3", key: "3", en: "3", zy: "ˇ", finger: "L3", zone: "tone", toneName: "三聲 ˇ" },
    { code: "Digit4", key: "4", en: "4", zy: "ˋ", finger: "L2", zone: "tone", toneName: "四聲 ˋ" },
    { code: "Digit5", key: "5", en: "5", zy: "ㄓ", finger: "L2", zone: "initial" },
    { code: "Digit6", key: "6", en: "6", zy: "ˊ", finger: "R2", zone: "tone", toneName: "二聲 ˊ" },
    { code: "Digit7", key: "7", en: "7", zy: "˙", finger: "R2", zone: "tone", toneName: "輕聲 ˙" },
    { code: "Digit8", key: "8", en: "8", zy: "ㄚ", finger: "R3", zone: "final" },
    { code: "Digit9", key: "9", en: "9", zy: "ㄞ", finger: "R4", zone: "final" },
    { code: "Digit0", key: "0", en: "0", zy: "ㄢ", finger: "R5", zone: "final" },
    { code: "Minus", key: "-", en: "-", zy: "ㄦ", finger: "R5", zone: "final" }
  ],
  [
    { code: "KeyQ", key: "q", en: "Q", zy: "ㄆ", finger: "L5", zone: "initial" },
    { code: "KeyW", key: "w", en: "W", zy: "ㄊ", finger: "L4", zone: "initial" },
    { code: "KeyE", key: "e", en: "E", zy: "ㄍ", finger: "L3", zone: "initial" },
    { code: "KeyR", key: "r", en: "R", zy: "ㄐ", finger: "L2", zone: "initial" },
    { code: "KeyT", key: "t", en: "T", zy: "ㄔ", finger: "L2", zone: "initial" },
    { code: "KeyY", key: "y", en: "Y", zy: "ㄗ", finger: "R2", zone: "initial" },
    { code: "KeyU", key: "u", en: "U", zy: "ㄧ", finger: "R2", zone: "medial" },
    { code: "KeyI", key: "i", en: "I", zy: "ㄛ", finger: "R3", zone: "final" },
    { code: "KeyO", key: "o", en: "O", zy: "ㄟ", finger: "R4", zone: "final" },
    { code: "KeyP", key: "p", en: "P", zy: "ㄣ", finger: "R5", zone: "final" }
  ],
  [
    { code: "KeyA", key: "a", en: "A", zy: "ㄇ", finger: "L5", zone: "initial", home: true },
    { code: "KeyS", key: "s", en: "S", zy: "ㄋ", finger: "L4", zone: "initial", home: true },
    { code: "KeyD", key: "d", en: "D", zy: "ㄎ", finger: "L3", zone: "initial", home: true },
    { code: "KeyF", key: "f", en: "F", zy: "ㄑ", finger: "L2", zone: "initial", home: true, bump: true },
    { code: "KeyG", key: "g", en: "G", zy: "ㄕ", finger: "L2", zone: "initial" },
    { code: "KeyH", key: "h", en: "H", zy: "ㄘ", finger: "R2", zone: "initial" },
    { code: "KeyJ", key: "j", en: "J", zy: "ㄨ", finger: "R2", zone: "medial", home: true, bump: true },
    { code: "KeyK", key: "k", en: "K", zy: "ㄜ", finger: "R3", zone: "final", home: true },
    { code: "KeyL", key: "l", en: "L", zy: "ㄠ", finger: "R4", zone: "final", home: true },
    { code: "Semicolon", key: ";", en: ";", zy: "ㄤ", finger: "R5", zone: "final", home: true }
  ],
  [
    { code: "KeyZ", key: "z", en: "Z", zy: "ㄈ", finger: "L5", zone: "initial" },
    { code: "KeyX", key: "x", en: "X", zy: "ㄌ", finger: "L4", zone: "initial" },
    { code: "KeyC", key: "c", en: "C", zy: "ㄏ", finger: "L3", zone: "initial" },
    { code: "KeyV", key: "v", en: "V", zy: "ㄒ", finger: "L2", zone: "initial" },
    { code: "KeyB", key: "b", en: "B", zy: "ㄖ", finger: "L2", zone: "initial" },
    { code: "KeyN", key: "n", en: "N", zy: "ㄙ", finger: "R2", zone: "initial" },
    { code: "KeyM", key: "m", en: "M", zy: "ㄩ", finger: "R2", zone: "medial" },
    { code: "Comma", key: ",", en: ",", zy: "ㄝ", finger: "R3", zone: "final" },
    { code: "Period", key: ".", en: ".", zy: "ㄡ", finger: "R4", zone: "final" },
    { code: "Slash", key: "/", en: "/", zy: "ㄥ", finger: "R5", zone: "final" }
  ]
];

// 建立快速查詢索引（注音 <-> 按鍵、英數 <-> 按鍵）
window.ZY_TO_KEYOBJ = {};
window.EN_TO_KEYOBJ = {};
window.CODE_TO_KEYOBJ = {};

window.KEYBOARD_ROWS.forEach((row) => {
  row.forEach((k) => {
    if (k.zy) window.ZY_TO_KEYOBJ[k.zy] = k;
    window.EN_TO_KEYOBJ[k.en.toUpperCase()] = k;
    window.EN_TO_KEYOBJ[k.key.toLowerCase()] = k;
    window.CODE_TO_KEYOBJ[k.code] = k;
  });
});

// 空白鍵（一聲）與 Shift 鍵定義
const SPACE_KEYOBJ = {
  code: "Space",
  key: " ",
  en: "Space 空白鍵",
  zy: "ˉ",
  finger: "THUMB",
  zone: "tone",
  toneName: "一聲（空白鍵）"
};
window.ZY_TO_KEYOBJ["ˉ"] = SPACE_KEYOBJ;
window.ZY_TO_KEYOBJ[" "] = SPACE_KEYOBJ;
window.EN_TO_KEYOBJ[" "] = SPACE_KEYOBJ;
window.CODE_TO_KEYOBJ["Space"] = SPACE_KEYOBJ;

// 常用國字轉注音拆解字典（供免切輸入法直通車與逐鍵導引使用）
window.CHAR_ZHUYIN_DICT = {
  媽: "ㄇㄚˉ", 爸: "ㄅㄚˋ", 好: "ㄏㄠˇ", 你: "ㄋㄧˇ", 我: "ㄨㄛˇ",
  他: "ㄊㄚˉ", 書: "ㄕㄨˉ", 花: "ㄏㄨㄚˉ", 水: "ㄕㄨㄟˇ", 火: "ㄏㄨㄛˇ",
  山: "ㄕㄢˉ", 風: "ㄈㄥˉ", 雲: "ㄩㄣˊ", 雨: "ㄩˇ", 星: "ㄒㄧㄥˉ",
  光: "ㄍㄨㄤˉ", 馬: "ㄇㄚˇ", 魚: "ㄩˊ", 鳥: "ㄋㄧㄠˇ", 愛: "ㄞˋ",
  笑: "ㄒㄧㄠˋ", 跑: "ㄆㄠˇ", 跳: "ㄊㄧㄠˋ", 樂: "ㄌㄜˋ",
  學: "ㄒㄩㄝˊ", 校: "ㄒㄧㄠˋ", 老: "ㄌㄠˇ", 師: "ㄕˉ", 同: "ㄊㄨㄥˊ",
  電: "ㄉㄧㄢˋ", 腦: "ㄋㄠˇ", 鳴: "ㄇㄧㄥˊ", 開: "ㄎㄞˉ", 心: "ㄒㄧㄣˉ",
  太: "ㄊㄞˋ", 陽: "ㄧㄤˊ", 月: "ㄩㄝˋ", 亮: "ㄌㄧㄤˋ", 彩: "ㄘㄞˇ",
  虹: "ㄏㄨㄥˊ", 朵: "ㄉㄨㄛˇ", 運: "ㄩㄣˋ", 動: "ㄉㄨㄥˋ", 讀: "ㄉㄨˊ",
  朋: "ㄆㄥˊ", 友: "ㄧㄡˇ", 唱: "ㄔㄤˋ", 歌: "ㄍㄜˉ", 畫: "ㄏㄨㄚˋ",
  下: "ㄒㄧㄚˋ", 課: "ㄎㄜˋ", 早: "ㄗㄠˇ", 安: "ㄢˉ", 謝: "ㄒㄧㄝˋ",
  加: "ㄐㄧㄚˉ", 油: "ㄧㄡˊ", 寶: "ㄅㄠˇ", 貝: "ㄅㄟˋ",
  國: "ㄍㄨㄛˊ", 小: "ㄒㄧㄠˇ", 今: "ㄐㄧㄣˉ", 天: "ㄊㄧㄢˉ", 氣: "ㄑㄧˋ",
  真: "ㄓㄣˉ", 大: "ㄉㄚˋ", 家: "ㄐㄧㄚˉ", 一: "ㄧˉ", 起: "ㄑㄧˇ",
  來: "ㄌㄞˊ", 玩: "ㄨㄢˊ", 上: "ㄕㄤˋ", 是: "ㄕˋ", 打: "ㄉㄚˇ",
  字: "ㄗˋ", 高: "ㄍㄠˉ", 手: "ㄕㄡˇ", 認: "ㄖㄣˋ", 習: "ㄒㄧˊ",
  最: "ㄗㄨㄟˋ", 快: "ㄎㄨㄞˋ", 去: "ㄑㄩˋ", 操: "ㄘㄠˉ", 場: "ㄔㄤˇ",
  步: "ㄅㄨˋ", 有: "ㄧㄡˇ", 趣: "ㄑㄩˋ", 的: "ㄉㄜ˙", 教: "ㄐㄧㄠˋ",
  導: "ㄉㄠˇ", 年: "ㄋㄧㄢˊ", 甲: "ㄐㄧㄚˇ", 班: "ㄅㄢˉ", 木: "ㄇㄨˋ",
  頭: "ㄊㄡˊ", 人: "ㄖㄣˊ", 每: "ㄇㄟˇ", 級: "ㄐㄧˊ", 棒: "ㄅㄤˋ",
  糖: "ㄊㄤˊ", 顆: "ㄎㄜˉ", 金: "ㄐㄧㄣˉ", 沒: "ㄇㄟˊ", 問: "ㄨㄣˋ",
  題: "ㄊㄧˊ", 創: "ㄔㄨㄤˋ", 客: "ㄎㄜˋ", 分: "ㄈㄣˉ", 過: "ㄍㄨㄛˋ",
  關: "ㄍㄨㄢˉ"
};

// =========================================================
// 九座 3D 打字浮空島完整設定與國小三年級過關基準
// =========================================================
window.MMPS_ISLANDS = [
  {
    id: "hub",
    order: 0,
    short: "0.鍵盤主島",
    name: "鍵盤王國主島・英雄聖殿",
    badge: "新手基地",
    category: "總覽與排行榜",
    color: "#2f7fb5",
    grass: "#79bf66",
    rock: "#a88359",
    crystal: "#5ad2ff",
    tagline: "認識十指分工、定位凸點 F 與 J，查看全島英雄排行榜與星級證書！",
    mode: "hub",
    duration: 60,
    unit: "分",
    thresholds: { bronze: 100, silver: 300, gold: 600, minAcc: 80 },
    ruleDesc: "前往周圍 8 座打字任務島闖關，累積星星與積分即可登上全校英雄榜！",
    sceneDesc: "中央佇立著巨型 3D 發光鍵盤紀念碑與 F、J 金色定位雙塔，小學生們在此暖身手指準備出發闖關！",
    tips: [
      "左手食指永遠先找有小凸點的【F（ㄑ）】鍵，右手食指找有小凸點的【J（ㄨ）】鍵！",
      "打字時手腕輕輕浮起、眼睛盡量看螢幕，看下方發光鍵盤提示哪一隻手指該出動。",
      "每座島都有 ⭐銅星（及格）、⭐⭐銀星（熟練）、⭐⭐⭐金星（大師）三種榮耀！"
    ],
    npcBenchmarks: [
      { name: "🥇 天空島主 小天馬", score: 24, stars: 3, acc: 98, detail: "8 島全金星大滿貫" },
      { name: "🥈 鍵盤隊長 阿豪", score: 16, stars: 2, acc: 92, detail: "8 島全銀星達成" },
      { name: "🥉 三年級守衛 小葵", score: 8, stars: 1, acc: 86, detail: "8 島全銅星過關" }
    ],
    prompts: []
  },
  {
    id: "island1",
    order: 1,
    short: "1.基準鍵島",
    name: "島 1：基準鍵定位島（Home Row）",
    badge: "任務 1｜定位",
    category: "英打基礎",
    color: "#10b981",
    grass: "#76c873",
    rock: "#8d775f",
    crystal: "#34d399",
    tagline: "手指回家的路！專練中排 8 顆基準鍵（A S D F 與 J K L ;）。",
    mode: "key_drill",
    duration: 60,
    unit: "鍵",
    thresholds: { bronze: 15, silver: 25, gold: 35, minAcc: 85 },
    ruleDesc: "限時 60 秒｜⭐銅星 15 鍵（約4秒1鍵）・⭐⭐銀星 25 鍵・⭐⭐⭐金星 35 鍵｜正確率 ≥ 85%",
    sceneDesc: "八座刻著 A S D F 與 J K L ; 的發光中排石碑環繞島上，F 與 J 石碑頂端散發金色定位光芒！",
    tips: [
      "先把左手四指輕放在 A、S、D、F，右手四指輕放在 J、K、L、; 上。",
      "摸摸看 F 和 J 上面是不是有一條小凸起？這就是不用低頭也能找到位置的秘密武器！",
      "每按完一顆鍵，手指都要乖乖回到這 8 顆基準鍵上面喔！"
    ],
    npcBenchmarks: [
      { name: "🥇 守關隊長 小天馬", score: 36, stars: 3, acc: 97, detail: "36 鍵 / 60秒" },
      { name: "🥈 熟練學長 阿豪", score: 25, stars: 2, acc: 91, detail: "25 鍵 / 60秒" },
      { name: "🥉 新手守衛 機器人", score: 15, stars: 1, acc: 85, detail: "15 鍵 / 60秒 (小三過關基準)" }
    ],
    prompts: [
      { target: "F", hint: "左手食指（有凸點！）" },
      { target: "J", hint: "右手食指（有凸點！）" },
      { target: "D", hint: "左手中指" },
      { target: "K", hint: "右手中指" },
      { target: "S", hint: "左手無名指" },
      { target: "L", hint: "右手無名指" },
      { target: "A", hint: "左手小指" },
      { target: ";", hint: "右手小指（分號鍵）" }
    ]
  },
  {
    id: "island2",
    order: 2,
    short: "2.英打字母島",
    name: "島 2：英打字母冒險島（A–Z 尋寶）",
    badge: "任務 2｜英打",
    category: "英打基礎",
    color: "#3a86ff",
    grass: "#72bf6a",
    rock: "#7d8597",
    crystal: "#60a5fa",
    tagline: "飛向上排與下排！熟悉 A 到 Z 共 26 個英文字母的位置。",
    mode: "key_drill",
    duration: 60,
    unit: "鍵",
    thresholds: { bronze: 12, silver: 22, gold: 32, minAcc: 85 },
    ruleDesc: "限時 60 秒｜⭐銅星 12 鍵（約5秒1鍵）・⭐⭐銀星 22 鍵・⭐⭐⭐金星 32 鍵｜正確率 ≥ 85%",
    sceneDesc: "26 顆巨型彩色 3D 英文字母方塊漂浮在花園上空，打字飛空艇穿梭在 QWERTY 雲端航道之間！",
    tips: [
      "上排（Q～P）由基準鍵手指往上伸出去按，按完立刻縮回中間排！",
      "下排（Z～M）由基準鍵手指往下伸出去按，看螢幕下方的發光鍵盤就能秒找到位置。",
      "不用管大小寫，直接按下對應的英文字母鍵就可以得分！"
    ],
    npcBenchmarks: [
      { name: "🥇 守關隊長 小天馬", score: 34, stars: 3, acc: 96, detail: "34 鍵 / 60秒" },
      { name: "🥈 熟練學長 阿豪", score: 22, stars: 2, acc: 90, detail: "22 鍵 / 60秒" },
      { name: "🥉 新手守衛 機器人", score: 12, stars: 1, acc: 85, detail: "12 鍵 / 60秒 (小三過關基準)" }
    ],
    prompts: [
      { target: "A", hint: "Apple 蘋果" }, { target: "B", hint: "Bear 小熊" },
      { target: "C", hint: "Cat 貓咪" }, { target: "D", hint: "Dog 小狗" },
      { target: "E", hint: "Egg 雞蛋" }, { target: "F", hint: "Fish 小魚" },
      { target: "G", hint: "Good 很棒" }, { target: "H", hint: "Hat 帽子" },
      { target: "I", hint: "Ice 冰塊" }, { target: "J", hint: "Jump 跳躍" },
      { target: "K", hint: "Kite 風箏" }, { target: "L", hint: "Lion 獅子" },
      { target: "M", hint: "Milk 牛奶" }, { target: "N", hint: "Nose 鼻子" },
      { target: "O", hint: "Open 打開" }, { target: "P", hint: "Pen 原子筆" },
      { target: "Q", hint: "Queen 女王" }, { target: "R", hint: "Red 紅色" },
      { target: "S", hint: "Sun 太陽" }, { target: "T", hint: "Tree 大樹" },
      { target: "U", hint: "Up 往上" }, { target: "V", hint: "Van 廂型車" },
      { target: "W", hint: "Water 水" }, { target: "X", hint: "Box 盒子" },
      { target: "Y", hint: "Yellow 黃色" }, { target: "Z", hint: "Zoo 動物園" }
    ]
  },
  {
    id: "island3",
    order: 3,
    short: "3.大小寫單字",
    name: "島 3：大小寫與單字島（Shift 魔法）",
    badge: "任務 3｜大小寫",
    category: "英打進階",
    color: "#8338ec",
    grass: "#78be70",
    rock: "#827397",
    crystal: "#c084fc",
    tagline: "學會按住 Shift 打出大寫首字母，挑戰國小三年級常用英文單字！",
    mode: "en_word",
    duration: 60,
    unit: "字母",
    thresholds: { bronze: 20, silver: 35, gold: 50, minAcc: 80 },
    ruleDesc: "限時 60 秒｜⭐銅星 20 字母（約4~5單字）・⭐⭐銀星 35 字母・⭐⭐⭐金星 50 字母｜正確率 ≥ 80%",
    sceneDesc: "雙層大小寫字母魔法城堡佇立島上，按住 Shift 魔法升降梯就能把小寫字母變成大寫皇冠字母！",
    tips: [
      "遇到第一個字是大寫（例如 Apple 的 A），請用小指按住【Shift】不放，再按 A！",
      "接下來的 p-p-l-e 放開 Shift 就能直接打出小寫字母囉！",
      "完成整個單字會自動跳下一題，每打對一個字母都會累計分數！"
    ],
    npcBenchmarks: [
      { name: "🥇 守關隊長 小天馬", score: 52, stars: 3, acc: 95, detail: "52 字母 (約11單字)" },
      { name: "🥈 熟練學長 阿豪", score: 35, stars: 2, acc: 89, detail: "35 字母 (約7單字)" },
      { name: "🥉 新手守衛 機器人", score: 20, stars: 1, acc: 82, detail: "20 字母 (小三過關基準)" }
    ],
    prompts: [
      { target: "Cat", hint: "🐱 貓咪（首字大寫 Shift+C）" },
      { target: "Dog", hint: "🐶 小狗（首字大寫 Shift+D）" },
      { target: "Egg", hint: "🥚 雞蛋（首字大寫 Shift+E）" },
      { target: "Sun", hint: "☀️ 太陽（首字大寫 Shift+S）" },
      { target: "Book", hint: "📖 書本（首字大寫 Shift+B）" },
      { target: "Fish", hint: "🐟 小魚（首字大寫 Shift+F）" },
      { target: "Good", hint: "👍 很棒（首字大寫 Shift+G）" },
      { target: "Star", hint: "⭐ 星星（首字大寫 Shift+S）" },
      { target: "Tree", hint: "🌳 大樹（首字大寫 Shift+T）" },
      { target: "Milk", hint: "🥛 牛奶（首字大寫 Shift+M）" },
      { target: "Lion", hint: "🦁 獅子（首字大寫 Shift+L）" },
      { target: "Bird", hint: "🐦 小鳥（首字大寫 Shift+B）" },
      { target: "Play", hint: "🎮 玩耍（首字大寫 Shift+P）" },
      { target: "Apple", hint: "🍎 蘋果（首字大寫 Shift+A）" },
      { target: "Happy", hint: "😄 開心（首字大寫 Shift+H）" },
      { target: "Water", hint: "💧 飲水（首字大寫 Shift+W）" }
    ]
  },
  {
    id: "island4",
    order: 4,
    short: "4.注音鍵位島",
    name: "島 4：注音鍵位探索島（ㄅㄆㄇ 尋蹤）",
    badge: "任務 4｜注音鍵位",
    category: "中打基礎",
    color: "#f59e0b",
    grass: "#7ec46b",
    rock: "#a68059",
    crystal: "#fcd34d",
    tagline: "解開鍵盤上的注音密碼！由左到右直行背口訣：ㄅㄆㄇㄈ、ㄉㄊㄋㄌ…",
    mode: "zy_key",
    duration: 60,
    unit: "注音",
    thresholds: { bronze: 10, silver: 18, gold: 28, minAcc: 85 },
    ruleDesc: "限時 60 秒｜⭐銅星 10 個注音（約6秒1鍵）・⭐⭐銀星 18 個・⭐⭐⭐金星 28 個｜正確率 ≥ 85%",
    sceneDesc: "左聲母、中介音（ㄧㄨㄩ）、右韻母三色發光圖騰柱矗立島上，注音符號沿著鍵盤直行規律閃耀！",
    tips: [
      "注音在鍵盤上是「直排由上往下、由左往右」排列的！例如最左邊第一排由上到下就是：ㄅ(1)、ㄆ(Q)、ㄇ(A)、ㄈ(Z)！",
      "中間的 U、J、M 就是大家最常找的介音「ㄧ、ㄨ、ㄩ」！",
      "💡 本島內建「免切輸入法直通車」，直接按下對應位置的按鍵即可得分，不怕輸入法卡住！"
    ],
    npcBenchmarks: [
      { name: "🥇 守關隊長 小天馬", score: 30, stars: 3, acc: 96, detail: "30 個注音 / 60秒" },
      { name: "🥈 熟練學長 阿豪", score: 18, stars: 2, acc: 90, detail: "18 個注音 / 60秒" },
      { name: "🥉 新手守衛 機器人", score: 10, stars: 1, acc: 85, detail: "10 個注音 (小三過關基準)" }
    ],
    prompts: [
      { target: "ㄅ", hint: "左邊第1直行最上面（數字 1）" },
      { target: "ㄆ", hint: "ㄅ的下面（英文字母 Q）" },
      { target: "ㄇ", hint: "ㄆ的下面（基準鍵 A）" },
      { target: "ㄈ", hint: "ㄇ的下面（英文字母 Z）" },
      { target: "ㄉ", hint: "左邊第2直行最上面（數字 2）" },
      { target: "ㄊ", hint: "ㄉ的下面（英文字母 W）" },
      { target: "ㄋ", hint: "ㄊ的下面（基準鍵 S）" },
      { target: "ㄌ", hint: "ㄋ的下面（英文字母 X）" },
      { target: "ㄍ", hint: "左邊第3直行（英文字母 E）" },
      { target: "ㄎ", hint: "ㄍ的下面（基準鍵 D）" },
      { target: "ㄏ", hint: "ㄎ的下面（英文字母 C）" },
      { target: "ㄐ", hint: "左食指區（英文字母 R）" },
      { target: "ㄑ", hint: "左食指基準鍵（凸點 F）" },
      { target: "ㄒ", hint: "ㄑ的下面（英文字母 V）" },
      { target: "ㄓ", hint: "左食指最上面（數字 5）" },
      { target: "ㄔ", hint: "ㄓ的下面（英文字母 T）" },
      { target: "ㄕ", hint: "ㄔ的下面（英文字母 G）" },
      { target: "ㄖ", hint: "ㄕ的下面（英文字母 B）" },
      { target: "ㄗ", hint: "右食指區（英文字母 Y）" },
      { target: "ㄘ", hint: "ㄗ的下面（英文字母 H）" },
      { target: "ㄙ", hint: "ㄘ的下面（英文字母 N）" },
      { target: "ㄧ", hint: "介音三兄弟：U 鍵" },
      { target: "ㄨ", hint: "介音三兄弟：右食指凸點 J 鍵" },
      { target: "ㄩ", hint: "介音三兄弟：M 鍵" },
      { target: "ㄚ", hint: "右邊韻母區（數字 8）" },
      { target: "ㄛ", hint: "ㄚ的下面（英文字母 I）" },
      { target: "ㄜ", hint: "ㄛ的下面（基準鍵 K）" },
      { target: "ㄝ", hint: "ㄜ的下面（逗號 , 鍵）" },
      { target: "ㄞ", hint: "韻母區（數字 9）" },
      { target: "ㄟ", hint: "ㄞ的下面（英文字母 O）" },
      { target: "ㄠ", hint: "ㄟ的下面（基準鍵 L）" },
      { target: "ㄡ", hint: "ㄠ的下面（句號 . 鍵）" },
      { target: "ㄢ", hint: "韻母區（數字 0）" },
      { target: "ㄣ", hint: "ㄢ的下面（英文字母 P）" },
      { target: "ㄤ", hint: "ㄣ的下面（分號 ; 鍵）" },
      { target: "ㄥ", hint: "ㄤ的下面（斜線 / 鍵）" },
      { target: "ㄦ", hint: "最右上角韻母（減號 - 鍵）" }
    ]
  },
  {
    id: "island5",
    order: 5,
    short: "5.聲調單字島",
    name: "島 5：聲調與單字島（五聲調音階橋）",
    badge: "任務 5｜單字聲調",
    category: "中打基礎",
    color: "#ec4899",
    grass: "#76bd68",
    rock: "#9c7082",
    crystal: "#f472b6",
    tagline: "把注音拼成國字！牢記五聲調口訣：一聲空白、二聲6、三聲3、四聲4、輕聲7。",
    mode: "zh_char",
    duration: 60,
    unit: "字",
    thresholds: { bronze: 5, silver: 9, gold: 14, minAcc: 85 },
    ruleDesc: "限時 60 秒｜⭐銅星 5 個字（約12秒1字）・⭐⭐銀星 9 個字・⭐⭐⭐金星 14 個字｜正確率 ≥ 85%",
    sceneDesc: "五座彩虹音階橋象徵一聲（空白鍵）、二聲（6）、三聲（3）、四聲（4）與輕聲（7），敲響單字大鑼！",
    tips: [
      "打中文單字的順序永遠是：【聲母】➔【介音(ㄧㄨㄩ)】➔【韻母】➔【最後一定要按聲調鍵】！",
      "🌟 最重要秘訣：沒有符號的「一聲（如：媽 ㄇㄚ）」，最後一定要按【空白鍵】才會變成國字喔！",
      "三聲 ˇ 在數字【3】，四聲 ˋ 在數字【4】，二聲 ˊ 在數字【6】，輕聲 ˙ 在數字【7】。"
    ],
    npcBenchmarks: [
      { name: "🥇 守關隊長 小天馬", score: 15, stars: 3, acc: 96, detail: "15 個國字 / 60秒" },
      { name: "🥈 熟練學長 阿豪", score: 9, stars: 2, acc: 91, detail: "9 個國字 / 60秒" },
      { name: "🥉 新手守衛 機器人", score: 5, stars: 1, acc: 85, detail: "5 個國字 (小三過關基準)" }
    ],
    prompts: [
      { target: "媽", zy: "ㄇㄚˉ", hint: "一聲練習：按 ㄇ(A) ➔ ㄚ(8) ➔ 空白鍵" },
      { target: "爸", zy: "ㄅㄚˋ", hint: "四聲練習：按 ㄅ(1) ➔ ㄚ(8) ➔ 四聲(4)" },
      { target: "好", zy: "ㄏㄠˇ", hint: "三聲練習：按 ㄏ(C) ➔ ㄠ(L) ➔ 三聲(3)" },
      { target: "你", zy: "ㄋㄧˇ", hint: "三聲練習：按 ㄋ(S) ➔ ㄧ(U) ➔ 三聲(3)" },
      { target: "我", zy: "ㄨㄛˇ", hint: "三聲練習：按 ㄨ(J) ➔ ㄛ(I) ➔ 三聲(3)" },
      { target: "書", zy: "ㄕㄨˉ", hint: "一聲練習：按 ㄕ(G) ➔ ㄨ(J) ➔ 空白鍵" },
      { target: "花", zy: "ㄏㄨㄚˉ", hint: "三拼一聲：按 ㄏ(C) ➔ ㄨ(J) ➔ ㄚ(8) ➔ 空白鍵" },
      { target: "水", zy: "ㄕㄨㄟˇ", hint: "三拼三聲：按 ㄕ(G) ➔ ㄨ(J) ➔ ㄟ(O) ➔ 三聲(3)" },
      { target: "火", zy: "ㄏㄨㄛˇ", hint: "三拼三聲：按 ㄏ(C) ➔ ㄨ(J) ➔ ㄛ(I) ➔ 三聲(3)" },
      { target: "山", zy: "ㄕㄢˉ", hint: "一聲練習：按 ㄕ(G) ➔ ㄢ(0) ➔ 空白鍵" },
      { target: "風", zy: "ㄈㄥˉ", hint: "一聲練習：按 ㄈ(Z) ➔ ㄥ(/) ➔ 空白鍵" },
      { target: "雲", zy: "ㄩㄣˊ", hint: "二聲練習：按 ㄩ(M) ➔ ㄣ(P) ➔ 二聲(6)" },
      { target: "雨", zy: "ㄩˇ", hint: "雙鍵練習：按 ㄩ(M) ➔ 三聲(3)" },
      { target: "星", zy: "ㄒㄧㄥˉ", hint: "三拼一聲：按 ㄒ(V) ➔ ㄧ(U) ➔ ㄥ(/) ➔ 空白鍵" },
      { target: "馬", zy: "ㄇㄚˇ", hint: "三聲練習：按 ㄇ(A) ➔ ㄚ(8) ➔ 三聲(3)" },
      { target: "魚", zy: "ㄩˊ", hint: "二聲練習：按 ㄩ(M) ➔ 二聲(6)" },
      { target: "愛", zy: "ㄞˋ", hint: "四聲練習：按 ㄞ(9) ➔ 四聲(4)" },
      { target: "笑", zy: "ㄒㄧㄠˋ", hint: "四聲練習：按 ㄒ(V) ➔ ㄧ(U) ➔ ㄠ(L) ➔ 四聲(4)" }
    ]
  },
  {
    id: "island6",
    order: 6,
    short: "6.生活語詞島",
    name: "島 6：生活語詞森林島（常用雙字詞）",
    badge: "任務 6｜生活語詞",
    category: "中打進階",
    color: "#e76f51",
    grass: "#6ec265",
    rock: "#a87654",
    crystal: "#fb923c",
    tagline: "挑戰國小三年級國語課本常用語詞，每完成一個語詞就能採收金蘋果！",
    mode: "zh_word",
    duration: 90,
    unit: "詞",
    thresholds: { bronze: 6, silver: 10, gold: 15, minAcc: 85 },
    ruleDesc: "限時 90 秒｜⭐銅星 6 個詞（12字）・⭐⭐銀星 10 個詞（20字）・⭐⭐⭐金星 15 個詞（30字）｜正確率 ≥ 85%",
    sceneDesc: "結滿紅金果實的語詞森林環繞小島，小動物們提著果籃等待你拼打出完整的雙字語詞！",
    tips: [
      "本關限時 90 秒，只要打出 6 個語詞（共 12 個字，平均每分鐘 8 個字）就能拿到銅星過關！",
      "可自由切換「🎯 注音按鍵導引模式（免切輸入法）」或「⌨️ 真實中文輸入框模式（練習微軟注音選字）」。"
    ],
    npcBenchmarks: [
      { name: "🥇 守關隊長 小天馬", score: 16, stars: 3, acc: 97, detail: "16 詞 (32字 / 90秒)" },
      { name: "🥈 熟練學長 阿豪", score: 10, stars: 2, acc: 91, detail: "10 詞 (20字 / 90秒)" },
      { name: "🥉 新手守衛 機器人", score: 6, stars: 1, acc: 86, detail: "6 詞 (12字 小三過關基準)" }
    ],
    prompts: [
      { target: "馬鳴", hint: "ㄇㄚˇ ㄇㄧㄥˊ（我們的學校！）" },
      { target: "學校", hint: "ㄒㄩㄝˊ ㄒㄧㄠˋ" },
      { target: "老師", hint: "ㄌㄠˇ ㄕˉ" },
      { target: "同學", hint: "ㄊㄨㄥˊ ㄒㄩㄝˊ" },
      { target: "電腦", hint: "ㄉㄧㄢˋ ㄋㄠˇ" },
      { target: "開心", hint: "ㄎㄞˉ ㄒㄧㄣˉ" },
      { target: "太陽", hint: "ㄊㄞˋ ㄧㄤˊ" },
      { target: "月亮", hint: "ㄩㄝˋ ㄌㄧㄤˋ" },
      { target: "彩虹", hint: "ㄘㄞˇ ㄏㄨㄥˊ" },
      { target: "朋友", hint: "ㄆㄥˊ ㄧㄡˇ" },
      { target: "運動", hint: "ㄩㄣˋ ㄉㄨㄥˋ" },
      { target: "讀書", hint: "ㄉㄨˊ ㄕㄨˉ" },
      { target: "唱歌", hint: "ㄔㄤˋ ㄍㄜˉ" },
      { target: "下課", hint: "ㄒㄧㄚˋ ㄎㄜˋ" },
      { target: "早安", hint: "ㄗㄠˇ ㄢˉ" },
      { target: "加油", hint: "ㄐㄧㄚˉ ㄧㄡˊ" },
      { target: "謝謝", hint: "ㄒㄧㄝˋ ㄒㄧㄝˋ" },
      { target: "寶貝", hint: "ㄅㄠˇ ㄅㄟˋ" }
    ]
  },
  {
    id: "island7",
    order: 7,
    short: "7.短句飛空艇",
    name: "島 7：短句飛空艇島（短句流暢度）",
    badge: "任務 7｜中文短句",
    category: "中打進階",
    color: "#0ea5e9",
    grass: "#74bf6e",
    rock: "#6c8599",
    crystal: "#38bdf8",
    tagline: "駕駛打字飛空艇挑戰 4～6 字溫暖短句，體驗一氣呵成打完一句話的成就感！",
    mode: "zh_sentence",
    duration: 90,
    unit: "句",
    thresholds: { bronze: 3, silver: 5, gold: 7, minAcc: 85 },
    ruleDesc: "限時 90 秒｜⭐銅星 3 句（約15字）・⭐⭐銀星 5 句（約25字）・⭐⭐⭐金星 7 句（約35字）｜正確率 ≥ 85%",
    sceneDesc: "蒸汽飛空艇停靠在雲端領航塔旁，每打完一句短句，飛空艇就會噴出彩色慶祝煙火向前衝刺！",
    tips: [
      "90 秒內只要完成 3 句短句就能過關！不用急，一字一字看準發光鍵位穩定輸入。",
      "若使用「⌨️ 真實中文輸入框模式」，微軟注音具有自動選字記憶，整句打完再按 Enter 更快喔！"
    ],
    npcBenchmarks: [
      { name: "🥇 守關隊長 小天馬", score: 8, stars: 3, acc: 97, detail: "8 句短句 / 90秒" },
      { name: "🥈 熟練學長 阿豪", score: 5, stars: 2, acc: 91, detail: "5 句短句 / 90秒" },
      { name: "🥉 新手守衛 機器人", score: 3, stars: 1, acc: 86, detail: "3 句短句 (小三過關基準)" }
    ],
    prompts: [
      { target: "早安你好", hint: "ㄗㄠˇ ㄢˉ ㄋㄧˇ ㄏㄠˇ" },
      { target: "我愛馬鳴國小", hint: "ㄨㄛˇ ㄞˋ ㄇㄚˇ ㄇㄧㄥˊ ㄍㄨㄛˊ ㄒㄧㄠˇ" },
      { target: "今天天氣真好", hint: "ㄐㄧㄣˉ ㄊㄧㄢˉ ㄊㄧㄢˉ ㄑㄧˋ ㄓㄣˉ ㄏㄠˇ" },
      { target: "大家一起來玩", hint: "ㄉㄚˋ ㄐㄧㄚˉ ㄧˉ ㄑㄧˇ ㄌㄞˊ ㄨㄢˊ" },
      { target: "天天開心上學", hint: "ㄊㄧㄢˉ ㄊㄧㄢˉ ㄎㄞˉ ㄒㄧㄣˉ ㄕㄤˋ ㄒㄩㄝˊ" },
      { target: "我是打字高手", hint: "ㄨㄛˇ ㄕˋ ㄉㄚˇ ㄗˋ ㄍㄠˉ ㄕㄡˇ" },
      { target: "電腦課真有趣", hint: "ㄉㄧㄢˋ ㄋㄠˇ ㄎㄜˋ ㄓㄣˉ ㄧㄡˇ ㄑㄩˋ" },
      { target: "下課去操場跑", hint: "ㄒㄧㄚˋ ㄎㄜˋ ㄑㄩˋ ㄘㄠˉ ㄔㄤˇ ㄆㄠˇ" },
      { target: "謝謝老師教導", hint: "ㄒㄧㄝˋ ㄒㄧㄝˋ ㄌㄠˇ ㄕˉ ㄐㄧㄠˋ ㄉㄠˇ" }
    ]
  },
  {
    id: "island8",
    order: 8,
    short: "8.魔王挑戰島",
    name: "島 8：天空之城魔王島（中英數總考驗）",
    badge: "任務 8｜終極魔王",
    category: "綜合挑戰",
    color: "#dc2626",
    grass: "#6cb062",
    rock: "#7f4f4f",
    crystal: "#f87171",
    tagline: "結合數字、英文與國字的終極試煉！過關即可解鎖「👑 天空鍵盤勇者」傳奇稱號！",
    mode: "mixed_boss",
    duration: 90,
    unit: "字元",
    thresholds: { bronze: 20, silver: 35, gold: 50, minAcc: 85 },
    ruleDesc: "限時 90 秒｜⭐銅星 20 字元・⭐⭐銀星 35 字元・⭐⭐⭐金星 50 字元｜正確率 ≥ 85%",
    sceneDesc: "巨型赤紅飛行石在雷鳴神殿上方旋轉，金色王冠等待著精通中英數鍵盤的小勇者前來挑戰！",
    tips: [
      "題目同時包含「數字（123）」、「英文（OK、Go）」與「中文（木頭人、加油）」！",
      "跟著螢幕上方的逐鍵拆解提示，系統會自動幫你無縫處理中英數按鍵，盡情發揮實力吧！"
    ],
    npcBenchmarks: [
      { name: "🥇 守關隊長 小天馬", score: 55, stars: 3, acc: 97, detail: "55 字元 / 90秒" },
      { name: "🥈 熟練學長 阿豪", score: 36, stars: 2, acc: 91, detail: "36 字元 / 90秒" },
      { name: "🥉 新手守衛 機器人", score: 20, stars: 1, acc: 85, detail: "20 字元 (小三過關基準)" }
    ],
    prompts: [
      { target: "3年甲班", hint: "數字 3 ＋ 中文「年甲班」" },
      { target: "123木頭人", hint: "數字 123 ＋ 中文「木頭人」" },
      { target: "Go加油", hint: "英文 Go ＋ 中文「加油」" },
      { target: "OK沒問題", hint: "英文 OK ＋ 中文「沒問題」" },
      { target: "5顆金星星", hint: "數字 5 ＋ 中文「顆金星星」" },
      { target: "100分過關", hint: "數字 100 ＋ 中文「分過關」" },
      { target: "馬鳴No1", hint: "中文「馬鳴」＋ 英文數字 No1" },
      { target: "Happy每一天", hint: "英文 Happy ＋ 中文「每一天」" }
    ]
  }
];

// 學習路線串聯（由島1循序漸進到島8）
window.MMPS_LINKS = [
  { from: "island1", to: "island2", label: "Step 1➔2：基準鍵延伸至 26 字母" },
  { from: "island2", to: "island3", label: "Step 2➔3：字母進階至大小寫單字" },
  { from: "island3", to: "island4", label: "Step 3➔4：英打轉入注音鍵位規律" },
  { from: "island4", to: "island5", label: "Step 4➔5：注音加聲調拼成單字" },
  { from: "island5", to: "island6", label: "Step 5➔6：單字組合成生活語詞" },
  { from: "island6", to: "island7", label: "Step 6➔7：語詞串聯為完整短句" },
  { from: "island7", to: "island8", label: "Step 7➔8：挑戰中英數魔王關卡！" }
];

// 打字激勵名言
window.MMPS_QUOTES = [
  ["左手食指找 F，右手食指找 J，摸到小凸點就找到家！", "鍵盤定位口訣"],
  ["一聲空白鍵、二聲 6、三聲 3、四聲 4、輕聲 7！", "注音聲調秘訣"],
  ["最左直排 ㄅㄆㄇㄈ，第二直排 ㄉㄊㄋㄌ，由左往右超好記！", "注音鍵位口訣"],
  ["不急著求快，先把每一顆按鍵用正確的手指按對，速度自然會飛起來！", "打字小達人心法"],
  ["介音三兄弟：ㄧ 在 U、ㄨ 在 J、ㄩ 在 M！", "注音拼音秘訣"]
];
