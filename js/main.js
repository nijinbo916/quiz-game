/* ============================================================
   Quiz Game · 交互与逻辑层
   Web 开发技术 Lesson 2 课堂项目
   ------------------------------------------------------------
   三屏状态机：开始 → 答题 → 结算（含错题复盘）
   特性：计时、连对加成、即时反馈与解析、答题复盘、最高分本地保存
   ============================================================ */

/* ---------- 1. 题库 ---------- */
const QUESTIONS = [
  {
    q: 'HTML 中用于定义超链接的标签是？',
    options: ['<a>', '<link>', '<href>', '<url>'],
    answer: 0,
    tip: '<a> 标签配合 href 属性创建超链接；<link> 用于在 <head> 中引入外部资源（如样式表）。'
  },
  {
    q: 'CSS 中要选中 id 为 header 的元素，应该用哪种选择器？',
    options: ['.header', '#header', 'header', '* header'],
    answer: 1,
    tip: '`#` 对应 id，`.` 对应 class，直接写标签名则是标签选择器。'
  },
  {
    q: '哪个 CSS 属性决定元素的宽高是否包含内边距和边框？',
    options: ['display', 'position', 'box-sizing', 'overflow'],
    answer: 2,
    tip: 'box-sizing: border-box 让 width 包含 padding 与 border，布局计算更直观。'
  },
  {
    q: 'JavaScript 中声明一个「不会被重新赋值」的变量，应该用？',
    options: ['var', 'let', 'const', 'static'],
    answer: 2,
    tip: 'const 声明常量，禁止重新赋值；var 存在变量提升，let / const 是块级作用域。'
  },
  {
    q: '哪个数组方法可以在末尾追加元素？',
    options: ['shift()', 'unshift()', 'pop()', 'push()'],
    answer: 3,
    tip: 'push() 尾部添加，pop() 尾部删除，unshift() 头部添加，shift() 头部删除。'
  },
  {
    q: 'document.querySelector(".btn") 返回的是什么？',
    options: ['所有 .btn 元素组成的数组', '第一个匹配 .btn 的元素', '匹配元素的数量', '一个布尔值'],
    answer: 1,
    tip: 'querySelector 返回第一个匹配项（单个元素）；要拿全部需用 querySelectorAll。'
  },
  {
    q: '用弹性布局让子元素水平居中对齐，应设置？',
    options: [
      'display: flex; justify-content: center',
      'display: block; text-align: center',
      'position: absolute; left: 0',
      'float: center'
    ],
    answer: 0,
    tip: 'justify-content 控制主轴对齐，align-items 控制交叉轴对齐；float 没有 center 值。'
  },
  {
    q: '表示页面「主体内容」最合适的语义化标签是？',
    options: ['<div>', '<section>', '<main>', '<article>'],
    answer: 2,
    tip: '一个页面只应有一个 <main>，用于包裹该页面的核心内容，便于无障碍与 SEO。'
  },
  {
    q: '在 JavaScript 中，typeof [] 的结果是？',
    options: ['"array"', '"object"', '"list"', '"undefined"'],
    answer: 1,
    tip: '数组本质是对象，所以 typeof [] 返回 "object"。要用 Array.isArray() 判断数组。'
  },
  {
    q: '给输入框设置灰色提示文字，应该用哪个属性？',
    options: ['value', 'title', 'placeholder', 'alt'],
    answer: 2,
    tip: 'placeholder 展示未输入时的提示；value 是真实的值；title 是鼠标悬停提示。'
  }
];

/* ---------- 2. 配置 ---------- */
const TIME_PER_QUESTION = 20; // 秒
const BEST_KEY = 'quiz-best-score';

