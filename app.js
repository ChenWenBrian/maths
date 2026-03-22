const STORAGE_KEYS = {
  soundTheme: "maths.soundTheme",
  muted: "maths.muted",
  bestScores: "maths.bestScores",
  wrongBook: "maths.wrongBook",
};

const grades = [1, 2, 3, 4, 5, 6];
const soundThemes = {
  candy: {
    name: "糖果铃声",
    musicWave: "triangle",
    effectWave: "sine",
    melody: [523.25, 659.25, 783.99, 659.25, 698.46, 783.99, 880.0, 659.25],
    page: [659.25, 880.0],
    finish: [523.25, 659.25, 783.99, 1046.5],
    beep: [740],
  },
  forest: {
    name: "森林木琴",
    musicWave: "triangle",
    effectWave: "triangle",
    melody: [392.0, 523.25, 587.33, 523.25, 659.25, 587.33, 523.25, 392.0],
    page: [523.25, 659.25],
    finish: [392.0, 523.25, 659.25, 783.99],
    beep: [587.33],
  },
  star: {
    name: "星星电音",
    musicWave: "square",
    effectWave: "square",
    melody: [440.0, 554.37, 659.25, 830.61, 659.25, 554.37, 740.0, 659.25],
    page: [740.0, 987.77],
    finish: [659.25, 830.61, 987.77, 1318.51],
    beep: [880.0],
  },
};

const appState = {
  grade: 1,
  count: 20,
  mode: "single",
  timeLimit: 90,
  remainingTime: 90,
  timerId: null,
  countdownId: null,
  currentPage: 0,
  pageSize: 1,
  questions: [],
  answers: [],
  started: false,
  muted: true,
  soundTheme: "candy",
  audioContext: null,
  musicGain: null,
  effectGain: null,
  musicTimeoutId: null,
  currentFocusIndex: null,
  resultDetails: [],
  bestScores: [],
  wrongBook: [],
};

const swipeState = {
  startX: 0,
  startY: 0,
  tracking: false,
};

const deviceState = {
  fullscreenRequested: false,
};

const elements = {
  setupForm: document.querySelector("#setupForm"),
  setupScreen: document.querySelector("#setupScreen"),
  setupTitle: document.querySelector("#setupScreen .panel-copy h1"),
  setupDesc: document.querySelector("#setupScreen .panel-copy p"),
  gameScreen: document.querySelector("#gameScreen"),
  resultScreen: document.querySelector("#resultScreen"),
  gradeSelect: document.querySelector("#gradeSelect"),
  countInput: document.querySelector("#countInput"),
  countPresetButtons: [...document.querySelectorAll(".count-preset-btn")],
  soundThemeSelect: document.querySelector("#soundThemeSelect"),
  modeInput: document.querySelector("#modeInput"),
  singleModeBtn: document.querySelector("#singleModeBtn"),
  multiModeBtn: document.querySelector("#multiModeBtn"),
  previewScreen: document.querySelector("#previewScreen"),
  previewBackBtn: document.querySelector("#previewBackBtn"),
  confirmStartBtn: document.querySelector("#confirmStartBtn"),
  recordToggleBtn: document.querySelector("#recordToggleBtn"),
  recordsOverlay: document.querySelector("#recordsOverlay"),
  recordsCloseBtn: document.querySelector("#recordsCloseBtn"),
  progressCard: document.querySelector("#progressCard"),
  summaryCard: document.querySelector("#summaryCard"),
  fullscreenToggle: document.querySelector("#fullscreenToggle"),
  muteToggle: document.querySelector("#muteToggle"),
  gradePill: document.querySelector("#gradePill"),
  modePill: document.querySelector("#modePill"),
  pagePill: document.querySelector("#pagePill"),
  timerText: document.querySelector("#timerText"),
  questionWrap: document.querySelector("#questionWrap"),
  questionList: document.querySelector("#questionList"),
  kidKeypad: document.querySelector(".kid-keypad"),
  pager: document.querySelector(".pager"),
  prevPageBtn: document.querySelector("#prevPageBtn"),
  nextPageBtn: document.querySelector("#nextPageBtn"),
  pagerTip: document.querySelector("#pagerTip"),
  countdownOverlay: document.querySelector("#countdownOverlay"),
  countdownText: document.querySelector("#countdownText"),
  scoreText: document.querySelector("#scoreText"),
  resultTitle: document.querySelector("#resultTitle"),
  resultSubtitle: document.querySelector("#resultSubtitle"),
  detailToggleBtn: document.querySelector("#detailToggleBtn"),
  restartBtn: document.querySelector("#restartBtn"),
  detailPanel: document.querySelector("#detailPanel"),
  detailSummary: document.querySelector("#detailSummary"),
  detailList: document.querySelector("#detailList"),
  highScoreList: document.querySelector("#highScoreList"),
  wrongBookList: document.querySelector("#wrongBookList"),
};

function init() {
  loadLocalState();
  renderGradeOptions();
  renderSoundThemeOptions();
  restoreSetupState();
  applyPlatformMode();
  showSetupArea("form");
  syncSetupSummary();
  renderProgressCard();
  bindEvents();
  updateMuteButton();
  updateFullscreenButton();
}

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function loadLocalState() {
  const storedTheme = localStorage.getItem(STORAGE_KEYS.soundTheme);
  const storedMuted = localStorage.getItem(STORAGE_KEYS.muted);
  appState.bestScores = safeParse(localStorage.getItem(STORAGE_KEYS.bestScores), []);
  appState.wrongBook = safeParse(localStorage.getItem(STORAGE_KEYS.wrongBook), []);
  if (storedTheme && soundThemes[storedTheme]) {
    appState.soundTheme = storedTheme;
  }
  appState.muted = storedMuted === null ? true : storedMuted === "true";
}

