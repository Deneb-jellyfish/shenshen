const SONGS = [
  "少管我",
  "光亮",
  "怜悯",
  "热烈盛开",
  "天堂岛之歌",
  "walalilongla",
  "璀璨冒险人",
  "达拉崩吧",
  "有我",
  "望",
  "铃芽之旅",
  "雨季又来临",
  "末日飞船",
  "空壳",
  "自诩周全",
  "梦见你",
  "crush",
  "my ONLY",
  "浮光",
  "花开忘忧",
  "我以渺小爱你",
  "象人",
  "焰火",
  "爱丽丝卿",
  "春雪",
  "重启",
  "好风起",
  "触不可及",
  "请我不改",
  "嗨人间",
  "修星星的人",
  "生活就该迎着光亮",
  "荒城渡",
  "虚构",
  "造物",
  "警报",
  "和光同尘",
  "我的对",
  "去明天",
  "我想你了",
  "rubia",
  "浮游",
  "气血满满的你",
  "求真",
  "来啊",
  "复刻回忆",
  "茧",
  "不想睡",
  "大鱼",
  "若梦",
  "灯火里的中国",
  "借过一下",
  "看见我",
  "奔向你",
  "一晌",
  "等晴天",
  "缝合",
  "云裳羽衣曲",
  "自己按门铃自己听",
  "只字不提",
  "奇迹时刻",
  "借梦",
  "人是",
  "沉默的羔羊"
];

const ROUND_TITLES = ["64强", "32强", "16强", "8强", "4强", "决赛"];
const STORAGE_KEY = "zhoushen-song-tournament-v2";
const MAX_SHUFFLES = 3;
const WINNER_SLOTS = [32, 16, 8, 4, 2, 1];
const PRIORITY_ARTISTS = ["周深", "卡布叻", "HOYO-MiX"];

const roundsContainer = document.querySelector("#roundsContainer");
const shuffleButton = document.querySelector("#shuffleButton");
const resetButton = document.querySelector("#resetButton");
const exportImageButton = document.querySelector("#exportImageButton");
const exportTableButton = document.querySelector("#exportTableButton");
const shuffleRemain = document.querySelector("#shuffleRemain");
const progressText = document.querySelector("#progressText");
const championName = document.querySelector("#championName");
const championHint = document.querySelector("#championHint");
const championCard = document.querySelector("#championCard");
const championDialog = document.querySelector("#championDialog");
const closeDialogButton = document.querySelector("#closeDialogButton");
const championCover = document.querySelector("#championCover");
const coverFallback = document.querySelector("#coverFallback");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogArtist = document.querySelector("#dialogArtist");
const dialogDescription = document.querySelector("#dialogDescription");

const state = loadState();
let lastCelebratedChampion = state.lastCelebratedChampion || null;

function createEmptyWinners() {
  return WINNER_SLOTS.map((count) => Array.from({ length: count }, () => null));
}

function shuffleSongs(source) {
  const array = [...source];

  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }

  return array;
}

function makeFreshState() {
  return {
    seedSongs: shuffleSongs(SONGS),
    winners: createEmptyWinners(),
    shufflesUsed: 0,
    coverCache: {},
    lastCelebratedChampion: null
  };
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return makeFreshState();
    }

    const parsed = JSON.parse(raw);
    const hasValidSeed = Array.isArray(parsed.seedSongs) && parsed.seedSongs.length === SONGS.length;
    const hasValidWinners = Array.isArray(parsed.winners) && parsed.winners.length === WINNER_SLOTS.length;

    if (!hasValidSeed || !hasValidWinners) {
      return makeFreshState();
    }

    return {
      seedSongs: parsed.seedSongs,
      winners: parsed.winners.map((round, index) =>
        Array.from({ length: WINNER_SLOTS[index] }, (_, winnerIndex) => round?.[winnerIndex] || null)
      ),
      shufflesUsed: Number.isFinite(parsed.shufflesUsed) ? parsed.shufflesUsed : 0,
      coverCache: parsed.coverCache && typeof parsed.coverCache === "object" ? parsed.coverCache : {},
      lastCelebratedChampion: parsed.lastCelebratedChampion || null
    };
  } catch {
    return makeFreshState();
  }
}

