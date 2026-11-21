// 세트 X·Y 공통 뼈대: 마감일, 시간, 단계 수, 자료 수, 배점이 두 세트에서 똑같아요.
// 달라지는 건 과목 이름, 과제 이름, 첫 단계 글뿐이에요.
window.SCENARIO = { today: '2026-11-09', hoursPerDay: 2 };

(() => {
  const NIGHT = '오후 11:59';
  const AM = '오전 11:00';
  const READ = ['과제 설명', '주차학습 읽기 자료'];
  const SOLVE = ['과제 설명', '게시판 글 1건'];
  const SKELETON = [
    { id: 'R1', course: 'R', due: '2026-11-11', dueText: NIGHT, min: 90, steps: 2, pts: 10, firstMin: 15, related: READ },
    { id: 'P1', course: 'P', due: '2026-11-13', dueText: NIGHT, min: 300, steps: 4, pts: 20, firstMin: 20, related: ['과제 설명', '공지 1건', '8주차 강의자료'] },
    { id: 'Q1', course: 'Q', due: '2026-11-16', dueText: AM, min: 120, steps: 2, pts: 10, firstMin: 20, related: SOLVE },
    { id: 'R2', course: 'R', due: '2026-11-18', dueText: NIGHT, min: 90, steps: 2, pts: 10, firstMin: 15, related: READ },
    { id: 'P2', course: 'P', due: '2026-11-20', dueText: NIGHT, min: 720, steps: 6, pts: 30, firstMin: 25, related: ['과제 설명', '공지 2건', '9주차 강의자료'] },
    { id: 'Q2', course: 'Q', due: '2026-11-23', dueText: AM, min: 180, steps: 3, pts: 10, firstMin: 20, related: SOLVE },
    { id: 'R3', course: 'R', due: '2026-11-25', dueText: NIGHT, min: 90, steps: 2, pts: 10, firstMin: 15, related: READ },
    { id: 'P3', course: 'P', due: '2026-11-27', dueText: NIGHT, min: 360, steps: 4, pts: 40, firstMin: 10, related: ['과제 설명', '공지 1건', '게시판 글 1건', '10주차 강의자료'] },
    { id: 'Q3', course: 'Q', due: '2026-11-30', dueText: AM, min: 180, steps: 3, pts: 10, firstMin: 20, related: SOLVE }
  ];
  const COLORS = { P: 'rgb(90, 146, 222)', Q: 'rgb(95, 160, 86)', R: 'rgb(186, 94, 142)' };
  const TEXT = {
    X: {
      courses: { P: '2026-2 인지심리학 (001)', Q: '2026-2 경제학원론 (002)', R: '2026-2 서양문명의 이해 (003)' },
      R1: ['읽기 감상문 1(제3·4장)', '제3장 핵심 5줄로 요약하기'],
      P1: ['실험 설계 보고서 1', '강의자료 p.9 보고 측정 항목 2개 정하기'],
      Q1: ['과제 1', '1번 문제 풀이 방향 메모하기'],
      R2: ['읽기 감상문 2(제5·6장)', '제5장 핵심 5줄로 요약하기'],
      P2: ['조별 발표 자료', '조원 역할 나누고 목차 정하기'],
      Q2: ['과제 2', '1번 문제 풀이 방향 메모하기'],
      R3: ['읽기 감상문 3(제7·8장)', '제7장 핵심 5줄로 요약하기'],
      P3: ['기말 프로젝트 보고서', '주제 후보 3개 메모하기'],
      Q3: ['과제 3', '1번 문제 풀이 방향 메모하기']
    },
    Y: {
      courses: { P: '2026-2 사회학의 이해 (001)', Q: '2026-2 통계학 (002)', R: '2026-2 동양문명의 이해 (003)' },
      R1: ['읽기 서평 1(제2·3장)', '제2장 핵심 5줄로 요약하기'],
      P1: ['설문 설계 보고서 1', '강의자료 p.9 보고 설문 문항 2개 정하기'],
      Q1: ['연습문제 1', '1번 문제 풀이 방향 메모하기'],
      R2: ['읽기 서평 2(제4·5장)', '제4장 핵심 5줄로 요약하기'],
      P2: ['조별 토론 자료', '조원 역할 나누고 쟁점 정하기'],
      Q2: ['연습문제 2', '1번 문제 풀이 방향 메모하기'],
      R3: ['읽기 서평 3(제6·7장)', '제6장 핵심 5줄로 요약하기'],
      P3: ['기말 조사 보고서', '조사 주제 후보 3개 메모하기'],
      Q3: ['연습문제 3', '1번 문제 풀이 방향 메모하기']
    },
    // 연습 전용 세트: 본 실험 과제가 미리 보이지 않게 이름을 따로 써요.
    Z: {
      courses: { P: '2026-2 연습 과목 가 (001)', Q: '2026-2 연습 과목 나 (002)', R: '2026-2 연습 과목 다 (003)' },
      R1: ['연습 읽기 1', '첫 장 핵심 5줄로 요약하기'],
      P1: ['연습 보고서 1', '강의자료 보고 항목 2개 정하기'],
      Q1: ['연습 풀이 1', '1번 문제 풀이 방향 메모하기'],
      R2: ['연습 읽기 2', '첫 장 핵심 5줄로 요약하기'],
      P2: ['연습 조별 자료', '조원 역할 나누고 목차 정하기'],
      Q2: ['연습 풀이 2', '1번 문제 풀이 방향 메모하기'],
      R3: ['연습 읽기 3', '첫 장 핵심 5줄로 요약하기'],
      P3: ['연습 기말 보고서', '주제 후보 3개 메모하기'],
      Q3: ['연습 풀이 3', '1번 문제 풀이 방향 메모하기']
    }
  };

  const DAY = ['일', '월', '화', '수', '목', '금', '토'];
  const fmtTime = (m) => `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ''}`;
  // 보고서 규칙: 하루 2시간씩, 마감 전날까지 끝나도록 마감일에서 거꾸로 세기
  const startOf = (due, min) => {
    const [y, mo, d] = due.split('-').map(Number);
    const s = new Date(Date.UTC(y, mo - 1, d - Math.ceil(min / (window.SCENARIO.hoursPerDay * 60))));
    return { key: s.toISOString().slice(0, 10), text: `${s.getUTCMonth() + 1}/${s.getUTCDate()}(${DAY[s.getUTCDay()]})` };
  };
  const build = (key) => {
    const T = TEXT[key];
    const courses = {};
    Object.keys(COLORS).forEach((c) => { courses[c] = { name: T.courses[c], color: COLORS[c] }; });
    const tasks = SKELETON.map((s) => {
      const st = startOf(s.due, s.min);
      return { ...s, title: T[s.id][0], hours: `${fmtTime(s.min)}(${s.steps}단계)`, start: st.text, startKey: st.key, first: `${T[s.id][1]} (${s.firstMin}분)` };
    });
    const total = tasks.reduce((a, t) => a + t.min, 0);
    return { key, courses, tasks, summary: `3주 안에 마감되는 과제가 ${tasks.length}개, 예상 작업량은 약 ${Math.round(total / 60)}시간입니다.` };
  };
  window.SETS = { X: build('X'), Y: build('Y'), Z: build('Z') };
})();