function renderGradeOptions() {
  const grid = document.querySelector("#gradeButtonGrid");
  grid.innerHTML = grades
    .map((grade) => `<button type="button" class="grade-btn" data-grade-value="${grade}">${grade}年级</button>`)
    .join("");
}

function renderSoundThemeOptions() {
  elements.soundThemeSelect.innerHTML = Object.entries(soundThemes)
    .map(([key, theme]) => `<option value="${key}">${theme.name}</option>`)
    .join("");
}

function restoreSetupState() {
  elements.gradeSelect.value = String(appState.grade);
  elements.modeInput.value = appState.mode;
  elements.countInput.value = String(appState.count);
  elements.soundThemeSelect.value = appState.soundTheme;
  syncCountPresetButtons();
  syncGradeButtons();
}

function bindEvents() {
  elements.setupForm.addEventListener("change", syncSetupSummary);
  elements.soundThemeSelect.addEventListener("change", syncSetupSummary);
  document.querySelectorAll(".grade-btn").forEach((button) => {
    button.addEventListener("click", () => {
      elements.gradeSelect.value = button.dataset.gradeValue;
      syncGradeButtons();
      syncSetupSummary();
    });
  });
  elements.countPresetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      elements.countInput.value = button.dataset.countValue;
      syncCountPresetButtons();
      syncSetupSummary();
    });
  });
  elements.countInput.addEventListener("input", handleCountInput);
  elements.countInput.addEventListener("blur", () => {
    elements.countInput.value = String(clampCount(elements.countInput.value || "1"));
    syncCountPresetButtons();
    syncSetupSummary();
  });
  elements.singleModeBtn.addEventListener("click", () => openPreview("single"));
  elements.multiModeBtn.addEventListener("click", () => openPreview("multi"));
  elements.previewBackBtn.addEventListener("click", () => showSetupArea("form"));
  elements.confirmStartBtn.addEventListener("click", handleStartConfirm);
  elements.recordToggleBtn.addEventListener("click", toggleRecordsOverlay);
  elements.recordsCloseBtn.addEventListener("click", closeRecordsOverlay);
  elements.prevPageBtn.addEventListener("click", () => turnPage(-1));
  elements.nextPageBtn.addEventListener("click", () => turnPage(1));
  elements.restartBtn.addEventListener("click", restartGame);
  elements.detailToggleBtn.addEventListener("click", toggleDetailPanel);
  elements.fullscreenToggle.addEventListener("click", toggleFullscreen);
  elements.muteToggle.addEventListener("click", toggleMute);
  document.querySelectorAll(".keypad-btn").forEach((button) => {
    button.addEventListener("click", () => handleKeypadClick(button));
  });
  document.addEventListener("click", handleButtonFeedback);
  document.addEventListener("keydown", handleGlobalKeydown);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  window.addEventListener("resize", handleViewportChange);
  elements.questionWrap.addEventListener("touchstart", handleTouchStart, { passive: true });
  elements.questionWrap.addEventListener("touchend", handleTouchEnd, { passive: true });
}

function handleCountInput() {
  elements.countInput.value = String(elements.countInput.value).replace(/[^\d]/g, "").slice(0, 4);
  syncCountPresetButtons();
  syncSetupSummary();
}

function clampCount(rawValue) {
  const numeric = Number(String(rawValue).replace(/[^\d]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 1;
  }
  return Math.max(1, Math.min(1000, Math.round(numeric)));
}

function syncSetupSummary() {
  const formData = new FormData(elements.setupForm);
  const grade = Number(formData.get("grade") || 1);
  const count = getSelectedCount();
  const mode = isMobileDevice() ? "single" : (elements.modeInput.value || "single");
  const soundTheme = elements.soundThemeSelect.value || appState.soundTheme;
  const timeLimit = estimateTimeLimit(grade, count, mode);
  const gradeMeta = getGradeMeta(grade);
  const pageSize = mode === "single" ? 1 : count;
  const pages = Math.ceil(count / pageSize);

  appState.grade = grade;
  appState.count = count;
  appState.mode = mode;
  appState.soundTheme = soundTheme;
  appState.timeLimit = timeLimit;
  appState.pageSize = pageSize;

  elements.soundThemeSelect.value = soundTheme;
  syncGradeButtons();
  syncCountPresetButtons();
  persistAudioSettings();
  if (!appState.muted) {
    startMusicLoop();
  }

  elements.summaryCard.innerHTML = `
    <div class="summary-title">本次闯关预览</div>
    <div>${gradeMeta.label}：${gradeMeta.description}</div>
    <div class="summary-meta">
      <span class="summary-chip">共 ${count} 题</span>
      <span class="summary-chip">${mode === "single" ? "单题模式" : "多题长列表模式"}</span>
      <span class="summary-chip">预计 ${formatTime(timeLimit)} 完成</span>
      <span class="summary-chip">${mode === "single" ? `大约 ${pages} 页` : "单页连续作答"}</span>
    </div>
    <div>${gradeMeta.encourage}</div>
    ${mode === "single" ? '<div class="summary-note">小提示：回车、滑动屏幕，或点题号两侧的小箭头，都可以切换上一题和下一题。</div>' : ""}
  `;
}

function openPreview(mode) {
  elements.modeInput.value = isMobileDevice() ? "single" : mode;
  syncSetupSummary();
  showSetupArea("preview");
}

function getSelectedCount() {
  if (!elements.countInput.value) {
    return 1;
  }
  return clampCount(elements.countInput.value);
}

function syncCountPresetButtons() {
  const current = String(elements.countInput.value || "");
  elements.countPresetButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.countValue === current);
  });
}