function saveState() {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      seedSongs: state.seedSongs,
      winners: state.winners,
      shufflesUsed: state.shufflesUsed,
      coverCache: state.coverCache,
      lastCelebratedChampion
    })
  );
}

function buildParticipants() {
  const participants = [];
  participants[0] = [];

  for (let index = 0; index < state.seedSongs.length; index += 2) {
    participants[0].push([state.seedSongs[index], state.seedSongs[index + 1]]);
  }

  for (let roundIndex = 0; roundIndex < WINNER_SLOTS.length; roundIndex += 1) {
    const roundMatches = participants[roundIndex];
    const winners = state.winners[roundIndex];

    for (let matchIndex = 0; matchIndex < winners.length; matchIndex += 1) {
      const song = winners[matchIndex];
      const slots = roundMatches[matchIndex] || [];

      if (song && !slots.includes(song)) {
        winners[matchIndex] = null;
      }
    }

    if (roundIndex < WINNER_SLOTS.length - 1) {
      const nextRound = [];

      for (let matchIndex = 0; matchIndex < winners.length; matchIndex += 2) {
        nextRound.push([winners[matchIndex] || null, winners[matchIndex + 1] || null]);
      }

      participants[roundIndex + 1] = nextRound;
    }
  }

  return participants;
}

function getSelectionCount() {
  return state.winners.reduce((sum, round) => sum + round.filter(Boolean).length, 0);
}

function getChampion() {
  return state.winners.at(-1)?.[0] || null;
}

function updateStatus() {
  const shufflesLeft = Math.max(0, MAX_SHUFFLES - state.shufflesUsed);
  const selectionCount = getSelectionCount();
  const champion = getChampion();

  shuffleRemain.textContent = `还剩 ${shufflesLeft} 次`;
  shuffleButton.disabled = shufflesLeft <= 0;

  if (champion) {
    progressText.textContent = `比赛完成，共做出了 ${selectionCount} 次晋级选择`;
    championName.textContent = champion;
    championHint.textContent = "点这里可以重新打开冠军弹窗，也可以继续回改前面的投票。";
    championCard.dataset.ready = "true";
    return;
  }

  championCard.dataset.ready = "false";
  championName.textContent = "等待诞生";
  championHint.textContent = "冠军出现后会自动弹窗，并优先联网搜索周深版本封面。";

  if (selectionCount === 0) {
    progressText.textContent = "还没开始，先点一首你最想保送的歌吧";
  } else {
    progressText.textContent = `已经做出 ${selectionCount} 次晋级选择，继续把你心里的冠军投出来吧`;
  }
}

function createSongButton({ song, roundIndex, matchIndex, selected }) {
  const button = document.createElement("button");
  button.className = "song-button";
  button.type = "button";

  if (!song) {
    button.dataset.empty = "true";
    button.disabled = true;
    button.innerHTML = "<strong>等待上一轮结果</strong><span>这里会自动出现晋级歌曲</span>";
    return button;
  }

  button.dataset.selected = String(Boolean(selected));
  button.dataset.roundIndex = String(roundIndex);
  button.dataset.matchIndex = String(matchIndex);
  button.dataset.song = song;
  button.innerHTML = `<strong>${escapeHtml(song)}</strong><span>${selected ? "已晋级到下一轮" : "点击让它晋级"}</span>`;
  return button;
}

