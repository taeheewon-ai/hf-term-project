(() => {
  const params = new URLSearchParams(location.search);
  // 주소 끝을 지우고 들어와도 실험 시작 화면으로 가게 해요.
  if (!params.has('cond') && window.parent === window) { location.replace('study.html'); return; }
  const cond = params.get('cond') === 'B' ? 'B' : 'A';
  const review = params.get('review') === '1';
  const setKey = ['X', 'Y', 'Z'].includes(params.get('set')) ? params.get('set') : 'X';
  const paced = params.get('pace') !== '0';
  // 실험 화면 안에서 열렸을 때만 클릭·이동·대기 시간을 바깥 기록기로 보내요.
  const runId = params.get('run');
  const post = (m) => { if (runId && window.parent !== window) window.parent.postMessage({ src: 'etl', run: runId, ...m }, location.origin); };
  const SET = window.SETS[setKey];
  const I = window.ICONS;
  const W = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const UNUSED = '이 실험에서는 사용하지 않는 메뉴입니다.';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const toKey = (d) => d.toISOString().slice(0, 10);
  const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
  const md = (d) => `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}`;
  const mdFull = (s) => { const d = toDate(s); return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`; };
  const fmtMin = (m) => (m < 60 ? `${m}분` : `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ''}`);
  const taskOf = (id) => SET.tasks.find((t) => t.id === id);
  const tasksIn = (c) => SET.tasks.filter((t) => t.course === c);

  // 왼쪽 메뉴: 항목 높이와 아이콘·글자 위치는 실제 eTL 측정값
  const NAV = [
    ['계정', 72.6, 7, 46, 'avatar'], ['대시보드', 60.6, 11.1, 34, '대시보드'], ['과목', 60.7, 7, 34.1, '과목'],
    ['그룹', 56.6, 9, 30, '그룹'], ['캘린더', 63, 7.3, 36.3, '캘린더'], ['메시지함', 63, 7.4, 36.4, '메시지함'],
    ['마이페이지', 63, 7.3, 36.3, '마이페이지'], ['전체게시물', 63, 7.4, 36.4, '전체게시물'],
    ['SNUON', 68.6, 7, 42, 'play'], ['이용안내', 63.6, 7, 37, 'help']
  ];
  const EXTRA = {
    avatar: '<span class="nav__avatar"><svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5"/><path d="M2 24c1-7 5-9 10-9s9 2 10 9z"/></svg></span>',
    play: '<svg viewBox="0 0 32 32" style="width:32px"><circle cx="16" cy="16" r="16" fill="#fff"/><path d="M12 9.5v13L23 16z" fill="#0f0f70"/></svg>',
    help: '<svg viewBox="0 0 26 26"><circle cx="13" cy="13" r="11.6" fill="none" stroke="#fff" stroke-width="2"/><path d="M9.4 10.2c0-2 1.6-3.3 3.7-3.3s3.6 1.2 3.6 3c0 2.7-3.5 2.6-3.5 5.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="13.2" cy="18.9" r="1.4" fill="#fff"/></svg>'
  };
  const navHTML = (active) => NAV.map(([label, h, iconTop, textTop, key]) => {
    const attr = label === '대시보드' ? 'href="#/" data-top' : label === '과목' ? 'href="#" data-tray' : `href="#" data-toast="${UNUSED}"`;
    return `<li class="nav__item ${label === active ? 'is-active' : ''}" style="height:${h}px">
      <a ${attr}>
        <span class="nav__icon" style="top:${iconTop}px">${EXTRA[key] || I[key] || ''}</span>
        <span class="nav__text" style="top:${textTop}px">${esc(label)}</span>
      </a>
    </li>`;
  }).join('');

  // 코치 링크와 근거 링크가 가는 곳
  function relHref(t, r) {
    const base = `#/c/${t.course}`;
    if (r === '과제 설명') return `${base}/assignments/${t.id}`;
    if (r.startsWith('공지')) {
      const hits = SET.notices[t.course].map((n, i) => ({ n, i })).filter((x) => x.n.task === t.id);
      return hits.length === 1 ? `${base}/notices/${hits[0].i}` : `${base}/notices/for/${t.id}`;
    }
    if (r.startsWith('게시판')) {
      const i = SET.board[t.course].findIndex((p) => p.task === t.id);
      return `${base}/board/qna/${i}`;
    }
    const wk = r.match(/(\d+)주차/);
    return `${base}/weeks/${wk ? wk[1] : readingWeek(t)}`;
  }
  const readingWeek = (t) => ({ R1: 8, R2: 9, R3: 10 }[t.id] || 8);

  /* ---------- 대시보드 ---------- */
  function buildDays(tasks) {
    const byDay = {};
    tasks.forEach((t) => { (byDay[t.due] = byDay[t.due] || []).push(t); });
    const today = toDate(window.SCENARIO.today);
    const last = toDate(Object.keys(byDay).sort().pop());
    const out = [];
    let emptyRun = [];
    const flush = () => {
      if (emptyRun.length >= 3) out.push({ type: 'range', from: emptyRun[0], to: emptyRun[emptyRun.length - 1] });
      else emptyRun.forEach((d) => out.push({ type: 'empty', date: d }));
      emptyRun = [];
    };
    for (let d = today; d <= last; d = addDays(d, 1)) {
      const n = Math.round((d - today) / 86400000);
      const items = byDay[toKey(d)];
      if (items) { flush(); out.push({ type: 'filled', date: d, items, n }); }
      else if (n < 2) { flush(); out.push({ type: 'empty', date: d, n }); }
      else emptyRun.push(d);
    }
    flush();
    return out;
  }
  function dayHead(date, n, line) {
    const cls = `day__head ${n === 0 ? 'is-today' : ''} ${line ? 'has-line' : ''}`;
    if (n === 0) return `<div class="${cls}"><div class="day__big">오늘</div><div>${W[date.getUTCDay()]}, ${md(date)}</div></div>`;
    if (n === 1) return `<div class="${cls}"><div>내일</div><div>${W[date.getUTCDay()]}, ${md(date)}</div></div>`;
    return `<div class="${cls}"><div>${W[date.getUTCDay()]}</div><div>${md(date)}, ${date.getUTCFullYear()}</div></div>`;
  }
  function coachLines(t) {
    if (cond !== 'B') return '';
    const links = t.related.map((r, i) => `<a href="${relHref(t, r)}" class="${i < t.related.length - 1 ? 'coach__sep' : ''}">${esc(r)}</a>`).join('');
    return `<div class="coach">
      <div><span class="coach__label">관련 자료</span>${links}</div>
      <div>예상 소요 ${esc(t.hours)}, ${esc(t.start)}까지 시작 권장</div>
      <div>첫 단계: ${esc(t.first)}<a href="#/c/${t.course}/assignments/${t.id}/plan" class="coach__steps">단계 보기</a></div>
    </div>`;
  }
  function rowHTML(t) {
    const c = SET.courses[t.course];
    return `<li class="row">
      <span class="row__check" role="checkbox" aria-checked="false"></span>
      <span class="row__type">${I.item || ''}</span>
      <div class="row__course">${esc(c.name)} 과제</div>
      <a href="#/c/${t.course}/assignments/${t.id}" class="row__title">${esc(t.title)}</a>
      ${coachLines(t)}
      <div class="row__right">
        ${t.pts ? `<div class="row__pts"><b>${t.pts}</b> 점</div>` : ''}
        <div>Due: ${esc(t.dueText)}</div>
      </div>
    </li>`;
  }
  function groupsHTML(items) {
    const groups = [];
    items.forEach((t) => {
      const g = groups[groups.length - 1];
      if (g && g.course === t.course) g.items.push(t); else groups.push({ course: t.course, items: [t] });
    });
    return groups.map((g) => {
      const c = SET.courses[g.course];
      const tileTop = g.items.length === 1 ? 'calc(50% - 13.5px)' : '20.1px';
      return `<div class="group ${cond === 'B' ? 'has-coach' : ''}" style="--course:${c.color};--tile-top:${tileTop}">
        <a class="tile" href="#/c/${g.course}"><span>${esc(c.name)}</span></a>
        <ol class="rows">${g.items.map(rowHTML).join('')}</ol>
      </div>`;
    }).join('');
  }
  function dayHTML(day) {
    if (day.type === 'filled') return `<section class="day day--filled">${dayHead(day.date, day.n, false)}${groupsHTML(day.items)}</section>`;
    if (day.type === 'range') {
      return `<section class="day day--range"><div class="day__head has-line">${md(day.from)} to ${md(day.to)}</div>
        <div class="art"><img src="assets/empty_art.svg" alt=""><span>Nothing Planned Yet</span></div></section>`;
    }
    const n = Math.round((day.date - toDate(window.SCENARIO.today)) / 86400000);
    return `<section class="day">${dayHead(day.date, n, true)}<div class="day__empty">Nothing Planned Yet</div></section>`;
  }
  const dashboardHTML = () => `<main class="main">
      <header class="head">
        <h1>대시보드</h1>
        <div class="tools">
          <button class="tool-today" data-top-btn>오늘</button>
          <button class="tool-add" data-toast="${UNUSED}">${I.h_1 || ''}</button>
          <button class="tool-grades" data-toast="${UNUSED}">${I.h_2 || ''}</button>
          <button class="tool-bell" data-toast="${UNUSED}">${I.h_3 || ''}<span class="badge">7</span></button>
          <button class="tool-more" data-toast="${UNUSED}">${I.h_4 || ''}</button>
        </div>
      </header>
      <div class="activity-wrap"><button class="new-activity" data-toast="${UNUSED}">New Activity ${I.h_5 || ''}</button></div>
      ${cond === 'B' ? `<div class="coach-banner"><b>AI 과제 코치</b><span>${esc(SET.summary)}</span></div>` : ''}
      ${buildDays(SET.tasks).map(dayHTML).join('')}
    </main>`;

  /* ---------- 과목 화면 ---------- */
  const COURSE_MENU = ['홈', '공지', '강의계획서', '강의교재', '수강생', '모듈', '주차학습', '게시판', '과제', '성적', '파일', '강의/출결'];
  const MENU_PATH = { 홈: '', 공지: '/notices', 주차학습: '/weeks', 게시판: '/board', 과제: '/assignments' };
  const menuHTML = (c, active) => COURSE_MENU.map((m) => {
    const known = m in MENU_PATH;
    const href = known ? `#/c/${c}${MENU_PATH[m]}` : '#';
    return `<li><a href="${href}" class="${m === active ? 'on' : ''} ${['주차학습', '게시판', '강의/출결'].includes(m) ? 'dim' : ''}" ${known ? '' : `data-toast="${UNUSED}"`}>${m}</a></li>`;
  }).join('');
  const courseShell = (c, active, crumbs, body) => {
    const name = SET.courses[c].name;
    const trail = crumbs.map((x, i) => `<i>›</i>${x.href && i < crumbs.length - 1 ? `<a href="${x.href}">${esc(x.text)}</a>` : `<span>${esc(x.text)}</span>`}`).join('');
    return `<main class="cmain">
      <div class="crumbs">
        <button class="crumbs__toggle" data-menu-toggle aria-label="과목 메뉴"><b></b><b></b><b></b></button>
        <a href="#/c/${c}">${esc(name)}</a>${trail}
      </div>
      <div class="cbody">
        <nav class="cmenu"><div class="cmenu__term">2026년 2학기</div><ul>${menuHTML(c, active)}</ul></nav>
        <section class="ccontent">${body}</section>
      </div>
    </main>`;
  };
  const avatar = '<span class="face"><svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5"/><path d="M2 24c1-7 5-9 10-9s9 2 10 9z"/></svg></span>';
  const docIcon = '<svg class="doc" viewBox="0 0 20 20"><path d="M4 1.5h8l4 4v13H4z" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M12 1.5v4h4M7 10h6M7 13.5h6" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';

  const paras = (lines) => lines.map((l) => `<p>${esc(l)}</p>`).join('');
  const noticeRow = (c, n, i) => `<a class="nrow" href="#/c/${c}/notices/${i}" data-filter-row="${esc(n.title)} ${esc(n.body.join(' '))}">
      ${avatar}
      <span class="nrow__main"><b>${esc(n.title)}</b><span>${esc(n.body.join(' '))}</span></span>
      <span class="nrow__date"><b>게시일시:</b><br>2026년 ${esc(n.date)}</span>
    </a>`;
  function homeBody(c) {
    const notices = SET.notices[c];
    const todo = tasksIn(c).map((t) => `<li>${I.item || ''}<span><a href="#/c/${c}/assignments/${t.id}">${esc(t.title)}</a><small>${mdFull(t.due)} ${esc(t.dueText)}</small></span></li>`).join('');
    return `<div class="home">
      <div class="home__main">
        <h2>최근 공지사항</h2>
        ${notices.length ? notices.map((n, i) => noticeRow(c, n, i)).join('') : '<p class="none">최근 공지사항이 없습니다.</p>'}
        ${weeksHTML(c)}
      </div>
      <aside class="home__side">
        <button class="btn-gray" data-toast="${UNUSED}">과목 스트림 보기</button>
        <button class="btn-gray" data-toast="${UNUSED}">과목 캘린더 보기</button>
        <button class="btn-gray" data-toast="${UNUSED}">과목 알림보기</button>
        <h3>할 일</h3><ul class="todo">${todo}</ul>
        <h3>최근 피드백</h3><p class="none small">현재 없음</p>
      </aside>
    </div>`;
  }
  function weeksHTML(c) {
    const reads = {};
    tasksIn(c).filter((t) => t.course === 'R').forEach((t) => {
      const m = t.title.match(/\((.+)\)/);
      reads[readingWeek(t)] = `${m ? m[1] : ''} 읽기 자료.pdf`;
    });
    let html = '';
    for (let w = 1; w <= 10; w += 1) {
      html += `<div class="ig ig--week" id="week-${w}"><div class="ig-head">▾ ${w}주차</div>
        <div class="ig-row ig-row--file">${docIcon}<b>${esc(reads[w] || `${w}주차 강의자료.pdf`)}</b></div></div>`;
    }
    return html;
  }
  function assignListBody(c) {
    const rows = tasksIn(c).map((t) => `<a class="ig-row" href="#/c/${c}/assignments/${t.id}" data-filter-row="${esc(t.title)}">
        <span class="ig-icon">${I.item || ''}</span>
        <span><b>${esc(t.title)}</b><small>마감 ${mdFull(t.due)} ${esc(t.dueText)} &nbsp;|&nbsp; ${t.pts}점</small></span>
      </a>`).join('');
    return `<div class="tools-line"><input class="search" placeholder="과제 검색" data-filter><span class="tools-line__r">마감순으로 보기 <button class="btn-dark" data-toast="${UNUSED}">유형별로 보기</button></span></div>
      <div class="ig ig--list"><div class="ig-head">▾ 과제<span class="ig-pill">전체 성적의 100%</span></div>${rows}</div>`;
  }
  function planHTML(t) {
    if (cond !== 'B') return '';
    const steps = t.plan.map((p, i) => `<li><span class="plan__n">${i + 1}</span><span class="plan__t">${esc(p.text)}</span>
      <span class="plan__m">${fmtMin(p.min)}</span><a href="${relHref(t, p.src)}">근거: ${esc(p.src)}</a></li>`).join('');
    return `<section class="plan" id="plan">
      <h2>AI 과제 코치 · 단계별 계획</h2>
      <p>예상 소요 ${esc(t.hours)}, ${esc(t.start)}까지 시작 권장</p>
      <ol>${steps}</ol>
    </section>`;
  }
  function assignBody(t) {
    return `<div class="a-wrap">
      <div class="a-head"><h1>${esc(t.title)}</h1><button class="btn-navy" data-toast="이 실험에서는 과제를 제출하지 않습니다.">과제 제출 시작</button></div>
      <ul class="a-over">
        <li><b>마감</b>${mdFull(t.due)} 기준 ${esc(t.dueText)}</li><li><b>점수</b>${t.pts}</li><li><b>제출물 유형</b>파일 업로드</li>
      </ul>
      <div class="a-desc">${t.desc}</div>
      ${planHTML(t)}
      <div class="a-foot"><button class="btn-gray" data-back>◂ 이전</button><button class="btn-gray" data-toast="${UNUSED}">학습 종료</button></div>
    </div>`;
  }
  const noticeListBody = (c, onlyTask) => {
    const rows = SET.notices[c].map((n, i) => ((!onlyTask || n.task === onlyTask) ? noticeRow(c, n, i) : '')).join('');
    return `<div class="tools-line tools-line--end"><input class="search search--wide" placeholder="검색..." data-filter></div>
      ${rows || '<p class="none">공지가 없습니다.</p>'}`;
  };
  const noticeBody = (n) => `<article class="post">
      <div class="post__head">${avatar}<div><h1>${esc(n.title)}</h1><small>${esc(n.by)} · 2026년 ${esc(n.date)}</small></div></div>
      <div class="post__msg">${paras(n.body)}</div>
    </article>`;
  const postIc = '<svg viewBox="0 0 14 14"><path d="M2 1h10v12H2z"/></svg>';
  const cmtIc = '<svg viewBox="0 0 14 14"><path d="M1 2h12v8H6l-3 3v-3H1z"/></svg>';
  const counts = (n) => `<span class="bcnt bcnt--first">${postIc}${n}</span><span class="bcnt">${cmtIc}${n}</span>`;
  const boardsBody = (c) => `<h2 class="page-h">전체 게시판</h2>
    <div class="bbox bbox--boards">
      <a class="brow" href="#/c/${c}/board/qna">${docIcon}<b>Q&amp;A 게시판</b><em>비밀글 허용</em>${counts(SET.board[c].length)}</a>
      <div class="brow brow--off" data-toast="${UNUSED}">${docIcon}<b>학습 피드백</b><em>비밀글 허용</em>${counts(0)}</div>
    </div>`;
  const qnaBody = (c) => {
    const rows = SET.board[c].map((p, i) => `<a class="brow" href="#/c/${c}/board/qna/${i}" data-filter-row="${esc(p.title)}">${docIcon}<b>${esc(p.title)}</b><span class="brow__date">${esc(p.date)}</span></a>`).join('');
    return `<h2 class="page-h">Q&amp;A 게시판</h2><div class="tools-line"><input class="search" placeholder="게시글 검색" data-filter></div>${rows ? `<div class="bbox">${rows}</div>` : '<p class="none">게시글이 없습니다.</p>'}`;
  };
  const postBody = (p) => `<article class="post">
      <div class="post__head">${avatar}<div><h1>${esc(p.title)}</h1><small>수강생 · 2026년 ${esc(p.date)}</small></div></div>
      <div class="post__msg">${paras(p.q)}</div>
      <div class="post__reply">${avatar}<div><b>담당 조교</b>${paras(p.a)}</div></div>
    </article>`;

  function courseHTML(c, rest) {
    const [page, a, b] = rest;
    if (page === 'assignments') {
      const t = a && taskOf(a);
      if (t && t.course === c) return courseShell(c, '과제', [{ text: '과제', href: `#/c/${c}/assignments` }, { text: t.title }], assignBody(t));
      return courseShell(c, '과제', [{ text: '과제' }], assignListBody(c));
    }
    if (page === 'notices') {
      if (a === 'for') return courseShell(c, '공지', [{ text: '공지' }], noticeListBody(c, b));
      if (a !== undefined && SET.notices[c][+a]) return courseShell(c, '공지', [{ text: '공지', href: `#/c/${c}/notices` }, { text: SET.notices[c][+a].title }], noticeBody(SET.notices[c][+a]));
      return courseShell(c, '공지', [{ text: '공지' }], noticeListBody(c));
    }
    if (page === 'board') {
      if (a === 'qna' && b !== undefined && SET.board[c][+b]) {
        return courseShell(c, '게시판', [{ text: '게시판', href: `#/c/${c}/board` }, { text: 'Q&A 게시판', href: `#/c/${c}/board/qna` }, { text: SET.board[c][+b].title }], postBody(SET.board[c][+b]));
      }
      if (a === 'qna') return courseShell(c, '게시판', [{ text: '게시판', href: `#/c/${c}/board` }, { text: 'Q&A 게시판' }], qnaBody(c));
      return courseShell(c, '게시판', [{ text: '게시판' }], boardsBody(c));
    }
    if (page === 'weeks') return courseShell(c, '주차학습', [{ text: '주차학습' }], `<h2 class="page-h">주차학습</h2>${weeksHTML(c)}`);
    return courseShell(c, '홈', [], homeBody(c));
  }

  /* ---------- 화면 전환 ---------- */
  const root = document.getElementById('root');
  const trayHTML = () => `<div class="tray" id="tray"><h2>과목</h2>${Object.keys(SET.courses).map((c) => `<a href="#/c/${c}">${esc(SET.courses[c].name)}</a>`).join('')}</div>`;
  const reviewBar = () => {
    if (!review) return '';
    const h = location.hash;
    const p = paced ? '' : '&pace=0';
    return `<div class="review">
      <a href="?cond=A&set=${setKey}&review=1${p}${h}" class="${cond === 'A' ? 'on' : ''}">A 현재 eTL</a>
      <a href="?cond=B&set=${setKey}&review=1${p}${h}" class="${cond === 'B' ? 'on' : ''}">B AI 과제 코치</a>
      <a href="?cond=${cond}&set=X&review=1${p}${h}" class="${setKey === 'X' ? 'on' : ''}">세트 X</a>
      <a href="?cond=${cond}&set=Y&review=1${p}${h}" class="${setKey === 'Y' ? 'on' : ''}">세트 Y</a>
      <a href="?cond=${cond}&set=${setKey}&review=1${h}" class="${paced ? 'on' : ''}">실제 속도</a>
      <a href="?cond=${cond}&set=${setKey}&review=1&pace=0${h}" class="${paced ? '' : 'on'}">바로 전환</a>
    </div>`;
  };
  // 실제 eTL에서 잰 시간(밀리초): [이전 화면이 사라지고 틀이 뜨는 때, 본문이 채워지는 때]. A·B 똑같이 적용해요.
  const PACE = { dash: [700, 1100], home: [590, 780], list: [530, 810], detail: [630, 720], notices: [430, 1240], weeks: [615, 665] };
  const paceOf = (isCourse, sub) => {
    if (!isCourse) return PACE.dash;
    const [page, a, b] = sub;
    if (page === 'assignments') return a ? PACE.detail : PACE.list;
    if (page === 'notices') return a && a !== 'for' ? PACE.detail : PACE.notices;
    if (page === 'board') return a === 'qna' && b !== undefined ? PACE.detail : PACE.notices;
    if (page === 'weeks') return PACE.weeks;
    return page ? PACE.list : PACE.home;
  };
  // 같은 페이지 안에서 위치만 옮기는 링크(계획 보기, 주차 이동)는 새로 불러오지 않아요.
  const pageKey = (parts) => {
    const k = parts.slice();
    if (k[2] === 'assignments' && k[4] === 'plan') k.length = 4;
    if (k[2] === 'weeks') k.length = 3;
    return k.join('/');
  };
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  let wasDash = false;
  let dashY = 0;
  let navToken = 0;
  let shownKey = null;
  let waitFrom = null;
  const endWait = () => { if (waitFrom !== null) { post({ type: 'wait', ms: performance.now() - waitFrom }); waitFrom = null; } };
  function render() {
    endWait();
    const token = ++navToken;
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    const isCourse = !!(parts[0] === 'c' && SET.courses[parts[1]]);
    const key = pageKey(parts);
    const changed = key !== shownKey;
    const instant = !paced || shownKey === null || key === shownKey;
    shownKey = key;
    if (changed) post({ type: 'nav', key: key || 'dashboard' });
    const page = document.documentElement;
    if (instant) { page.classList.remove('is-nav'); root.classList.remove('is-loading'); paint(parts, isCourse); return; }
    waitFrom = performance.now();
    // 전환 시간은 그대로 두고, 누르자마자 '불러오는 중'이 보이게 해요. A·B 똑같아요.
    page.classList.remove('is-nav');
    void page.offsetWidth;
    page.classList.add('is-nav');
    const [frameAt, contentAt] = paceOf(isCourse, parts.slice(2));
    setTimeout(() => {
      if (token !== navToken) return;
      root.classList.add('is-loading');
      paint(parts, isCourse);
      setTimeout(() => { if (token === navToken) { page.classList.remove('is-nav'); root.classList.remove('is-loading'); endWait(); } }, contentAt - frameAt);
    }, frameAt);
  }
  function paint(parts, isCourse) {
    if (wasDash) dashY = window.scrollY;
    const html = isCourse ? courseHTML(parts[1], parts.slice(2)) : dashboardHTML();
    root.innerHTML = `
      <aside class="nav">
        <div class="nav__mark"><div class="nav__seal">연구용<br>시제품</div></div>
        <ul class="nav__list">${navHTML(isCourse ? '과목' : '대시보드')}</ul>
        <button class="nav__collapse" data-toast="${UNUSED}">${I.collapse || ''}</button>
      </aside>
      ${html}
      <div class="help" data-toast="${UNUSED}">도<br>움<br>말</div>
      <div class="help-more" data-toast="${UNUSED}"><i></i><i></i><i></i></div>
      ${reviewBar()}`;
    wasDash = !isCourse;
    if (!isCourse) { window.scrollTo(0, dashY); return; }
    window.scrollTo(0, 0);
    const last = parts[parts.length - 1];
    const target = parts[2] === 'weeks' && last !== 'weeks' ? document.getElementById(`week-${last}`) : (last === 'plan' ? document.getElementById('plan') : null);
    if (target) window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY - 16);
  }
  let toastTimer;
  function toast(msg) {
    let el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }
  // 클릭 수: 링크·버튼·메뉴처럼 누를 수 있는 것을 누른 횟수
  document.addEventListener('click', (e) => {
    const hit = e.target.closest('a, button, input, [data-toast], [data-tray], [data-menu-toggle]');
    if (!hit) return;
    // 화면이 뜨기를 기다리며 같은 링크를 또 누른 것은 클릭 수에 넣지 않아요.
    if (waitFrom !== null && hit.hash && hit.hash === location.hash) return;
    if (hit.matches('a[href^="#/"]') && hit.hash !== location.hash) hit.classList.add('is-pressed');
    post({ type: 'click', coach: !!hit.closest('.coach, .coach-banner') });
  }, true);
  document.addEventListener('click', (e) => {
    const tr = document.getElementById('tray');
    const trayBtn = e.target.closest('[data-tray]');
    if (trayBtn) {
      e.preventDefault();
      if (tr) tr.remove(); else root.insertAdjacentHTML('beforeend', trayHTML());
      return;
    }
    if (tr && !e.target.closest('#tray')) tr.remove();
    const t = e.target.closest('[data-toast]');
    if (t) { e.preventDefault(); toast(t.dataset.toast); return; }
    if (e.target.closest('[data-top]')) dashY = 0;
    if (e.target.closest('[data-top-btn]')) { window.scrollTo(0, 0); return; }
    if (e.target.closest('[data-back]')) { history.back(); return; }
    if (e.target.closest('[data-menu-toggle]')) document.querySelector('.cmenu').classList.toggle('is-hidden');
  });
  document.addEventListener('input', (e) => {
    if (!e.target.matches('[data-filter]')) return;
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('[data-filter-row]').forEach((r) => { r.style.display = r.dataset.filterRow.toLowerCase().includes(q) ? '' : 'none'; });
  });
  window.addEventListener('hashchange', () => render());
  window.addEventListener('load', () => post({ type: 'ready' }));
  render();
})();