function syncGradeButtons() {
  const current = String(elements.gradeSelect.value || appState.grade);
  document.querySelectorAll(".grade-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.gradeValue === current);
  });
}

function renderProgressCard() {
  const best = [...appState.bestScores]
    .sort((a, b) => b.score - a.score || a.timeUsed - b.timeUsed)
    .slice(0, 5);

  elements.highScoreList.innerHTML = best.length
    ? best.map((item) => `<li>${item.grade}年级 ${item.count}题 ${item.mode === "single" ? "单题" : "多题"}：${item.score}分</li>`).join("")
    : "<li>还没有历史成绩，开始第一局吧。</li>";

  elements.wrongBookList.innerHTML = appState.wrongBook.length
    ? appState.wrongBook.slice(0, 12).map((item) => `<li>${item.grade}年级 ${item.text} 正确答案：${item.correctAnswer}</li>`).join("")
    : "<li>错题本还是空的，继续保持。</li>";
}

function handleStartConfirm() {
  if (!appState.muted) {
    ensureAudio();
    startMusicLoop();
  }
  requestFullscreenForGame();
  closeRecordsOverlay();
  prepareGame();
  showScreen("game");
  startCountdown();
}

function prepareGame() {
  appState.questions = Array.from({ length: appState.count }, (_, index) => createQuestion(appState.grade, index));
  appState.answers = new Array(appState.questions.length).fill("");
  appState.remainingTime = appState.timeLimit;
  appState.currentPage = 0;
  appState.started = false;
  clearInterval(appState.timerId);
  clearInterval(appState.countdownId);
  updateTimerText();
  renderPage();
}

function createQuestion(grade, index) {
  const meta = getGradeMeta(grade);
  const operation = pickOperationForIndex(meta, index);
  const question = buildOperation(operation, meta);
  return { id: index + 1, ...question };
}

function pickOperationForIndex(meta, index) {
  if (appState.grade === 6) {
    if (index === 0) {
      return "mix";
    }
    if (index === 1) {
      return "÷d";
    }
    if (index === 2) {
      return "÷r";
    }
  }
  return randomChoice(meta.operationWeights);
}

function getGradeMeta(grade) {
  return {
    1: {
      label: "1年级",
      description: "20以内加减法，练习基础反应",
      encourage: "慢慢来，先看清题目再作答。",
      operationWeights: ["+", "+", "-", "-"],
      addMax: 20,
      subMax: 20,
    },
    2: {
      label: "2年级",
      description: "100以内加减法，加入进位退位练习",
      encourage: "注意进位和退位，答题会更稳。",
      operationWeights: ["+", "+", "-", "-", "+", "-"],
      addMax: 100,
      subMax: 100,
    },
    3: {
      label: "3年级",
      description: "加入表内乘除法，开始多样运算",
      encourage: "乘法口诀用起来，速度会更快。",
      operationWeights: ["+", "-", "×", "÷", "×", "÷"],
      addMax: 200,
      subMax: 200,
      mulMax: 9,
      divMax: 9,
    },
    4: {
      label: "4年级",
      description: "除法和余数开始变多，四则运算更灵活",
      encourage: "遇到除法先想商，再看看还剩多少。",
      operationWeights: ["+", "-", "×", "÷", "÷", "÷r"],
      addMax: 500,
      subMax: 500,
      mulMax: 15,
      divMax: 20,
    },
    5: {
      label: "5年级",
      description: "大整数乘除法更常见，加入余数和两步运算",
      encourage: "别着急，复杂题先分步看。",
      operationWeights: ["+", "-", "×", "÷", "÷", "÷r", "mix"],
      addMax: 1200,
      subMax: 1200,
      mulMax: 30,
      divMax: 30,
    },
    6: {
      label: "6年级",
      description: "综合四则运算，含余数和简单小数结果",
      encourage: "像小小数学家一样冷静作答。",
      operationWeights: ["+", "-", "×", "÷", "÷", "÷r", "mix", "÷d"],
      addMax: 2500,
      subMax: 2500,
      mulMax: 40,
      divMax: 40,
    },
  }[grade];
}