/* ---------- 3. DOM 引用 ---------- */
const el = {
  bestScore: document.getElementById('bestScore'),
  startTotal: document.getElementById('startTotal'),
  startBtn: document.getElementById('startBtn'),

  screenStart: document.getElementById('screenStart'),
  screenQuiz: document.getElementById('screenQuiz'),
  screenResult: document.getElementById('screenResult'),

  qIndex: document.getElementById('qIndex'),
  qTotal: document.getElementById('qTotal'),
  streakChip: document.getElementById('streakChip'),
  streakNum: document.getElementById('streakNum'),
  scoreNow: document.getElementById('scoreNow'),
  progressFill: document.getElementById('progressFill'),
  timerFill: document.getElementById('timerFill'),
  timerText: document.getElementById('timerText'),

  questionText: document.getElementById('questionText'),
  options: document.getElementById('options'),
  feedback: document.getElementById('feedback'),
  feedbackIcon: document.getElementById('feedbackIcon'),
  feedbackText: document.getElementById('feedbackText'),
  feedbackTip: document.getElementById('feedbackTip'),
  nextBtn: document.getElementById('nextBtn'),

  resultScore: document.getElementById('resultScore'),
  resultTotal: document.getElementById('resultTotal'),
  resultGrade: document.getElementById('resultGrade'),
  resultDesc: document.getElementById('resultDesc'),
  statRate: document.getElementById('statRate'),
  statStreak: document.getElementById('statStreak'),
  statTime: document.getElementById('statTime'),
  ringFill: document.getElementById('ringFill'),
  againBtn: document.getElementById('againBtn'),
  reviewBtn: document.getElementById('reviewBtn'),
  review: document.getElementById('review'),
  reviewList: document.getElementById('reviewList')
};

/* ---------- 4. 状态 ---------- */
const state = {
  round: [],        // 本局题目（已打乱）
  index: 0,         // 当前题号
  score: 0,         // 答对数量
  streak: 0,        // 当前连对
  maxStreak: 0,     // 最高连对
  records: [],      // 每题作答记录
  locked: false,    // 已作答，禁止重复点击
  timeLeft: TIME_PER_QUESTION,
  timerId: null,
  startedAt: 0
};

/* ---------- 5. 工具函数 ---------- */

/** Fisher–Yates 洗牌，返回新数组 */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 把题库复制并打乱：题目顺序 + 每题选项顺序都打乱 */
function buildRound() {
  return shuffle(QUESTIONS).map((item) => {
    const correctText = item.options[item.answer];
    const options = shuffle(item.options);
    return {
      q: item.q,
      options,
      answer: options.indexOf(correctText),
      tip: item.tip
    };
  });
}

/** 切换屏幕 */
function showScreen(name) {
  el.screenStart.hidden = name !== 'start';
  el.screenQuiz.hidden = name !== 'quiz';
  el.screenResult.hidden = name !== 'result';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** 读取 / 写入最高分（localStorage 可能被禁用，需容错） */
function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch (e) {
    return 0;
  }
}
function writeBest(value) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch (e) { /* 忽略 */ }
}

function renderBest() {
  const best = readBest();
  el.bestScore.textContent = best > 0 ? `${best} / ${QUESTIONS.length}` : '--';
}

/* ---------- 6. 计时器 ---------- */
function startTimer() {
  stopTimer();
  state.timeLeft = TIME_PER_QUESTION;
  updateTimerUI();

  state.timerId = setInterval(() => {
    state.timeLeft = Math.max(0, state.timeLeft - 0.1);
    updateTimerUI();
    if (state.timeLeft <= 0) {
      stopTimer();
      answer(-1); // -1 表示超时未作答
    }
  }, 100);
}

function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function updateTimerUI() {
  const ratio = state.timeLeft / TIME_PER_QUESTION;
  el.timerFill.style.width = `${ratio * 100}%`;
  el.timerText.textContent = `${Math.ceil(state.timeLeft)}s`;

  el.timerFill.classList.toggle('is-warn', ratio <= 0.5 && ratio > 0.25);
  el.timerFill.classList.toggle('is-danger', ratio <= 0.25);
}