function renderBracket() {
  const participants = buildParticipants();
  roundsContainer.innerHTML = "";

  ROUND_TITLES.forEach((title, roundIndex) => {
    const roundColumn = document.createElement("section");
    roundColumn.className = "round-column";
    roundColumn.dataset.roundIndex = String(roundIndex);

    const roundHeader = document.createElement("div");
    roundHeader.className = "round-header";
    roundHeader.innerHTML = `
      <div>
        <h2 class="round-title">${title}</h2>
        <p class="round-meta">点开每场对阵，把你更偏爱的那首歌送进下一轮。</p>
      </div>
      <span class="round-badge">${participants[roundIndex].length} 场</span>
    `;

    const matchList = document.createElement("div");
    matchList.className = "match-list";

    participants[roundIndex].forEach((match, matchIndex) => {
      const matchCard = document.createElement("article");
      matchCard.className = "match-card";

      const matchTitle = document.createElement("p");
      matchTitle.className = "match-title";
      matchTitle.textContent = `${title} · 对阵 ${matchIndex + 1}`;

      const songStack = document.createElement("div");
      songStack.className = "song-stack";
      const winner = state.winners[roundIndex][matchIndex];

      match.forEach((song) => {
        songStack.appendChild(
          createSongButton({
            song,
            roundIndex,
            matchIndex,
            selected: winner === song
          })
        );
      });

      matchCard.appendChild(matchTitle);
      matchCard.appendChild(songStack);
      matchList.appendChild(matchCard);
    });

    roundColumn.appendChild(roundHeader);
    roundColumn.appendChild(matchList);
    roundsContainer.appendChild(roundColumn);
  });

  updateStatus();
  saveState();
}

function handleSelection(roundIndex, matchIndex, song) {
  const participants = buildParticipants();
  const match = participants[roundIndex][matchIndex];

  if (!match || !match.includes(song)) {
    return;
  }

  state.winners[roundIndex][matchIndex] = song;
  renderBracket();

  const champion = getChampion();

  if (champion) {
    const shouldCelebrateAgain = champion !== lastCelebratedChampion || roundIndex === WINNER_SLOTS.length - 1;

    if (shouldCelebrateAgain) {
      lastCelebratedChampion = champion;
      state.lastCelebratedChampion = champion;
      saveState();
      void showChampionDialog(champion);
    }
  }
}

function resetTournament({ reshuffle }) {
  state.winners = createEmptyWinners();

  if (reshuffle) {
    state.seedSongs = shuffleSongs(SONGS);
  }

  lastCelebratedChampion = null;
  state.lastCelebratedChampion = null;
  renderBracket();
}

function normalizeSongName(text) {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s\-_.!?,:;"'()（）【】[\]·]/g, "");
}

function scoreSearchResult(songName, result, query) {
  const wanted = normalizeSongName(songName);
  const candidate = normalizeSongName(result.trackName || result.collectionName || "");
  const artist = result.artistName || "";
  let score = 0;

  if (candidate === wanted) {
    score += 120;
  } else if (candidate.includes(wanted) || wanted.includes(candidate)) {
    score += 70;
  }

  if (result.trackName && result.trackName.includes(songName)) {
    score += 30;
  }

  if (query.includes("周深")) {
    score += 12;
  }

  if (artist.includes("周深")) {
    score += 140;
  }

  if (artist.includes("卡布叻")) {
    score += 80;
  }

  if (artist.includes("HOYO-MiX")) {
    score += 48;
  }

  for (const keyword of PRIORITY_ARTISTS) {
    if (artist.includes(keyword)) {
      score += 20;
    }
  }

  if (result.artworkUrl100) {
    score += 18;
  }

  return score;
}

