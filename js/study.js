// 실험 전체 흐름: 안내 → 동의 → 기본 정보 → 연습 → 첫 화면(과업·설문) → 두 번째 화면(과업·설문) → 선호·불편 → 끝
(() => {
  const params = new URLSearchParams(location.search);
  const review = params.get('review') === '1';
  // 조원 예비 실험용 링크(?pilot=1). 저장은 되지만 파일 이름이 PILOT로 시작하고, 참가자 배정 순서를 쓰지 않아요.
  const pilot = params.get('pilot') === '1';
  // 네 조합. 4명마다 네 조합이 한 번씩 나오게 섞은 24칸이라, 모집을 어디서 멈춰도 인원이 거의 같아요.
  const COMBOS = [['A', 'X', 'B', 'Y'], ['A', 'Y', 'B', 'X'], ['B', 'X', 'A', 'Y'], ['B', 'Y', 'A', 'X']];
  const SLOTS = [0, 3, 1, 2, 0, 2, 3, 1, 1, 3, 0, 2, 2, 0, 1, 3, 2, 1, 0, 3, 0, 1, 3, 2];
  const CFG = window.STUDY_CONFIG || {};
  const comboParam = params.get('combo');
  const makeCode = () => {
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return `${pilot ? 'PILOT' : 'R'}${[...crypto.getRandomValues(new Uint8Array(8))].map((x) => A[x % A.length]).join('')}`;
  };
  const DATA = { pid: makeCode(), combo: '', comboIndex: null, slot: null, assignedBy: '', basic: null, blocks: [], final: null };
  let BLOCKS = [];
  const setCombo = (i) => {
    const c = COMBOS[i];
    DATA.comboIndex = i;
    DATA.combo = `${c[0]}-${c[1]}→${c[2]}-${c[3]}`;
    BLOCKS = [{ cond: c[0], set: c[1] }, { cond: c[2], set: c[3] }];
  };
  window.__studyData = DATA;

  const frame = document.getElementById('etl');
  const dock = document.getElementById('dock');
  const cover = document.getElementById('cover');
  const pageEl = document.getElementById('page');

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shortName = (S, c) => S.courses[c].name.replace(/^2026-2 | \(\d+\)$/g, '');
  const DAY = ['일', '월', '화', '수', '목', '금', '토'];
  const DAY_MS = 86400000;
  const toUTC = (k) => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  const dateText = (ms) => { const d = new Date(ms); return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${DAY[d.getUTCDay()]})`; };
  const dateKey = (ms) => new Date(ms).toISOString().slice(0, 10);

  /* ---------- 과업 ---------- */
  const NOT_FOUND = '찾지 못했어요';
  const VOLUMES = ['A4 3쪽 이내', 'A4 5쪽 이내', 'A4 7쪽 이내', 'A4 10쪽 이내', NOT_FOUND];
  const SUBMITS = ['PDF 파일로 eTL 과제 메뉴에 제출', 'Word 파일로 eTL 과제 메뉴에 제출', '한글 파일로 eTL 과제 메뉴에 제출', '이메일로 조교에게 제출', NOT_FOUND];
  const T3_IDS = ['P2', 'Q2', 'R3'];
  // 과제를 못 하는 날. Q2의 코치 권장일과 일부러 겹쳐서, 권장일을 그대로 따르는지 볼 수 있어요.
  const BLOCKED_DAY = '2026-11-21';

  const radio = (name, value, label) => `<label class="pick"><input type="radio" name="${name}" value="${esc(value)}"><span>${esc(label)}</span></label>`;
  const checked = (root, name) => { const c = root.querySelector(`input[name="${name}"]:checked`); return c ? c.value : null; };

  const mainTasks = (setKey) => {
    const S = window.SETS[setKey];
    const taskOf = (id) => S.tasks.find((t) => t.id === id);
    const t2 = taskOf(S.t2.taskId);
    return [
      {
        key: 'T1',
        ask: '오늘은 11월 9일 월요일 아침이에요. 이번 주에 가장 먼저 시작할 과제를 하나 골라 주세요.',
        form: () => `<div class="t1">${Object.keys(S.courses).map((c) => `<div class="t1__col"><h3>${esc(shortName(S, c))}</h3>${S.tasks.filter((t) => t.course === c).map((t) => radio('t1', t.id, t.title)).join('')}</div>`).join('')}</div>`,
        read: (r) => { const v = checked(r, 't1'); return v ? { taskId: v } : null; }
      },
      {
        key: 'T2',
        ask: `${shortName(S, t2.course)} 수업의 '${t2.title}' 분량과 제출 방법을 찾아 주세요.`,
        form: () => `<div class="t2">
          <div class="t2__row"><b>분량</b>${VOLUMES.map((v) => radio('volume', v, v)).join('')}</div>
          <div class="t2__row"><b>제출 방법</b>${SUBMITS.map((v) => radio('submit', v, v)).join('')}</div>
        </div>`,
        read: (r) => {
          const volume = checked(r, 'volume');
          const submit = checked(r, 'submit');
          if (!volume || !submit) return null;
          const volumeOk = volume === S.t2.volume;
          const submitOk = submit === S.t2.submit;
          return { volume, submit, volumeOk, submitOk, correct: volumeOk && submitOk };
        }
      },
      {
        key: 'T3',
        ask: '아래 과제 3개를 각각 언제 시작할지 정해 주세요. 과제에 쓸 수 있는 시간은 하루 2시간이라고 생각해 주세요. 단, 11월 21일(토)은 가족 행사가 있어서 과제를 할 수 없어요.',
        form: () => `<div class="t3">${T3_IDS.map((id) => {
          const t = taskOf(id);
          const first = toUTC(window.SCENARIO.today);
          const last = toUTC(t.due);
          const opts = [];
          for (let d = first; d <= last; d += DAY_MS) opts.push(`<option value="${dateKey(d)}">${dateText(d)}</option>`);
          return `<label><b>${esc(t.title)}</b><small>${esc(shortName(S, t.course))} · 마감 ${dateText(last)}</small><select name="${id}"><option value="">시작할 날짜 고르기</option>${opts.join('')}</select></label>`;
        }).join('')}</div>`,
        read: (r) => {
          const rows = T3_IDS.map((id) => {
            const start = r.querySelector(`select[name="${id}"]`).value;
            if (!start) return null;
            const t = taskOf(id);
            return { taskId: id, start, daysBefore: Math.round((toUTC(t.due) - toUTC(start)) / DAY_MS), recommended: t.startKey, sameAsRec: start === t.startKey, onBlockedDay: start === BLOCKED_DAY };
          });
          return rows.every(Boolean) ? { rows } : null;
        }
      }
    ];
  };

  const practiceTasks = () => {
    const S = window.SETS.Z;
    const course = shortName(S, 'P');
    const make = (key, ask, options, answer) => ({
      key, ask, answer,
      form: () => `<div class="t2"><div class="t2__row">${options.map((v) => radio('choice', v, v)).join('')}</div></div>`,
      read: (r) => { const v = checked(r, 'choice'); return v ? { choice: v, correct: v === answer } : null; }
    });
    return [make('연습', `${course}에 들어가 공지 메뉴에서 강의실이 어디로 바뀌었는지 찾아 주세요.`, ['101호', '205호', '302호', '415호'], '101호')];
  };

  const showPage = () => { pageEl.hidden = false; pageEl.className = 'page'; pageEl.onclick = null; cover.className = 'cover'; cover.innerHTML = ''; dock.innerHTML = ''; };

  /* ---------- eTL 과목 화면과 같은 틀 (안내 화면용) ---------- */
  const OFF_MENU = '이 실험에서는 사용하지 않는 메뉴입니다.';
  const STEPS = ['실험 안내', '참여 동의', '연습', '첫 번째 화면', '두 번째 화면', '마무리'];
  const SHELL_NAV = [
    ['계정', 72.6, 7, 46, 'avatar'], ['대시보드', 60.6, 11.1, 34, '대시보드'], ['과목', 60.7, 7, 34.1, '과목'],
    ['그룹', 56.6, 9, 30, '그룹'], ['캘린더', 63, 7.3, 36.3, '캘린더'], ['메시지함', 63, 7.4, 36.4, '메시지함'],
    ['마이페이지', 63, 7.3, 36.3, '마이페이지'], ['전체게시물', 63, 7.4, 36.4, '전체게시물'],
    ['SNUON', 68.6, 7, 42, 'play'], ['이용안내', 63.6, 7, 37, 'help']
  ];
  const SHELL_ICON = {
    avatar: '<span class="xp-nav__avatar"><svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5"/><path d="M2 24c1-7 5-9 10-9s9 2 10 9z"/></svg></span>',
    play: '<svg viewBox="0 0 32 32" style="width:32px"><circle cx="16" cy="16" r="16" fill="#fff"/><path d="M12 9.5v13L23 16z" fill="#0f0f70"/></svg>',
    help: '<svg viewBox="0 0 26 26"><circle cx="13" cy="13" r="11.6" fill="none" stroke="#fff" stroke-width="2"/><path d="M9.4 10.2c0-2 1.6-3.3 3.7-3.3s3.6 1.2 3.6 3c0 2.7-3.5 2.6-3.5 5.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="13.2" cy="18.9" r="1.4" fill="#fff"/></svg>'
  };
  const shellHTML = ({ step, title, over = [], body, head = '', foot = '' }) => {
    const icons = window.ICONS || {};
    const nav = SHELL_NAV.map(([label, h, iconTop, textTop, key]) => `<li class="${label === '과목' ? 'on' : ''}" style="height:${h}px"><a href="#" data-off>
      <span class="xp-nav__icon" style="top:${iconTop}px">${SHELL_ICON[key] || icons[key] || ''}</span>
      <span class="xp-nav__text" style="top:${textTop}px">${esc(label)}</span></a></li>`).join('');
    const menu = STEPS.map((s, i) => `<li class="${i === step ? 'on' : ''} ${i > step ? 'later' : ''}">${esc(s)}</li>`).join('');
    return `<div class="xp">
      <aside class="xp-nav"><div class="xp-nav__mark"><div class="xp-nav__seal">연구용<br>시제품</div></div><ul>${nav}</ul><a href="#" class="xp-nav__collapse" data-off aria-label="메뉴 접기">${icons.collapse || ''}</a></aside>
      <main class="xp-main">
        <div class="xp-crumbs"><span class="xp-crumbs__bars"><b></b><b></b><b></b></span><a href="#" data-off>2026-2 과제 관리 화면 실험</a><i>›</i><span>${esc(STEPS[step])}</span></div>
        <div class="xp-body">
          <nav class="xp-menu"><div class="xp-menu__term">2026년 2학기</div><ul>${menu}</ul></nav>
          <section class="xp-content"><div class="xp-cols"><div class="xp-wrap">
            <div class="xp-head"><h1>${esc(title)}</h1>${head}</div>
            ${over.length ? `<ul class="xp-over">${over.map(([k, v]) => `<li><b>${esc(k)}</b>${esc(v)}</li>`).join('')}</ul>` : '<div class="xp-rule"></div>'}
            <div class="xp-desc">${body}</div>
            ${foot ? `<div class="xp-foot">${foot}</div>` : ''}
          </div></div></section>
        </div>
      </main>
      <div class="xp-help" data-off>도<br>움<br>말</div>
      <div class="xp-help-more" data-off><i></i><i></i><i></i></div>
      <div class="xp-toast" role="status"></div>
    </div>`;
  };
  const mountShell = (opts, onClick) => {
    showPage();
    pageEl.className = 'page page--etl';
    pageEl.innerHTML = shellHTML(opts);
    pageEl.scrollTop = 0;
    let timer;
    pageEl.onclick = (e) => {
      if (onClick && onClick(e)) return;
      if (!e.target.closest('[data-off]')) return;
      e.preventDefault();
      const t = pageEl.querySelector('.xp-toast');
      t.textContent = OFF_MENU;
      t.classList.add('show');
      clearTimeout(timer);
      timer = setTimeout(() => t.classList.remove('show'), 1800);
    };
  };
  const etlPage = ({ go, ...opts }) => new Promise((resolve) => {
    mountShell({
      ...opts,
      head: `<button class="xp-btn" data-go>${esc(go)}</button>`,
      foot: '<button class="xp-btn xp-btn--gray" data-go>다음 ▸</button>'
    }, (e) => {
      if (!e.target.closest('[data-go]')) return false;
      pageEl.onclick = null;
      resolve();
      return true;
    });
  });
  const etlEnd = (opts) => { frame.src = 'about:blank'; mountShell(opts); };
  // eTL 퀴즈 화면 모양의 설문. 오른쪽 '문제' 목록에서 답한 문항과 안 한 문항을 바로 볼 수 있어요.
  const etlForm = ({ intro = '', questions, go = '다음', side = true, onChange, ...opts }) => new Promise((resolve) => {
    mountShell({
      ...opts,
      body: `<form class="xf" id="xf" novalidate>${intro}${questions}<p class="err" hidden>아직 답하지 않은 문항이 있어요. 빨간 칸을 확인해 주세요.</p></form>`,
      foot: `<button class="xp-btn" type="submit" form="xf">${esc(go)}</button>`
    }, (e) => {
      const jump = e.target.closest('[data-jump]');
      if (!jump) return false;
      document.getElementById(jump.dataset.jump).scrollIntoView({ block: 'center' });
      return true;
    });
    const form = pageEl.querySelector('form');
    const err = form.querySelector('.err');
    const items = [...form.querySelectorAll('.xq')];
    const answered = (x) => { const el = form.elements[x.dataset.name]; return !!(el && String(el.value || '').trim()); };
    if (side) {
      const el = document.createElement('aside');
      el.className = 'xp-side';
      el.innerHTML = `<h3>문제</h3><ol>${items.map((x, n) => `<li data-for="${x.id}"><button type="button" data-jump="${x.id}">문제 ${n + 1}</button></li>`).join('')}</ol>`;
      pageEl.querySelector('.xp-cols').appendChild(el);
    }
    const refresh = () => {
      items.forEach((x) => {
        const li = pageEl.querySelector(`.xp-side [data-for="${x.id}"]`);
        if (li) li.classList.toggle('done', answered(x));
        if (answered(x)) x.classList.remove('is-missing');
      });
      if (onChange) onChange(form);
    };
    form.addEventListener('change', refresh);
    form.addEventListener('input', refresh);
    form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('input[type=text]')) e.preventDefault(); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const reqs = items.filter((x) => x.dataset.req && !x.closest('[hidden]'));
      const missing = reqs.filter((x) => !answered(x));
      reqs.forEach((x) => x.classList.toggle('is-missing', missing.includes(x)));
      err.hidden = !missing.length;
      if (missing.length) { missing[0].scrollIntoView({ block: 'center' }); return; }
      pageEl.onclick = null;
      resolve(Object.fromEntries(new FormData(form)));
    });
    refresh();
  });
  const showTaskArea = () => { pageEl.hidden = true; pageEl.innerHTML = ''; };

  /* ---------- 과업 기록: 시간·클릭·복귀·대기 ---------- */
  let runSeq = 0;
  let currentRun = null;
  let frameReady = false;
  let startWanted = false;
  let active = null;
  const beginMetrics = () => {
    if (active) return;
    active = { t0: performance.now(), clicks: 0, coachClicks: 0, returns: 0, waitMs: 0, tabAway: 0, visited: new Set(['dashboard']), path: ['dashboard'] };
  };
  const finishMetrics = () => {
    beginMetrics();
    const a = active;
    active = null;
    startWanted = false;
    const ms = performance.now() - a.t0;
    return { timeSec: +(ms / 1000).toFixed(1), waitSec: +(a.waitMs / 1000).toFixed(1), activeSec: +(Math.max(0, ms - a.waitMs) / 1000).toFixed(1), clicks: a.clicks, coachClicks: a.coachClicks, returns: a.returns, tabAway: a.tabAway, path: a.path };
  };
  window.addEventListener('message', (e) => {
    const m = e.data;
    if (e.origin !== location.origin || e.source !== frame.contentWindow || !m || m.src !== 'etl' || m.run !== currentRun) return;
    if (m.type === 'ready') { frameReady = true; if (startWanted) beginMetrics(); return; }
    if (!active) return;
    if (m.type === 'click') { active.clicks += 1; if (m.coach) active.coachClicks += 1; }
    if (m.type === 'wait') active.waitMs += m.ms;
    if (m.type === 'nav') {
      if (active.visited.has(m.key)) active.returns += 1;
      active.visited.add(m.key);
      active.path.push(m.key);
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && active) active.tabAway += 1; });

  const runTask = (def, i, total, url, label) => new Promise((resolve) => {
    showTaskArea();
    dock.className = 'dock';
    dock.innerHTML = '';
    runSeq += 1;
    currentRun = `${DATA.pid}-${runSeq}`;
    frameReady = false;
    startWanted = false;
    active = null;
    const taskUrl = `${url}&run=${encodeURIComponent(currentRun)}#/`;
    // 브라우저 뒤로 가기로 이전 과업이 열려도 eTL 화면이 지금 과업으로 돌아오게, 지금 주소를 알려 둬요.
    window.__etlCurrent = { run: currentRun, url: taskUrl };
    frame.src = taskUrl;
    cover.className = 'cover is-on';
    cover.innerHTML = `<div class="card">
      <div class="card__bar">${esc(label)} ${i + 1} / ${total}</div>
      <div class="card__in"><h2>${esc(def.ask)}</h2>
      <p class="note">시작을 누르면 화면을 자유롭게 둘러볼 수 있어요. 답은 화면 아래 칸에서 고른 뒤 제출해 주세요.</p></div>
      <div class="card__foot"><button class="card__go" data-start>시작하기</button></div>
    </div>`;
    cover.onclick = (e) => {
      if (!e.target.closest('[data-start]')) return;
      startWanted = true;
      if (frameReady) beginMetrics();
      cover.onclick = null;
      cover.className = 'cover';
      cover.innerHTML = '';
      dock.innerHTML = `<div class="dock__head">
          <span class="dock__step">${esc(label)} ${i + 1} / ${total}</span>
          <div class="dock__ask">${esc(def.ask)}</div>
          <button class="dock__fold" data-fold>접기</button>
          <button class="dock__submit" data-submit disabled>제출</button>
        </div>
        <div class="dock__body">${def.form()}</div>`;
      const btn = dock.querySelector('[data-submit]');
      dock.onchange = () => { btn.disabled = !def.read(dock); };
      dock.onclick = (ev) => {
        const fold = ev.target.closest('[data-fold]');
        if (fold) { fold.textContent = dock.classList.toggle('is-folded') ? '펼치기' : '접기'; return; }
        if (!ev.target.closest('[data-submit]')) return;
        const answer = def.read(dock);
        if (!answer) return;
        const metrics = finishMetrics();
        dock.onchange = null;
        dock.onclick = null;
        dock.className = 'dock';
        dock.innerHTML = '';
        resolve({ answer, metrics });
      };
    };
  });

  const practiceFeedback = (ok, answer) => new Promise((resolve) => {
    cover.className = 'cover is-on';
    cover.innerHTML = `<div class="card">
      <div class="card__bar">연습 결과</div>
      <div class="card__in"><h2>${ok ? '맞았어요!' : `정답은 ${esc(answer)}이에요.`}</h2>
      <p class="note">본 실험에서는 정답을 알려 드리지 않아요.</p></div>
      <div class="card__foot"><button class="card__go" data-next>다음</button></div>
    </div>`;
    cover.onclick = (e) => { if (e.target.closest('[data-next]')) { cover.onclick = null; cover.className = 'cover'; cover.innerHTML = ''; resolve(); } };
  });

  /* ---------- 글·설문 화면 ---------- */
  // 휴대폰 안내처럼 eTL 틀이 들어가지 않는 좁은 화면용
  const endPage = (html) => { showPage(); frame.src = 'about:blank'; pageEl.innerHTML = `<div class="sheet">${html}</div>`; pageEl.scrollTop = 0; };
  // 휴대폰으로 들어왔을 때 보는 화면. eTL 모바일 모양으로 보여 주고, PC로 옮길 링크를 바로 복사할 수 있어요.
  const phonePage = () => {
    showPage();
    frame.src = 'about:blank';
    pageEl.className = 'page page--etl';
    const link = location.href.split('#')[0];
    pageEl.innerHTML = `<div class="xm">
      <header class="xm-top">
        <button class="xm-bars" type="button" data-off aria-label="메뉴"><b></b><b></b><b></b></button>
        <span class="xm-top__title">2026-2 과제 관리 화면 실험</span>
        <span class="xm-seal">연구용<br>시제품</span>
      </header>
      <div class="xm-crumbs"><a href="#" data-off>과목</a><i>›</i><span>실험 안내</span></div>
      <div class="xm-body">
        <h1>PC에서 참여해 주세요</h1>
        <ul class="xm-over">
          <li><b>소요 시간</b><span>약 15분</span></li>
          <li><b>참여 기기</b><span>노트북·데스크톱</span></li>
          <li><b>제출물 유형</b><span>온라인 응답</span></li>
        </ul>
        <p>과제 화면을 넓게 보면서 진행하는 실험이라, PC 브라우저 창을 넓게 열어야 참여할 수 있어요.</p>
        <p class="xm-label">[참여 방법]</p>
        <ol>
          <li>아래 버튼으로 실험 링크를 복사해요.</li>
          <li>카카오톡 나에게 보내기 등으로 PC에 옮겨요.</li>
          <li>PC 브라우저에서 링크를 열면 바로 시작돼요.</li>
        </ol>
        <div class="xm-link" data-link>${esc(link)}</div>
        <button class="xm-copy" type="button" data-copy>링크 복사</button>
        <p class="xm-fine">이 화면은 서울대학교 공식 eTL이 아닌 수업 프로젝트용 연구 시제품입니다. 로그인 정보를 입력받지 않습니다.</p>
      </div>
      <div class="xp-toast" role="status"></div>
    </div>`;
    pageEl.scrollTop = 0;
    const toast = pageEl.querySelector('.xp-toast');
    const copyBtn = pageEl.querySelector('[data-copy]');
    let timer;
    const say = (text) => {
      toast.textContent = text;
      toast.classList.add('show');
      clearTimeout(timer);
      timer = setTimeout(() => { toast.classList.remove('show'); copyBtn.textContent = '링크 복사'; }, 1800);
    };
    pageEl.onclick = async (e) => {
      if (e.target.closest('[data-off]')) { e.preventDefault(); say(OFF_MENU); return; }
      if (!e.target.closest('[data-copy]')) return;
      try {
        await navigator.clipboard.writeText(link);
        copyBtn.textContent = '복사했어요';
        say('링크를 복사했어요. PC에서 열어 주세요.');
      } catch (err) {
        const range = document.createRange();
        range.selectNodeContents(pageEl.querySelector('[data-link]'));
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        say('링크를 길게 눌러 복사해 주세요.');
      }
    };
  };

  const q = (name, title, body, desc = '', required = true) => `<div class="xq" id="q-${name}" data-name="${name}" ${required ? `data-req="${name}"` : ''} role="group" aria-labelledby="t-${name}">
    <div class="xq__head"><b class="xq__no">문제</b>${required ? '' : '<span>선택</span>'}</div>
    <div class="xq__body"><p class="xq__title" id="t-${name}">${esc(title)}</p>${desc ? `<p class="xq__desc">${esc(desc)}</p>` : ''}${body}</div>
  </div>`;
  const line = (name) => `<input class="xq__line" type="text" name="${name}" maxlength="300" autocomplete="off">`;
  const options = (name, list) => `<div class="opts">${list.map(([v, l]) => radio(name, v, l)).join('')}</div>`;
  const scale = (name, values, left, right, cls = '') => `<div class="scale ${cls}" style="--n:${values.length}">${values.map((v) => `<label class="cell"><input type="radio" name="${name}" value="${v}" aria-label="${v}"><span>${cls ? '' : v}</span></label>`).join('')}</div><div class="anchors"><span>${esc(left)}</span><span>${esc(right)}</span></div>`;
  const range = (a, b, step = 1) => { const r = []; for (let v = a; v <= b; v += step) r.push(v); return r; };

  const TLX = [
    ['mental', '정신적 요구', '과업이 정신적으로 얼마나 힘들었나요? (생각, 판단, 기억 등)', '매우 낮음', '매우 높음'],
    ['physical', '신체적 요구', '과업이 신체적으로 얼마나 힘들었나요? (클릭, 스크롤 등)', '매우 낮음', '매우 높음'],
    ['temporal', '시간적 요구', '과업의 속도가 얼마나 급하거나 쫓기는 느낌이었나요?', '매우 낮음', '매우 높음'],
    ['performance', '수행도', '요구받은 과업을 얼마나 성공적으로 해냈나요?', '완벽함', '실패'],
    ['effort', '노력', '그만큼 해내기 위해 얼마나 열심히 해야 했나요?', '매우 낮음', '매우 높음'],
    ['frustration', '좌절감', '얼마나 불안하고, 의욕이 꺾이고, 짜증 나고, 스트레스를 받았나요?', '매우 낮음', '매우 높음']
  ];
  const SUS = [
    '이 화면을 자주 사용하고 싶다.',
    '이 화면은 불필요하게 복잡하다.',
    '이 화면은 사용하기 쉽다.',
    '이 화면을 사용하려면 기술적으로 도와줄 사람이 필요할 것 같다.',
    '이 화면의 여러 기능이 잘 통합되어 있다.',
    '이 화면에는 일관되지 않은 부분이 너무 많다.',
    '대부분의 사람들이 이 화면을 금방 익힐 것 같다.',
    '이 화면은 사용하기 매우 번거롭다.',
    '이 화면을 사용하면서 매우 자신감을 느꼈다.',
    '이 화면을 사용하기 전에 배워야 할 것이 많았다.'
  ];
  const rawTLX = (a) => TLX.reduce((s, [k]) => s + Number(a[`tlx_${k}`]), 0) / TLX.length;
  const susScore = (a) => 2.5 * SUS.reduce((s, _, i) => { const x = Number(a[`sus_${i + 1}`]); return s + (i % 2 === 0 ? x - 1 : 5 - x); }, 0);

  const nth = (i) => (i === 0 ? '첫' : '두');

  async function survey(i) {
    const name = `${nth(i)} 번째 화면 설문`;
    const a = await etlForm({
      step: 3 + i,
      title: `${name} (1/2)`,
      over: [['문항 수', '8문항'], ['제한 시간', '없음']],
      intro: '<p class="xf__intro">방금 사용한 화면을 떠올리며, 각 문항에서 느낌에 가장 가까운 칸을 하나씩 눌러 주세요.</p>',
      questions: `${q('burden', '이 화면으로 과제를 관리하는 것이 얼마나 부담스러웠나요?', scale('burden', range(1, 7), '전혀 부담스럽지 않았다', '매우 부담스러웠다'))}
        ${q('deadline', '이 화면을 쓴다면 과제를 마감 안에 낼 수 있을 것 같나요?', scale('deadline', range(1, 7), '전혀 그렇지 않다', '매우 그렇다'))}
        ${TLX.map(([k, title, desc, l, r]) => q(`tlx_${k}`, title, scale(`tlx_${k}`, range(0, 100, 5), l, r, 'scale--tlx'), desc)).join('')}`
    });
    const c = await etlForm({
      step: 3 + i,
      title: `${name} (2/2)`,
      over: [['문항 수', '11문항'], ['제한 시간', '없음']],
      intro: '<p class="xf__intro">1은 전혀 그렇지 않다, 5는 매우 그렇다입니다.</p>',
      questions: `${SUS.map((text, n) => q(`sus_${n + 1}`, text, scale(`sus_${n + 1}`, range(1, 5), '전혀 그렇지 않다', '매우 그렇다'))).join('')}
        ${q('pain', '이 화면에서 불편했던 점이 있다면 한 줄로 적어 주세요.', line('pain'), '', false)}`,
      go: i === 0 ? '두 번째 화면으로' : '다음'
    });
    const all = { ...a, ...c };
    return { ...all, rawTLX: rawTLX(all), sus: susScore(all) };
  }

  async function runBlock(i) {
    const { cond, set } = BLOCKS[i];
    await etlPage({
      step: 3 + i,
      title: i === 0 ? '첫 번째 화면' : '두 번째 화면',
      go: '시작하기',
      over: [['과업', '3개'], ['시작 위치', '과업마다 대시보드']],
      body: `<p>11월 9일(월) 아침, <b>3주 안에 마감되는 과제 9개를 관리하는 학생</b>이라고 생각해 주세요.${i === 1 ? ' 앞과는 다른 과목들입니다.' : ''}</p>
        <p>${cond === 'B' ? '이번 화면에는 과제마다 <b>AI 과제 코치</b>의 안내가 함께 보입니다. 안내를 얼마나 참고할지는 자유롭게 정해 주세요.' : '이번 화면은 평소 쓰는 eTL과 비슷한 화면입니다.'}</p>
        <p>평소처럼 편하게 진행해 주세요.</p>`
    });
    const tasks = mainTasks(set);
    const answers = [];
    for (let n = 0; n < tasks.length; n += 1) {
      const { answer, metrics } = await runTask(tasks[n], n, tasks.length, `index.html?cond=${cond}&set=${set}&b=${i}&n=${n}`, '과업');
      answers.push({ key: tasks[n].key, answer, metrics });
    }
    const surveyAnswers = await survey(i);
    return { cond, set, tasks: answers, survey: surveyAnswers };
  }

  const summaryHTML = () => `<p class="note">검토용으로만 보이는 표예요. 검토 모드에서는 실제로 전송하지 않아요.</p>
    <table class="summary"><tr><th>화면</th><th>T1</th><th>T2</th><th>T3 착수 일수</th><th>못 하는 날</th><th>부담</th><th>TLX</th><th>SUS</th></tr>
    ${DATA.blocks.map((b) => {
      const [t1, t2, t3] = b.tasks.map((x) => x.answer);
      return `<tr><td>${b.cond}-${b.set}</td><td>${t1.taskId}</td><td>${t2.correct ? '정답' : '오답'}</td><td>${t3.rows.map((r) => r.daysBefore).join(', ')}</td><td>${t3.rows.some((r) => r.onBlockedDay) ? '선택' : '안 함'}</td><td>${b.survey.burden}</td><td>${b.survey.rawTLX.toFixed(1)}</td><td>${b.survey.sus.toFixed(1)}</td></tr>`;
    }).join('')}</table>`;

  /* ---------- 무작위 배정 ---------- */
  async function assign() {
    if (comboParam !== null) {
      setCombo(Math.min(3, Math.max(0, parseInt(comboParam, 10) || 0)));
      DATA.assignedBy = pilot ? 'pilot' : 'link';
      return;
    }
    if (review) { setCombo(0); DATA.assignedBy = 'review'; return; }
    if (pilot) { setCombo(crypto.getRandomValues(new Uint8Array(1))[0] % 4); DATA.assignedBy = 'pilot'; return; }
    try {
      const res = await fetch(`${CFG.endpoint}/condition/`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: '*/*' }, body: JSON.stringify({ experimentID: CFG.experimentID }) });
      const json = await res.json();
      if (!res.ok || !Number.isInteger(json.condition)) throw new Error('condition');
      DATA.slot = json.condition;
      setCombo(SLOTS[json.condition % SLOTS.length]);
      DATA.assignedBy = 'datapipe';
    } catch (err) {
      setCombo(crypto.getRandomValues(new Uint8Array(1))[0] % 4);
      DATA.assignedBy = 'fallback';
    }
  }

  /* ---------- 저장: Data Sheet 양식 그대로 + 원자료 ---------- */
  const cell = (v) => {
    if (v === null || v === undefined) return '';
    let s = String(v);
    if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`; // 엑셀이 수식으로 실행하지 않게
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const toCSV = (rows) => `﻿${rows.map((r) => r.map(cell).join(',')).join('\r\n')}\r\n`;
  const ETL_LABEL = { daily: '거의 매일', '3-4': '일주일에 3~4번', '1-2': '일주일에 1~2번', rare: '한 달에 몇 번' };

  const buildFiles = () => {
    const sheet1 = [['참가자 ID', '배정 조합', '조건', '과업', '정답(T2)', '시간(초)', '클릭 수', '복귀 횟수', '착수 일수(T3)']];
    const sheet2 = [['참가자 ID', '조건', '체감 부담(1~7)', 'NASA-TLX(0~100)', 'SUS(0~100)', '마감 준수 가능성(1~7)', '서술형 응답']];
    DATA.blocks.forEach((b) => {
      b.tasks.forEach((t) => {
        const base = [DATA.pid, DATA.combo, b.cond, t.key];
        const m = [t.metrics.timeSec, t.metrics.clicks, t.metrics.returns];
        if (t.key === 'T1') sheet1.push([...base, '', ...m, '']);
        if (t.key === 'T2') sheet1.push([...base, t.answer.correct ? 1 : 0, ...m, '']);
        if (t.key === 'T3') t.answer.rows.forEach((r) => sheet1.push([...base, '', ...m, r.daysBefore]));
      });
      sheet2.push([DATA.pid, b.cond, Number(b.survey.burden), +b.survey.rawTLX.toFixed(1), +b.survey.sus.toFixed(1), Number(b.survey.deadline), b.survey.pain || '']);
    });
    const preferred = { first: DATA.blocks[0].cond, second: DATA.blocks[1].cond, same: '비슷함' }[DATA.final.prefer];
    const info = [['참가자 ID', '배정 조합', 'eTL 사용 빈도', '선호 화면', '선호 이유'], [DATA.pid, DATA.combo, ETL_LABEL[DATA.basic.etl], preferred, DATA.final.reason]];
    return {
      [`${DATA.pid}_sheet1.csv`]: toCSV(sheet1),
      [`${DATA.pid}_sheet2.csv`]: toCSV(sheet2),
      [`${DATA.pid}_participant.csv`]: toCSV(info),
      [`${DATA.pid}_raw.json`]: JSON.stringify(DATA)
    };
  };

  const sendFile = async (filename, data) => {
    if (review) {
      if (params.get('failsave') === '1') throw new Error('save test');
      window.__savedFiles = window.__savedFiles || {};
      window.__savedFiles[filename] = data;
      return;
    }
    let last;
    for (let n = 0; n < 3; n += 1) {
      try {
        const res = await fetch(`${CFG.endpoint}/data/`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: '*/*' }, body: JSON.stringify({ experimentID: CFG.experimentID, filename, data }) });
        if (res.ok) return;
        last = new Error(`save ${res.status}`);
      } catch (err) { last = err; }
      await new Promise((r) => setTimeout(r, 800 * (n + 1)));
    }
    throw last;
  };
  const saveAll = async (files) => {
    try {
      for (const [name, data] of Object.entries(files)) await sendFile(name, data);
      return true;
    } catch (err) { return false; }
  };
  const downloadBackup = (files) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(files)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${DATA.pid}_backup.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  async function main() {
    if (!review && (window.innerWidth < 1024 || matchMedia('(pointer: coarse)').matches)) {
      phonePage();
      return;
    }
    if (!review && !CFG.experimentID) {
      endPage('<h1>아직 준비 중이에요.</h1><p>실험 링크가 열리면 다시 접속해 주세요.</p>');
      return;
    }

    const startedAt = performance.now();
    await etlPage({
      step: 0,
      title: '과제 관리 화면 사용성 실험',
      go: '참여 시작',
      over: [['소요 시간', '약 15분'], ['참여 기기', '노트북·데스크톱'], ['제출물 유형', '온라인 응답']],
      body: `<p>안녕하세요, 인간공학실험 3조입니다.</p>
        <p>eTL과 비슷한 두 가지 화면으로 과제를 관리해 보고, 어떤 화면이 쓰기 편한지 알아보는 실험입니다.</p>
        <div class="gap"></div>
        <p><b>[진행 순서]</b></p>
        <ul><li>참여 동의 → 연습 → 화면 2개에서 간단한 과업 → 짧은 설문</li><li>화면에 나오는 과목과 과제는 모두 가상입니다.</li></ul>
        <div class="gap"></div>
        <p><b>[유의사항]</b></p>
        <ul><li>노트북이나 데스크톱 브라우저로 참여해 주세요.</li><li>조용한 곳에서 혼자, 한 번에 끝까지 진행해 주세요.</li><li><span class="hl">중간에 창을 닫거나 새로고침하면 응답이 저장되지 않습니다.</span></li></ul>
        <p class="fine">이 화면은 서울대학교 공식 eTL이 아닌 수업 프로젝트용 연구 시제품입니다. 로그인 정보를 입력받지 않습니다.</p>`
    });

    const consent = await etlForm({
      step: 1,
      title: '실험 참여 동의서',
      side: false,
      intro: `<dl class="xp-terms">
        <dt>하는 일</dt><dd>가상의 과목과 과제가 있는 화면에서 간단한 과업을 하고 설문에 답합니다. 실험이 끝나면 화면에 대한 설명을 드립니다.</dd>
        <dt>기록 내용</dt><dd>과업의 답, 걸린 시간, 클릭 기록, 설문 응답, eTL 사용 빈도를 기록합니다. <b>이름, 학번, 연락처는 받지 않고</b> 무작위 코드로만 저장합니다.</dd>
        <dt>자료 사용</dt><dd>수업 텀프로젝트 보고서를 쓰는 데만 사용하고, 학기 성적이 확정되면 삭제합니다.</dd>
        <dt>참여 중단</dt><dd>참여는 자유이며 언제든 창을 닫아 그만둘 수 있습니다. 불이익은 없고, 그때까지의 기록은 저장하지 않습니다.</dd>
        <dt>문의</dt><dd>모집 안내에 적힌 연락처로 문의해 주세요.</dd>
      </dl>`,
      questions: `${q('agree', '위 내용을 읽었고, 실험 참여에 동의하나요?', options('agree', [['yes', '네, 동의합니다'], ['no', '아니요, 참여하지 않을게요']]))}
        <div data-after hidden>
          ${q('student', '서울대학교 학부생인가요?', options('student', [['yes', '네'], ['no', '아니요']]))}
          ${q('etl', '이번 학기에 eTL을 얼마나 자주 사용하나요?', options('etl', [['daily', '거의 매일'], ['3-4', '일주일에 3~4번'], ['1-2', '일주일에 1~2번'], ['rare', '한 달에 몇 번'], ['never', '사용해 본 적 없어요']]))}
        </div>`,
      onChange: (f) => { f.querySelector('[data-after]').hidden = f.elements.agree.value !== 'yes'; }
    });
    if (consent.agree !== 'yes') { etlEnd({ step: 1, title: '참여하지 않기로 하셨습니다', body: '<p>아무것도 기록하지 않았습니다. 창을 닫으셔도 됩니다. 시간 내주셔서 감사합니다.</p>' }); return; }
    if (consent.student !== 'yes' || consent.etl === 'never') {
      etlEnd({ step: 1, title: '참여해 주셔서 감사합니다', body: '<p>이 실험은 eTL을 사용해 본 서울대학교 학부생을 대상으로 해서, 여기에서 마칩니다. 아무것도 기록하지 않았고, 창을 닫으셔도 됩니다.</p>' });
      return;
    }
    DATA.basic = { student: consent.student, etl: consent.etl };
    // 실험 중 실수로 창을 닫거나 사이트를 벗어나려 하면 브라우저가 한 번 물어봐요.
    let leaveGuard = true;
    window.addEventListener('beforeunload', (e) => { if (!leaveGuard || review) return; e.preventDefault(); e.returnValue = ''; });
    await assign();

    await etlPage({
      step: 2,
      title: '연습',
      go: '연습 시작',
      over: [['문제 수', '1문제'], ['성적 반영', '분석에 쓰지 않음']],
      body: `<p>화면이 어떻게 움직이는지 익히는 시간입니다.</p>
        <p>위쪽 화면을 눌러 둘러보고, <b>아래 칸</b>에서 답을 고른 뒤 <b>제출</b>을 누르면 됩니다.</p>`
    });
    const practice = practiceTasks();
    for (let n = 0; n < practice.length; n += 1) {
      const { answer: a } = await runTask(practice[n], n, practice.length, `index.html?cond=A&set=Z&p=${n}`, '연습');
      await practiceFeedback(a.correct, practice[n].answer);
    }

    for (let i = 0; i < BLOCKS.length; i += 1) DATA.blocks.push(await runBlock(i));

    const final = await etlForm({
      step: 5,
      title: '두 화면 비교',
      over: [['문항 수', '2문항'], ['제한 시간', '없음']],
      questions: `${q('prefer', '실제로 쓴다면 어느 화면을 쓰고 싶나요?', options('prefer', [['first', '첫 번째 화면'], ['second', '두 번째 화면'], ['same', '비슷해요']]))}
        ${q('reason', '그렇게 고른 이유를 한 줄로 적어 주세요.', line('reason'))}`,
      go: '제출하고 마치기'
    });
    DATA.final = final;
    DATA.totalSec = Math.round((performance.now() - startedAt) / 1000);

    etlEnd({ step: 5, title: '응답을 저장하고 있습니다', body: '<p>창을 닫지 말고 잠시만 기다려 주세요.</p>' });
    const files = buildFiles();
    const saved = await saveAll(files);
    leaveGuard = !saved;

    etlEnd({
      step: 5,
      title: '참여해 주셔서 감사합니다',
      body: `<p><b>[이 실험에 대해 알려 드립니다]</b></p>
        <p>화면의 과목, 과제, 공지는 모두 가상이고, 이 화면은 서울대학교 공식 eTL이 아닌 연구용 시제품입니다.</p>
        <p><b>AI 과제 코치의 안내는 실제 AI가 만든 것이 아니라 연구자들이 미리 작성한 내용입니다.</b> 실제 AI가 있다고 가정했을 때 사람들이 어떻게 쓰는지 보기 위해 이렇게 만들었습니다.</p>
        <div class="gap"></div>
        ${saved ? '<p><b>응답이 저장되었습니다.</b> 이제 창을 닫으셔도 됩니다.</p>' : `<div class="q is-missing"><p><b>응답을 저장하지 못했습니다.</b> 창을 닫기 전에 아래 버튼으로 파일을 내려받아, 모집 안내의 연락처로 보내 주세요. 파일에 이름이나 학번은 들어 있지 않습니다.</p><button class="xp-btn" type="button" data-backup>응답 파일 내려받기</button></div>`}
        ${pilot ? `<p><b>예비 실험 소요 시간:</b> ${Math.floor(DATA.totalSec / 60)}분 ${DATA.totalSec % 60}초</p>` : ''}
        ${review ? summaryHTML() : ''}`
    });
    if (!saved) pageEl.querySelector('[data-backup]').addEventListener('click', () => downloadBackup(files));
  }

  /* ---------- 검토용 자동 입력 (참가자에게는 안 보임) ---------- */
  if (review) {
    const btn = document.createElement('button');
    btn.className = 'qa';
    btn.textContent = '검토용: 이 화면 자동 입력';
    btn.addEventListener('click', () => {
      const start = cover.querySelector('[data-start], [data-next]');
      if (start) { start.click(); return; }
      const go = pageEl.hidden ? null : pageEl.querySelector('[data-go]');
      if (go) { go.click(); return; }
      const scope = pageEl.hidden ? dock : pageEl;
      const names = [...new Set([...scope.querySelectorAll('input[type=radio]')].map((x) => x.name))];
      names.forEach((n) => {
        const list = [...scope.querySelectorAll(`input[name="${n}"]`)];
        const pick = ['agree', 'student', 'etl'].includes(n) ? list[0] : list[Math.floor(Math.random() * list.length)];
        pick.click();
      });
      scope.querySelectorAll('select').forEach((s) => { s.selectedIndex = 1 + Math.floor(Math.random() * (s.options.length - 1)); s.dispatchEvent(new Event('change', { bubbles: true })); });
      scope.querySelectorAll('textarea, input[type=text]').forEach((t) => { t.value = '검토용 입력'; t.dispatchEvent(new Event('input', { bubbles: true })); });
    });
    document.body.appendChild(btn);
  }

  main();
})();