/* ---------- 7. 渲染题目 ---------- */
function renderQuestion() {
  const item = state.round[state.index];
  state.locked = false;

  el.qIndex.textContent = state.index + 1;
  el.qTotal.textContent = state.round.length;
  el.progressFill.style.width = `${(state.index / state.round.length) * 100}%`;
  el.scoreNow.textContent = state.score;

  el.questionText.textContent = item.q;

  el.options.innerHTML = item.options.map((text, i) => `
    <li>
      <button class="option" type="button" data-i="${i}">
        <span class="option-key">${'ABCD'[i]}</span>
        <span class="option-text">${text}</span>
      </button>
    </li>`).join('');

  el.feedback.hidden = true;
  el.feedback.className = 'feedback';
  el.nextBtn.disabled = true;
  el.nextBtn.textContent =
    state.index === state.round.length - 1 ? '查看结果 →' : '下一题 →';

  startTimer();
}

/* ---------- 8. 作答 ---------- */
function answer(choice) {
  if (state.locked) return;
  state.locked = true;
  stopTimer();

  const item = state.round[state.index];
  const correct = choice === item.answer;
  const isTimeout = choice === -1;

  /* 计分 */
  if (correct) {
    state.score += 1;
    state.streak += 1;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
  } else {
    state.streak = 0;
  }

  /* 记录 */
  state.records.push({
    q: item.q,
    options: item.options,
    answer: item.answer,
    chosen: choice,
    correct
  });

  /* 选项着色 */
  el.options.querySelectorAll('.option').forEach((btn) => {
    const i = Number(btn.dataset.i);
    btn.disabled = true;
    if (i === item.answer) btn.classList.add('is-correct');
    else if (i === choice) btn.classList.add('is-wrong');
    else btn.classList.add('is-dim');
  });

  /* 反馈条 */
  el.feedback.hidden = false;
  if (correct) {
    el.feedback.classList.add('is-ok');
    el.feedbackIcon.textContent = '✅';
    el.feedbackText.textContent =
      state.streak >= 3 ? `答对！连对 ${state.streak} 🔥` : '答对！';
  } else {
    el.feedback.classList.add('is-bad');
    el.feedbackIcon.textContent = isTimeout ? '⏰' : '❌';
    el.feedbackText.textContent = isTimeout
      ? '时间到，未作答'
      : `答错了，正确答案是 ${'ABCD'[item.answer]}`;
  }
  el.feedbackTip.textContent = item.tip;

  /* 顶部状态 */
  el.scoreNow.textContent = state.score;
  el.streakChip.hidden = state.streak < 2;
  el.streakNum.textContent = state.streak;

  el.nextBtn.disabled = false;
  el.nextBtn.focus({ preventScroll: true });
}

/* ---------- 9. 推进 ---------- */
function next() {
  if (!state.locked) return; // 还没作答

  if (state.index >= state.round.length - 1) {
    finish();
    return;
  }

  state.index += 1;
  renderQuestion();
}

/* ---------- 10. 结算 ---------- */
function finish() {
  stopTimer();
  showScreen('result');

  const total = state.round.length;
  const score = state.score;
  const rate = Math.round((score / total) * 100);
  const seconds = Math.max(1, Math.round((Date.now() - state.startedAt) / 1000));

  /* 分数环 */
  const C = 2 * Math.PI * 52; // 与 SVG r=52 对应
  el.ringFill.style.strokeDasharray = C.toFixed(1);
  el.ringFill.style.strokeDashoffset = C.toFixed(1);
  requestAnimationFrame(() => {
    el.ringFill.style.strokeDashoffset = (C * (1 - score / total)).toFixed(1);
  });
  el.ringFill.style.stroke =
    rate >= 80 ? '#18a058' : rate >= 60 ? '#5b5bd6' : '#d03050';

  el.resultScore.textContent = score;
  el.resultTotal.textContent = total;
  el.statRate.textContent = `${rate}%`;
  el.statStreak.textContent = state.maxStreak;
  el.statTime.textContent = `${seconds}s`;

  /* 评语 */
  let grade, desc;
  if (rate === 100) {
    grade = '满分！前端小达人 🏆';
    desc = '十道题全部答对，HTML / CSS / JS 的基础相当扎实。';
  } else if (rate >= 80) {
    grade = '表现优秀 🎉';
    desc = '基本概念掌握得很好，看看下面的复盘就能补上最后那点细节。';
  } else if (rate >= 60) {
    grade = '及格啦，还能更好 💪';
    desc = '大方向没问题，建议重点复习下面标记出来的题目。';
  } else {
    grade = '再练一局吧 📚';
    desc = '别灰心，先把下面每道题的解析读一遍，再来一局肯定进步。';
  }
  el.resultGrade.textContent = grade;
  el.resultDesc.textContent = `${desc}（用时 ${seconds} 秒）`;

  /* 最高分 */
  if (score > readBest()) writeBest(score);
  renderBest();

  renderReview();
}