async function fetchSearchResults(query) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=8&country=cn`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`cover search failed: ${response.status}`);
  }

  const payload = await response.json();
  return (payload.results || []).map((item) => ({ ...item, _query: query }));
}

async function fetchChampionCover(songName) {
  const cached = state.coverCache[songName];

  if (cached) {
    return cached;
  }

  const queries = [
    `${songName} 周深`,
    `${songName} 周深 HOYO-MiX`,
    `${songName} 卡布叻周深`,
    songName
  ];

  const results = [];

  for (const query of queries) {
    try {
      const batch = await fetchSearchResults(query);
      results.push(...batch);
    } catch {
      continue;
    }
  }

  const best = [...results]
    .sort((left, right) => scoreSearchResult(songName, right, right._query) - scoreSearchResult(songName, left, left._query))
    .find((item) => item.artworkUrl100);

  const coverInfo = best
    ? {
        title: best.trackName || songName,
        artist: best.artistName || "周深优先搜索结果",
        artwork: best.artworkUrl100.replace("100x100bb.jpg", "1000x1000bb.jpg")
      }
    : {
        title: songName,
        artist: "暂时没有搜到稳定的周深版本封面",
        artwork: null
      };

  state.coverCache[songName] = coverInfo;
  saveState();
  return coverInfo;
}

async function showChampionDialog(songName) {
  dialogTitle.textContent = `${songName} · 冠军`;
  dialogArtist.textContent = "正在搜索周深版本封面与曲目信息...";
  dialogDescription.textContent = "这一首已经在你的周深歌单 PK 赛里拿下第一名。";
  championCover.hidden = true;
  championCover.removeAttribute("src");
  coverFallback.hidden = false;

  if (!championDialog.open) {
    championDialog.showModal();
  }

  try {
    const coverInfo = await fetchChampionCover(songName);
    dialogTitle.textContent = `${coverInfo.title} · 冠军`;
    dialogArtist.textContent = coverInfo.artist;
    dialogDescription.textContent = coverInfo.artwork
      ? "已经优先为这首冠军歌匹配到周深相关版本封面。"
      : "冠军已经诞生，但这次没有搜到足够稳定的封面结果，所以先保留平面插画卡。";

    if (coverInfo.artwork) {
      championCover.src = coverInfo.artwork;
      championCover.hidden = false;
      coverFallback.hidden = true;
    }
  } catch {
    dialogArtist.textContent = "网络搜索暂时失败了，不过冠军已经顺利诞生。";
    dialogDescription.textContent = "你可以稍后再点一次冠军卡片，重新触发封面搜索。";
  }
}

function getExportRows() {
  const participants = buildParticipants();
  const rows = [];

  participants.forEach((roundMatches, roundIndex) => {
    roundMatches.forEach((match, matchIndex) => {
      rows.push({
        round: ROUND_TITLES[roundIndex],
        match: `对阵 ${matchIndex + 1}`,
        songA: match[0] || "",
        songB: match[1] || "",
        winner: state.winners[roundIndex][matchIndex] || ""
      });
    });
  });

  return rows;
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  const escaped = text.replaceAll('"', '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function formatFileStamp() {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0")
  ];
  return parts.join("");
}

function exportTable() {
  const rows = getExportRows();
  const csvLines = [
    ["轮次", "场次", "歌曲 A", "歌曲 B", "晋级歌曲"],
    ...rows.map((row) => [row.round, row.match, row.songA, row.songB, row.winner])
  ];

  const csv = `\uFEFF${csvLines.map((line) => line.map(escapeCsvCell).join(",")).join("\n")}`;
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `周深歌单PK赛-晋级表-${formatFileStamp()}.csv`);
}

function truncateSongName(text, maxLength = 12) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function escapeSvgText(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createBracketGraphic() {
  const participants = buildParticipants();
  const columnWidth = 214;
  const cardWidth = 194;
  const cardHeight = 86;
  const columnGap = 42;
  const leftPadding = 44;
  const topPadding = 124;
  const step = 98;
  const width = leftPadding * 2 + ROUND_TITLES.length * columnWidth + (ROUND_TITLES.length - 1) * columnGap;
  const height = topPadding + step * 31 + 130;
  const centers = [];

  centers[0] = participants[0].map((_, matchIndex) => topPadding + 30 + matchIndex * step);

  for (let roundIndex = 1; roundIndex < ROUND_TITLES.length; roundIndex += 1) {
    centers[roundIndex] = participants[roundIndex].map((_, matchIndex) => {
      const previousCenters = centers[roundIndex - 1];
      return (previousCenters[matchIndex * 2] + previousCenters[matchIndex * 2 + 1]) / 2;
    });
  }

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<rect width="100%" height="100%" fill="#eef8ff" rx="0" ry="0"/>',
    `<rect x="24" y="20" width="${width - 48}" height="${height - 40}" rx="28" fill="#ffffff" stroke="#d5ebfb" stroke-width="2"/>`,
    '<circle cx="90" cy="76" r="24" fill="#ffd45f"/>',
    '<circle cx="126" cy="76" r="18" fill="#8fe2d1"/>',
    '<circle cx="160" cy="76" r="14" fill="#63b9ff"/>',
    '<text x="194" y="68" fill="#1c4f92" font-size="32" font-weight="700" font-family="Georgia, KaiTi, serif">周深歌单 PK 赛</text>',
    `<text x="194" y="96" fill="#58789b" font-size="15" font-family="'Trebuchet MS', 'Microsoft YaHei', sans-serif">导出时间：${escapeSvgText(new Date().toLocaleString("zh-CN"))}</text>`
  ];

  ROUND_TITLES.forEach((title, roundIndex) => {
    const x = leftPadding + roundIndex * (columnWidth + columnGap);
    const titleY = 120;
    parts.push(`<text x="${x}" y="${titleY}" fill="#2f88e6" font-size="22" font-weight="700" font-family="Georgia, KaiTi, serif">${escapeSvgText(title)}</text>`);
    parts.push(`<text x="${x + 134}" y="${titleY}" fill="#2f88e6" font-size="13" font-weight="700" font-family="'Trebuchet MS', 'Microsoft YaHei', sans-serif">${participants[roundIndex].length} 场</text>`);
  });

  for (let roundIndex = 0; roundIndex < ROUND_TITLES.length - 1; roundIndex += 1) {
    const currentX = leftPadding + roundIndex * (columnWidth + columnGap);
    const nextX = leftPadding + (roundIndex + 1) * (columnWidth + columnGap);

    participants[roundIndex].forEach((_, matchIndex) => {
      const winner = state.winners[roundIndex][matchIndex];

      if (!winner) {
        return;
      }

      const startX = currentX + cardWidth;
      const startY = centers[roundIndex][matchIndex];
      const endX = nextX - 16;
      const endY = centers[roundIndex + 1][Math.floor(matchIndex / 2)];
      const midX = startX + (endX - startX) / 2;

      parts.push(
        `<path d="M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}" fill="none" stroke="#8ccaff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
      );
    });
  }

  participants.forEach((roundMatches, roundIndex) => {
    const x = leftPadding + roundIndex * (columnWidth + columnGap);

    roundMatches.forEach((match, matchIndex) => {
      const centerY = centers[roundIndex][matchIndex];
      const y = centerY - cardHeight / 2;
      const winner = state.winners[roundIndex][matchIndex];
      const [songA, songB] = match;
      const topFill = winner === songA ? "#2f88e6" : "#f3faff";
      const topText = winner === songA ? "#ffffff" : "#204a78";
      const topMeta = winner === songA ? "已晋级" : "待选择";
      const bottomFill = winner === songB ? "#2f88e6" : "#f3faff";
      const bottomText = winner === songB ? "#ffffff" : "#204a78";
      const bottomMeta = winner === songB ? "已晋级" : "待选择";

      parts.push(`<rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="20" fill="#ffffff" stroke="#d7ebfb" stroke-width="1.5"/>`);
      parts.push(`<rect x="${x + 10}" y="${y + 10}" width="6" height="${cardHeight - 20}" rx="3" fill="#63b9ff"/>`);
      parts.push(`<text x="${x + 22}" y="${y + 22}" fill="#2f88e6" font-size="12" font-weight="700" font-family="'Trebuchet MS', 'Microsoft YaHei', sans-serif">对阵 ${matchIndex + 1}</text>`);

      parts.push(`<rect x="${x + 24}" y="${y + 28}" width="156" height="22" rx="11" fill="${topFill}"/>`);
      parts.push(`<text x="${x + 34}" y="${y + 43}" fill="${topText}" font-size="12" font-weight="700" font-family="'Trebuchet MS', 'Microsoft YaHei', sans-serif">${escapeSvgText(truncateSongName(songA || "待定"))}</text>`);
      parts.push(`<text x="${x + 150}" y="${y + 43}" fill="${topText}" font-size="10" text-anchor="end" font-family="'Trebuchet MS', 'Microsoft YaHei', sans-serif">${topMeta}</text>`);

      parts.push(`<rect x="${x + 24}" y="${y + 56}" width="156" height="22" rx="11" fill="${bottomFill}"/>`);
      parts.push(`<text x="${x + 34}" y="${y + 71}" fill="${bottomText}" font-size="12" font-weight="700" font-family="'Trebuchet MS', 'Microsoft YaHei', sans-serif">${escapeSvgText(truncateSongName(songB || "待定"))}</text>`);
      parts.push(`<text x="${x + 150}" y="${y + 71}" fill="${bottomText}" font-size="10" text-anchor="end" font-family="'Trebuchet MS', 'Microsoft YaHei', sans-serif">${bottomMeta}</text>`);
    });
  });

  const champion = getChampion();

  if (champion) {
    parts.push(`<rect x="${width - 308}" y="34" width="232" height="48" rx="24" fill="#2f88e6"/>`);
    parts.push(`<text x="${width - 292}" y="56" fill="#ffffff" font-size="14" font-weight="700" font-family="'Trebuchet MS', 'Microsoft YaHei', sans-serif">当前冠军</text>`);
    parts.push(`<text x="${width - 292}" y="74" fill="#ffffff" font-size="16" font-weight="700" font-family="Georgia, KaiTi, serif">${escapeSvgText(champion)}</text>`);
  }

  parts.push("</svg>");

  return { svg: parts.join(""), width, height };
}

