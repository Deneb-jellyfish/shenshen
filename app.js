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
const STORAGE_KEY = "healing-song-tournament-v1";
const MAX_SHUFFLES = 3;
const WINNER_SLOTS = [32, 16, 8, 4, 2, 1];

const roundsContainer = document.querySelector("#roundsContainer");
const shuffleButton = document.querySelector("#shuffleButton");
const resetButton = document.querySelector("#resetButton");
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

function makeFreshState() {
  return {
    seedSongs: shuffleSongs(SONGS),
    winners: createEmptyWinners(),
    shufflesUsed: 0,
    coverCache: {},
    lastCelebratedChampion: null
  };
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
  return state.winners.reduce(
    (sum, round) => sum + round.filter((song) => song !== null).length,
    0
  );
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
    championHint.textContent = "点击冠军所在对阵也可以改票，弹窗会同步更新。";
    championCard.dataset.ready = "true";
    return;
  }

  if (selectionCount === 0) {
    progressText.textContent = "还没开始，先点一首喜欢的歌吧";
  } else {
    progressText.textContent = `已经做出 ${selectionCount} 次晋级选择，继续把冠军投出来吧`;
  }

  championName.textContent = "等待诞生";
  championHint.textContent = "冠军出现后会自动弹窗，并尝试联网搜索歌曲封面。";
  championCard.dataset.ready = "false";
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
        <p class="round-meta">点击每场对阵中你想保送的歌。</p>
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

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeSongName(text) {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s\-_.!?,:;"'()（）【】[\]·]/g, "");
}

function scoreSearchResult(songName, result) {
  const wanted = normalizeSongName(songName);
  const candidate = normalizeSongName(result.trackName || result.collectionName || "");
  let score = 0;

  if (candidate === wanted) {
    score += 100;
  } else if (candidate.includes(wanted) || wanted.includes(candidate)) {
    score += 60;
  }

  if (result.trackName && result.trackName.includes(songName)) {
    score += 30;
  }

  if (result.artworkUrl100) {
    score += 15;
  }

  if (result.artistName) {
    score += 5;
  }

  return score;
}

async function fetchChampionCover(songName) {
  const cached = state.coverCache[songName];

  if (cached) {
    return cached;
  }

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(songName)}&entity=song&limit=8&country=cn`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`cover search failed: ${response.status}`);
  }

  const payload = await response.json();
  const best = [...(payload.results || [])]
    .sort((left, right) => scoreSearchResult(songName, right) - scoreSearchResult(songName, left))
    .find((item) => item.artworkUrl100);

  const coverInfo = best
    ? {
        title: best.trackName || songName,
        artist: best.artistName || "已联网搜索到相关版本",
        artwork: best.artworkUrl100.replace("100x100bb.jpg", "600x600bb.jpg")
      }
    : {
        title: songName,
        artist: "没有搜到可靠封面，先用插画卡代替",
        artwork: null
      };

  state.coverCache[songName] = coverInfo;
  saveState();
  return coverInfo;
}

async function showChampionDialog(songName) {
  dialogTitle.textContent = `${songName} · 冠军`;
  dialogArtist.textContent = "正在搜索封面与曲目信息...";
  dialogDescription.textContent = "这一首已经在你的歌单比赛里拿下第一名。";
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
      ? "已为这首冠军歌联网搜到封面，祝贺它稳稳登顶。"
      : "冠军已经诞生，但联网封面没有搜到特别稳的结果，所以先保留插画展示。";

    if (coverInfo.artwork) {
      championCover.src = coverInfo.artwork;
      championCover.hidden = false;
      coverFallback.hidden = true;
    }
  } catch {
    dialogArtist.textContent = "网络搜索暂时失败了，不过冠军已经顺利诞生。";
    dialogDescription.textContent = "你可以稍后再点一次冠军卡片，重新触发联网搜索。";
  }
}

function handleSelection(roundIndex, matchIndex, song) {
  const match = buildParticipants()[roundIndex][matchIndex];

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

closeDialogButton.addEventListener("click", () => {
  championDialog.close();
});

function reopenChampionDialog() {
  const champion = getChampion();

  if (!champion) {
    return;
  }

  void showChampionDialog(champion);
}

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

if (getChampion()) {
  championName.textContent = getChampion();
}