/* ---------- 11. 复盘列表 ---------- */
function renderReview() {
  el.reviewList.innerHTML = state.records.map((r) => {
    const chosenText = r.chosen === -1
      ? '<span class="bad">未作答（超时）</span>'
      : `<span class="${r.correct ? 'ok' : 'bad'}">${'ABCD'[r.chosen]}. ${r.options[r.chosen]}</span>`;
    const answerText = `<span class="ok">${'ABCD'[r.answer]}. ${r.options[r.answer]}</span>`;

    return `
      <li class="review-item ${r.correct ? 'is-ok' : 'is-bad'}">
        <p class="review-q">${r.q}</p>
        <p class="review-line">你的答案：${chosenText}</p>
        ${r.correct ? '' : `<p class="review-line">正确答案：${answerText}</p>`}
      </li>`;
  }).join('');
}

/* ---------- 12. 开始 / 重开 ---------- */
function startGame() {
  state.round = buildRound();
  state.index = 0;
  state.score = 0;
  state.streak = 0;
  state.maxStreak = 0;
  state.records = [];
  state.locked = false;
  state.startedAt = Date.now();

  el.streakChip.hidden = true;
  el.streakNum.textContent = '0';
  el.review.hidden = true;
  el.reviewBtn.textContent = '查看错题复盘';
  el.ringFill.style.strokeDashoffset = (2 * Math.PI * 52).toFixed(1);

  showScreen('quiz');
  renderQuestion();
}

/* ---------- 13. 事件绑定 ---------- */

/* 开始 / 再来一局 */
el.startBtn.addEventListener('click', startGame);
el.againBtn.addEventListener('click', startGame);

/* 选择选项（事件委托） */
el.options.addEventListener('click', (e) => {
  const btn = e.target.closest('.option');
  if (!btn || state.locked) return;
  answer(Number(btn.dataset.i));
});

/* 下一题 */
el.nextBtn.addEventListener('click', next);

/* 展开 / 收起复盘 */
el.reviewBtn.addEventListener('click', () => {
  el.review.hidden = !el.review.hidden;
  el.reviewBtn.textContent = el.review.hidden ? '查看错题复盘' : '收起复盘';
});

/* 键盘操作：1-4 / A-D 选项，Enter / 空格 下一题 */
document.addEventListener('keydown', (e) => {
  if (el.screenQuiz.hidden) {
    /* 开始页与结算页：回车直接开始 / 再来一局 */
    if (e.key === 'Enter') {
      if (!el.screenStart.hidden || !el.screenResult.hidden) {
        e.preventDefault();
        startGame();
      }
    }
    return;
  }

  const key = e.key.toLowerCase();

  if (!state.locked) {
    const map = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
    if (key in map) {
      e.preventDefault();
      answer(map[key]);
    }
    return;
  }

  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    next();
  }
});

/* ---------- 14. 初始化 ---------- */
el.startTotal.textContent = QUESTIONS.length;
el.qTotal.textContent = QUESTIONS.length;
renderBest();
showScreen('start');