function buildOperation(operation, meta) {
  if (operation === "+") {
    const left = randomInt(1, meta.addMax);
    const right = randomInt(1, meta.addMax);
    return { text: `${left} + ${right} =`, answer: left + right, displayAnswer: String(left + right), type: "normal" };
  }

  if (operation === "-") {
    const left = randomInt(1, meta.subMax);
    const right = randomInt(1, left);
    return { text: `${left} - ${right} =`, answer: left - right, displayAnswer: String(left - right), type: "normal" };
  }

  if (operation === "×") {
    const left = randomInt(2, meta.mulMax);
    const right = randomInt(2, meta.mulMax);
    return { text: `${left} × ${right} =`, answer: left * right, displayAnswer: String(left * right), type: "normal" };
  }

  if (operation === "÷") {
    const answer = randomInt(2, meta.divMax);
    const right = randomInt(2, meta.divMax);
    return { text: `${answer * right} ÷ ${right} =`, answer, displayAnswer: String(answer), type: "normal" };
  }

  if (operation === "÷r") {
    const divisor = randomInt(3, meta.divMax);
    const quotient = randomInt(2, meta.divMax + 5);
    const remainder = randomInt(1, divisor - 1);
    const dividend = divisor * quotient + remainder;
    return { text: `${dividend} ÷ ${divisor} =`, answer: { quotient, remainder }, displayAnswer: `${quotient}...${remainder}`, type: "remainder" };
  }

  if (operation === "÷d") {
    const divisor = randomChoice([2, 4, 5, 8, 10]);
    const answer = randomChoice([2.5, 5, 7.5, 12.5, 15, 17.5]);
    const dividend = Number((divisor * answer).toFixed(2));
    return { text: `${dividend} ÷ ${divisor} =`, answer, displayAnswer: formatAnswer(answer), type: "decimal" };
  }

  const left = randomInt(2, Math.max(4, Math.floor(meta.mulMax * 0.7)));
  const right = randomInt(2, Math.max(4, Math.floor(meta.mulMax * 0.7)));
  const extra = randomInt(5, 30);
  if (Math.random() > 0.5) {
    return { text: `${left} × ${right} + ${extra} =`, answer: left * right + extra, displayAnswer: String(left * right + extra), type: "normal" };
  }
  return { text: `${left * right + extra} - ${left} × ${right} =`, answer: extra, displayAnswer: String(extra), type: "normal" };
}

function estimateTimeLimit(grade, count, mode) {
  const baseSecondsPerQuestion = { 1: 7, 2: 7, 3: 8, 4: 10, 5: 11, 6: 12 }[grade];
  const modeAdjust = mode === "single" ? 2 : 0;
  const buffer = 25 + Math.ceil(count / 10) * 6;
  return count * (baseSecondsPerQuestion + modeAdjust) + buffer;
}

function showScreen(screen) {
  elements.setupScreen.classList.toggle("active", screen === "setup");
  elements.gameScreen.classList.toggle("active", screen === "game");
  elements.resultScreen.classList.toggle("active", screen === "result");
  const showFullscreen = screen === "game" && isMobileDevice();
  elements.fullscreenToggle.classList.toggle("hidden", !showFullscreen);
  updateFullscreenButton();
}

function startCountdown() {
  const sequence = ["3", "2", "1", "开始"];
  let index = 0;
  elements.countdownOverlay.classList.remove("hidden");
  elements.countdownText.textContent = sequence[index];
  playEffect("beep");

  appState.countdownId = setInterval(() => {
    index += 1;
    if (index >= sequence.length) {
      clearInterval(appState.countdownId);
      elements.countdownOverlay.classList.add("hidden");
      appState.started = true;
      startTimer();
      focusInputByPosition("first");
      return;
    }
    elements.countdownText.textContent = sequence[index];
    playEffect("beep");
  }, 850);
}

function startTimer() {
  clearInterval(appState.timerId);
  appState.timerId = setInterval(() => {
    appState.remainingTime -= 1;
    updateTimerText();
    if (appState.remainingTime > 0 && appState.remainingTime <= 10) {
      playEffect("urgent");
    }
    if (appState.remainingTime <= 0) {
      finishGame();
    }
  }, 1000);
}

function updateTimerText() {
  elements.timerText.textContent = formatTime(Math.max(appState.remainingTime, 0));
  elements.timerText.classList.toggle("timer-warning", appState.remainingTime <= 30);
}

function renderPage() {
  updateMetaBar();
  const singleMode = appState.mode === "single";
  const mobileKeyboardMode = isMobileDevice();
  elements.questionWrap.classList.toggle("single-mode", singleMode);
  elements.questionWrap.classList.toggle("multi-mode", !singleMode);
  elements.kidKeypad.classList.toggle("hidden", !singleMode);
  elements.pager.classList.toggle("hidden", singleMode);
  elements.prevPageBtn.classList.toggle("hidden", singleMode);
  elements.nextPageBtn.classList.toggle("hidden", singleMode);
  elements.pagerTip.classList.toggle("hidden", singleMode);
  const start = appState.mode === "single" ? appState.currentPage * appState.pageSize : 0;
  const end = appState.mode === "single" ? Math.min(start + appState.pageSize, appState.questions.length) : appState.questions.length;
  const pageQuestions = appState.questions.slice(start, end);

  elements.questionList.innerHTML = pageQuestions.map((question, index) => {
    const absoluteIndex = start + index;
    const placeholder = question.type === "remainder" ? "如 6...5" : question.type === "decimal" ? "如 12.5" : "写答案";
    const prevDisabled = absoluteIndex === 0 ? "disabled" : "";
    const nextDisabled = absoluteIndex === appState.questions.length - 1 ? "disabled" : "";
    const indexMarkup = singleMode
      ? `
        <div class="question-index-shell">
          <button type="button" class="question-nav-btn prev" data-nav-step="-1" aria-label="上一题" ${prevDisabled}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div class="question-index">${absoluteIndex + 1}</div>
          <button type="button" class="question-nav-btn next" data-nav-step="1" aria-label="下一题" ${nextDisabled}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      `
      : `<div class="question-index">${absoluteIndex + 1}</div>`;
    return `
      <article class="question-card" data-card-index="${absoluteIndex}">
        ${indexMarkup}
        <div class="question-main">
          <div class="question-no">第 ${absoluteIndex + 1} 题</div>
          <label class="question-text" for="answer-${absoluteIndex}">${question.text}</label>
        </div>
        <input id="answer-${absoluteIndex}" class="answer-input${mobileKeyboardMode ? " custom-keypad-input" : ""}" type="text" inputmode="${mobileKeyboardMode ? "none" : "decimal"}" ${mobileKeyboardMode ? 'readonly virtualkeyboardpolicy="manual"' : ""} data-index="${absoluteIndex}" value="${appState.answers[absoluteIndex]}" autocomplete="off" placeholder="${placeholder}">
      </article>
    `;
  }).join("");

  bindAnswerInputs();
  bindQuestionNavButtons();
  elements.prevPageBtn.disabled = appState.currentPage === 0;
  elements.nextPageBtn.textContent = appState.currentPage === getTotalPages() - 1 ? "完成答题" : "下一页";
}