function exportImage() {
  const { svg, width, height } = createBracketGraphic();
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const context = canvas.getContext("2d");

    if (!context) {
      downloadBlob(blob, `周深歌单PK赛-赛程图-${formatFileStamp()}.svg`);
      URL.revokeObjectURL(url);
      return;
    }

    context.scale(2, 2);
    context.fillStyle = "#eef8ff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    canvas.toBlob((pngBlob) => {
      if (pngBlob) {
        downloadBlob(pngBlob, `周深歌单PK赛-赛程图-${formatFileStamp()}.png`);
      } else {
        downloadBlob(blob, `周深歌单PK赛-赛程图-${formatFileStamp()}.svg`);
      }
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  image.onerror = () => {
    downloadBlob(blob, `周深歌单PK赛-赛程图-${formatFileStamp()}.svg`);
    URL.revokeObjectURL(url);
  };

  image.src = url;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function reopenChampionDialog() {
  const champion = getChampion();

  if (!champion) {
    return;
  }

  void showChampionDialog(champion);
}

roundsContainer.addEventListener("click", (event) => {
  const button = event.target.closest(".song-button");

  if (!button || button.disabled) {
    return;
  }

  handleSelection(
    Number(button.dataset.roundIndex),
    Number(button.dataset.matchIndex),
    button.dataset.song
  );
});

shuffleButton.addEventListener("click", () => {
  const shufflesLeft = MAX_SHUFFLES - state.shufflesUsed;

  if (shufflesLeft <= 0) {
    return;
  }

  const confirmed = window.confirm("重抽会清空当前全部晋级结果，确定继续吗？");

  if (!confirmed) {
    return;
  }

  state.shufflesUsed += 1;
  resetTournament({ reshuffle: true });
});

resetButton.addEventListener("click", () => {
  const confirmed = window.confirm("这会保留当前分组，但清空所有晋级结果，重新开始吗？");

  if (!confirmed) {
    return;
  }

  resetTournament({ reshuffle: false });
});

exportImageButton.addEventListener("click", exportImage);
exportTableButton.addEventListener("click", exportTable);
closeDialogButton.addEventListener("click", () => championDialog.close());
championCard.addEventListener("click", reopenChampionDialog);
championCard.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    reopenChampionDialog();
  }
});

championDialog.addEventListener("click", (event) => {
  const rect = championDialog.getBoundingClientRect();
  const isInDialog =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width;

  if (!isInDialog) {
    championDialog.close();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && championDialog.open) {
    championDialog.close();
  }
});

renderBracket();