function updateMetaBar() {
  elements.gradePill.textContent = `${appState.grade}年级`;
  elements.modePill.textContent = appState.mode === "single" ? "单题模式" : "多题长列表模式";
  elements.pagePill.textContent = appState.mode === "single"
    ? `第 ${appState.currentPage + 1} / ${getTotalPages()} 页`
    : `共 ${appState.questions.length} 题`;
  elements.pagerTip.textContent = appState.mode === "single"
    ? "回车或点下一页进入下一题，空着也能跳过。Page Up / Page Down 可以翻页。"
    : "Tab / Enter 去下一题，Shift+Tab 去上一题，方向键左右上下切换题目，Page Up / Page Down 跳 10 题。";
}

function bindAnswerInputs() {
  const inputs = [...document.querySelectorAll(".answer-input")];
  inputs.forEach((input, localIndex) => {
    input.addEventListener("input", (event) => {
      updateAnswerFromInput(event.target);
    });
    if (input.hasAttribute("readonly")) {
      input.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        focusInput(event.currentTarget);
      });
    }
    input.addEventListener("focus", (event) => {
      const index = Number(event.target.dataset.index);
      highlightCard(index);
      scrollCardIntoCenter(index);
    });
    input.addEventListener("keydown", (event) => handleInputKeydown(event, inputs, localIndex));
  });
}

function bindQuestionNavButtons() {
  document.querySelectorAll(".question-nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
      goToSingleQuestion(Number(button.dataset.navStep));
    });
  });
}

function normalizeInputValue(value) {
  return value
    .replace(/。|．/g, ".")
    .replace(/…/g, "...")
    .replace(/···/g, "...")
    .replace(/[^0-9.\-]/g, "")
    .replace(/\.{4,}/g, "...");
}

function isAnswerBlank(value) {
  return !String(value ?? "").trim();
}

function findNextEmptyIndex(fromIndex) {
  for (let index = fromIndex + 1; index < appState.answers.length; index += 1) {
    if (isAnswerBlank(appState.answers[index])) {
      return index;
    }
  }
  for (let index = 0; index <= fromIndex; index += 1) {
    if (isAnswerBlank(appState.answers[index])) {
      return index;
    }
  }
  return -1;
}

function goToSingleQuestionIndex(index, position = "first") {
  if (appState.mode !== "single") {
    return;
  }
  if (index < 0 || index >= getTotalPages()) {
    return;
  }
  appState.currentPage = index;
  renderPage();
  playEffect("page");
  focusInputByPosition(position);
}

function goToNextUnansweredOrFinish(currentIndex) {
  const nextEmptyIndex = findNextEmptyIndex(currentIndex);
  if (nextEmptyIndex !== -1) {
    if (appState.mode === "single") {
      goToSingleQuestionIndex(nextEmptyIndex, "first");
    } else {
      focusInputByAbsoluteIndex(nextEmptyIndex);
    }
    return;
  }
  finishGame();
}

function handleInputKeydown(event, inputs, localIndex) {
  if (!appState.started) {
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    const currentIndex = Number(event.target.dataset.index);

    if (appState.mode === "single") {
      goToNextUnansweredOrFinish(currentIndex);
      return;
    }

    goToNextUnansweredOrFinish(currentIndex);
  }

  if (appState.mode === "multi") {
    const currentIndex = Number(event.target.dataset.index);
    if (["ArrowUp", "ArrowLeft"].includes(event.key)) {
      event.preventDefault();
      focusInputByAbsoluteIndex(currentIndex - 1);
    }
    if (["ArrowDown", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      focusInputByAbsoluteIndex(currentIndex + 1);
    }
  }
}

function handleGlobalKeydown(event) {
  if (!elements.gameScreen.classList.contains("active") || !appState.started) {
    return;
  }

  if (event.key === "PageDown") {
    event.preventDefault();
    if (appState.mode === "single") {
      goToNextUnansweredOrFinish(appState.currentPage);
    } else {
      focusInputByAbsoluteIndex((appState.currentFocusIndex ?? 0) + 10);
    }
  }
  if (event.key === "PageUp") {
    event.preventDefault();
    if (appState.mode === "single") {
      turnPage(-1, "last");
    } else {
      focusInputByAbsoluteIndex((appState.currentFocusIndex ?? 0) - 10);
    }
  }
}

function turnPage(direction, position = "first") {
  if (appState.mode !== "single") {
    return;
  }
  if (!elements.gameScreen.classList.contains("active")) {
    return;
  }
  const nextPage = appState.currentPage + direction;
  if (nextPage < 0) {
    return;
  }
  if (nextPage >= getTotalPages()) {
    finishGame();
    return;
  }

  appState.currentPage = nextPage;
  renderPage();
  playEffect("page");
  focusInputByPosition(position);
}

function goToSingleQuestion(direction) {
  if (appState.mode !== "single") {
    return;
  }
  if (direction > 0) {
    goToNextUnansweredOrFinish(appState.currentPage);
    return;
  }
  turnPage(direction, direction < 0 ? "last" : "first");
}

function focusInputByPosition(position) {
  const inputs = [...document.querySelectorAll(".answer-input")];
  if (!inputs.length) {
    return;
  }
  focusInput(position === "last" ? inputs[inputs.length - 1] : inputs[0]);
}

function focusInput(target) {
  target.focus();
  target.select();
  const index = Number(target.dataset.index);
  appState.currentFocusIndex = index;
  highlightCard(index);
  scrollCardIntoView(index);
}

function handleKeypadClick(button) {
  const activeInput = document.activeElement?.classList?.contains("answer-input")
    ? document.activeElement
    : document.querySelector(".question-card.active .answer-input") || document.querySelector(".answer-input");

  if (!activeInput) {
    return;
  }

  const action = button.dataset.keypadAction;
  if (action) {
    if (action === "clear") {
      activeInput.value = "";
      updateAnswerFromInput(activeInput);
      return;
    }
    if (action === "enter") {
      activeInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      return;
    }
  }

  const value = button.dataset.keypadValue;
  if (value === "..." && activeInput.value.includes("...")) {
    return;
  }
  if (value === "." && activeInput.value.includes(".") && !activeInput.value.includes("...")) {
    return;
  }
  activeInput.value += value;
  updateAnswerFromInput(activeInput);
  activeInput.focus();
}

function handleTouchStart(event) {
  if (appState.mode !== "single" || !elements.gameScreen.classList.contains("active")) {
    return;
  }
  const touch = event.changedTouches?.[0];
  if (!touch) {
    return;
  }
  swipeState.startX = touch.clientX;
  swipeState.startY = touch.clientY;
  swipeState.tracking = true;
}

function handleTouchEnd(event) {
  if (!swipeState.tracking || appState.mode !== "single" || !elements.gameScreen.classList.contains("active")) {
    return;
  }
  swipeState.tracking = false;
  const touch = event.changedTouches?.[0];
  if (!touch) {
    return;
  }

  const deltaX = touch.clientX - swipeState.startX;
  const deltaY = touch.clientY - swipeState.startY;
  const threshold = 42;

  if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
    return;
  }

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    goToSingleQuestion(deltaX < 0 ? 1 : -1);
    return;
  }

  goToSingleQuestion(deltaY < 0 ? 1 : -1);
}

function updateAnswerFromInput(input) {
  const normalized = normalizeInputValue(input.value);
  input.value = normalized;
  appState.answers[Number(input.dataset.index)] = normalized;
  highlightCard(Number(input.dataset.index));
}

function focusInputByAbsoluteIndex(index) {
  const inputs = [...document.querySelectorAll(".answer-input")];
  if (!inputs.length) {
    return;
  }
  const targetIndex = Math.max(0, Math.min(inputs.length - 1, index));
  focusInput(inputs[targetIndex]);
}

function highlightCard(index) {
  document.querySelectorAll(".question-card").forEach((card) => {
    card.classList.toggle("active", Number(card.dataset.cardIndex) === index);
  });
}

function scrollCardIntoView(index) {
  const card = document.querySelector(`[data-card-index="${index}"]`);
  if (!card) {
    return;
  }
  requestAnimationFrame(() => {
    const container = elements.questionList.closest(".question-wrap");
    if (!container || appState.mode === "single") {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const topSafe = containerRect.top + 110;
    const bottomSafe = containerRect.bottom - 140;

    if (cardRect.top < topSafe || cardRect.bottom > bottomSafe) {
      const offset = card.offsetTop - container.clientHeight * 0.28;
      container.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
    }
  });
}

function getTotalPages() {
  return Math.ceil(appState.questions.length / appState.pageSize);
}

function finishGame() {
  clearInterval(appState.timerId);
  clearInterval(appState.countdownId);
  appState.started = false;
  closeRecordsOverlay();
  playEffect("finish");
  buildResultDetails();
  persistResults();
  showResult();
  renderProgressCard();
  showScreen("result");
}

function buildResultDetails() {
  appState.resultDetails = appState.questions.map((question, index) => {
    const raw = appState.answers[index];
    const parsed = parseAnswer(raw);
    const skipped = raw === "";
    const correct = !skipped && isAnswerCorrect(question, parsed);
    return {
      index: index + 1,
      text: question.text,
      userAnswer: skipped ? "未作答" : raw,
      correctAnswer: question.displayAnswer,
      correct,
      skipped,
    };
  });
}

function parseAnswer(raw) {
  const value = raw.trim();
  if (!value) {
    return null;
  }
  const remainderMatch = value.match(/^(-?\d+)(?:\.{3}|…)(-?\d+)$/);
  if (remainderMatch) {
    return { quotient: Number(remainderMatch[1]), remainder: Number(remainderMatch[2]) };
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : value;
}

function isAnswerCorrect(question, parsed) {
  if (question.type === "remainder") {
    return parsed && typeof parsed === "object" && parsed.quotient === question.answer.quotient && parsed.remainder === question.answer.remainder;
  }
  return typeof parsed === "number" && Math.abs(parsed - Number(question.answer)) < 0.0001;
}

function persistResults() {
  const correctCount = appState.resultDetails.filter((item) => item.correct).length;
  const score = Math.round((correctCount / appState.resultDetails.length) * 100);
  const timeUsed = appState.timeLimit - appState.remainingTime;

  appState.bestScores = [...appState.bestScores, { grade: appState.grade, count: appState.count, mode: appState.mode, score, timeUsed }]
    .sort((a, b) => b.score - a.score || a.timeUsed - b.timeUsed)
    .slice(0, 30);
  localStorage.setItem(STORAGE_KEYS.bestScores, JSON.stringify(appState.bestScores));

  const wrongItems = appState.resultDetails
    .filter((item) => !item.correct)
    .map((item) => ({ grade: appState.grade, text: item.text, correctAnswer: item.correctAnswer }));
  appState.wrongBook = [...wrongItems, ...appState.wrongBook].slice(0, 80);
  localStorage.setItem(STORAGE_KEYS.wrongBook, JSON.stringify(appState.wrongBook));
}

function showResult() {
  const correctCount = appState.resultDetails.filter((item) => item.correct).length;
  const skippedCount = appState.resultDetails.filter((item) => item.skipped).length;
  const wrongCount = appState.resultDetails.length - correctCount - skippedCount;
  const score = Math.round((correctCount / appState.resultDetails.length) * 100);
  elements.scoreText.textContent = String(score);
  elements.resultTitle.textContent = getResultTitle(score);
  elements.resultSubtitle.textContent = `答对 ${correctCount} 题，答错 ${wrongCount} 题，跳过 ${skippedCount} 题，用时 ${formatTime(appState.timeLimit - appState.remainingTime)}。`;
  elements.detailSummary.textContent = `共 ${appState.resultDetails.length} 题，下面是全部答题详情。`;
  renderDetailPage();
  elements.detailPanel.classList.add("hidden");
  elements.detailToggleBtn.textContent = "查看得分详情";
}

function renderDetailPage() {
  elements.detailList.innerHTML = appState.resultDetails.map((item) => {
    const statusClass = item.correct ? "correct" : item.skipped ? "skipped" : "wrong";
    const statusText = item.correct ? "答对啦" : item.skipped ? `跳过，正确答案 ${item.correctAnswer}` : `正确答案 ${item.correctAnswer}`;
    return `
      <article class="detail-item">
        <div class="detail-number">第 ${item.index} 题</div>
        <div class="detail-question">${item.text}</div>
        <div class="detail-answer">你的答案：${item.userAnswer}</div>
        <div class="detail-status ${statusClass}">${statusText}</div>
      </article>
    `;
  }).join("");
}

function getResultTitle(score) {
  if (score === 100) {
    return "太棒了，满分小达人";
  }
  if (score >= 90) {
    return "表现很亮眼";
  }
  if (score >= 75) {
    return "继续加油，已经很不错";
  }
  return "今天也有进步";
}

function toggleDetailPanel() {
  const hidden = elements.detailPanel.classList.toggle("hidden");
  elements.detailToggleBtn.textContent = hidden ? "查看得分详情" : "收起得分详情";
}

function showSetupArea(area) {
  const showPreview = area === "preview";
  elements.setupForm.classList.toggle("hidden", showPreview);
  elements.previewScreen.classList.toggle("hidden", !showPreview);
  elements.setupScreen.classList.toggle("preview-mode", showPreview);
  elements.setupTitle.textContent = showPreview ? "本次预览" : "准备出发";
  elements.setupDesc.classList.toggle("hidden", showPreview);
}

function toggleRecordsOverlay() {
  const willOpen = elements.recordsOverlay.classList.contains("hidden");
  if (willOpen) {
    openRecordsOverlay();
  } else {
    closeRecordsOverlay();
  }
}

function openRecordsOverlay() {
  elements.recordsOverlay.classList.remove("hidden");
  elements.recordToggleBtn.setAttribute("aria-pressed", "true");
}

function closeRecordsOverlay() {
  elements.recordsOverlay.classList.add("hidden");
  elements.recordToggleBtn.setAttribute("aria-pressed", "false");
}

function restartGame() {
  clearInterval(appState.timerId);
  clearInterval(appState.countdownId);
  closeRecordsOverlay();
  showScreen("setup");
  showSetupArea("form");
}

function handleButtonFeedback(event) {
  const button = event.target.closest("button");
  if (!button || button.disabled || button.classList.contains("hidden")) {
    return;
  }
  provideButtonFeedback();
}

function provideButtonFeedback() {
  if ("vibrate" in navigator) {
    navigator.vibrate(10);
  }
  playEffect("tap");
}

function toggleMute() {
  appState.muted = !appState.muted;
  updateMuteButton();
  persistAudioSettings();
  if (!appState.muted) {
    ensureAudio();
    startMusicLoop();
  } else {
    stopMusicLoop();
  }
}

function updateMuteButton() {
  elements.muteToggle.textContent = appState.muted ? "🔇" : "🔊";
  elements.muteToggle.setAttribute("aria-label", appState.muted ? "开启声音" : "关闭声音");
  elements.muteToggle.setAttribute("aria-pressed", String(!appState.muted));
}

function persistAudioSettings() {
  localStorage.setItem(STORAGE_KEYS.soundTheme, appState.soundTheme);
  localStorage.setItem(STORAGE_KEYS.muted, String(appState.muted));
}

function ensureAudio() {
  if (appState.audioContext) {
    if (appState.audioContext.state === "suspended") {
      appState.audioContext.resume();
    }
    return;
  }
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }
  appState.audioContext = new AudioContextCtor();
  appState.musicGain = appState.audioContext.createGain();
  appState.effectGain = appState.audioContext.createGain();
  appState.musicGain.gain.value = 0.045;
  appState.effectGain.gain.value = 0.09;
  appState.musicGain.connect(appState.audioContext.destination);
  appState.effectGain.connect(appState.audioContext.destination);
}

function startMusicLoop() {
  ensureAudio();
  stopMusicLoop();
  if (!appState.audioContext || appState.muted) {
    return;
  }
  const theme = soundThemes[appState.soundTheme];
  let cursor = appState.audioContext.currentTime + 0.02;
  theme.melody.forEach((frequency, index) => {
    const duration = index === theme.melody.length - 1 ? 0.32 : 0.22;
    playTone(frequency, duration, cursor, theme.musicWave, appState.musicGain, 0.22);
    cursor += duration;
  });
  appState.musicTimeoutId = window.setTimeout(startMusicLoop, (theme.melody.length * 0.22 + 0.12) * 1000);
}

function stopMusicLoop() {
  window.clearTimeout(appState.musicTimeoutId);
  appState.musicTimeoutId = null;
}

function playEffect(type) {
  ensureAudio();
  if (!appState.audioContext || appState.muted) {
    return;
  }
  const theme = soundThemes[appState.soundTheme];
  const now = appState.audioContext.currentTime;
  const sequence = type === "page"
    ? theme.page
    : type === "finish"
      ? theme.finish
      : type === "urgent"
        ? [theme.beep[0], theme.beep[0] * 1.12]
        : type === "tap"
          ? [theme.page[0] ?? theme.beep[0]]
        : theme.beep;
  sequence.forEach((frequency, index) => {
    const duration = type === "finish" ? 0.18 : type === "urgent" ? 0.07 : type === "tap" ? 0.045 : 0.1;
    const peak = type === "urgent" ? 0.24 : type === "tap" ? 0.06 : 0.18;
    playTone(frequency, duration, now + index * 0.08, theme.effectWave, appState.effectGain, peak);
  });
}

function playTone(frequency, duration, startTime, type, targetGain, peakGain) {
  const oscillator = appState.audioContext.createOscillator();
  const gainNode = appState.audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gainNode);
  gainNode.connect(targetGain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatAnswer(answer) {
  if (typeof answer === "number" && !Number.isInteger(answer)) {
    return String(Number(answer.toFixed(2)));
  }
  return String(answer);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function updateMetaBar() {
  elements.gradePill.textContent = `${appState.grade}年级`;
  elements.modePill.textContent = appState.mode === "single" ? "单题模式" : "多题长列表";
  elements.pagePill.textContent = appState.mode === "single"
    ? `第 ${appState.currentPage + 1}/${getTotalPages()} 题`
    : `共 ${appState.questions.length} 题`;
  elements.pagerTip.textContent = appState.mode === "single"
    ? "回车或继续下一题时，会优先跳到还没填写的题目。Page Up / Page Down 也可以翻页。"
    : "Tab / Enter 去下一题，Shift+Tab 去上一题，方向键切换题目，Page Up / Page Down 跳 10 题。";
}

function focusInput(target) {
  target.focus({ preventScroll: true });
  if (!target.hasAttribute("readonly")) {
    target.select();
  }
  const index = Number(target.dataset.index);
  appState.currentFocusIndex = index;
  highlightCard(index);
  scrollCardIntoView(index);
}

function isMobilePortrait() {
  return window.matchMedia("(max-width: 820px) and (orientation: portrait)").matches;
}

function isMobileDevice() {
  return window.matchMedia("(pointer: coarse), (max-width: 1024px)").matches;
}

function applyPlatformMode() {
  const mobile = isMobileDevice();
  elements.multiModeBtn.classList.toggle("hidden", mobile);
  elements.multiModeBtn.disabled = mobile;
  if (mobile) {
    elements.modeInput.value = "single";
  }
}

function handleViewportChange() {
  applyPlatformMode();
  if (elements.gameScreen.classList.contains("active")) {
    showScreen("game");
    renderPage();
  } else {
    syncSetupSummary();
  }
}

async function requestFullscreenForGame() {
  if (!isMobileDevice() || document.fullscreenElement || deviceState.fullscreenRequested) {
    updateFullscreenButton();
    return;
  }
  const target = document.documentElement;
  if (!target.requestFullscreen) {
    updateFullscreenButton();
    return;
  }
  deviceState.fullscreenRequested = true;
  try {
    await target.requestFullscreen();
  } catch {
    deviceState.fullscreenRequested = false;
  }
  updateFullscreenButton();
}

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } else {
    deviceState.fullscreenRequested = false;
    await requestFullscreenForGame();
  }
  updateFullscreenButton();
}

function updateFullscreenButton() {
  if (!elements.fullscreenToggle) {
    return;
  }
  const isFullscreen = Boolean(document.fullscreenElement);
  elements.fullscreenToggle.textContent = isFullscreen ? "✕" : "⛶";
  elements.fullscreenToggle.setAttribute("aria-pressed", String(isFullscreen));
  elements.fullscreenToggle.setAttribute("aria-label", isFullscreen ? "退出全屏" : "进入全屏");
}

init();
