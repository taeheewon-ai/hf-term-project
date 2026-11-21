// 과제 본문, 공지, 게시판, 단계별 계획. 두 세트는 틀이 같고 낱말만 달라요.
// T2 정답 위치: X는 분량=공지·제출=게시판, Y는 반대로 분량=게시판·제출=공지.
(() => {
  const V = {
    X: { ta: ['윤서진', 'ta-cogpsy@example.com'], pShort: '인지심리학', qShort: '경제학원론', qCh: { Q1: 3, Q2: 4, Q3: 6 }, design: '실험', item: '측정 항목', groupWork: '발표', groupOut: '슬라이드', finalName: '기말 프로젝트 보고서',
      finalAim: '수업에서 다룬 인지 과정 하나를 골라 일상 사례에 적용하는 보고서를 작성합니다.',
      readKind: '감상문', chapters: { R1: '제3장과 제4장', R2: '제5장과 제6장', R3: '제7장과 제8장' },
      topics: { Q1: '수요와 공급', Q2: '탄력성', Q3: '소비자 선택' } },
    Y: { ta: ['한지우', 'ta-sociology@example.com'], pShort: '사회학의이해', qShort: '통계학', qCh: { Q1: 2, Q2: 4, Q3: 8 }, design: '설문', item: '설문 문항', groupWork: '토론', groupOut: '토론 자료', finalName: '기말 조사 보고서',
      finalAim: '수업에서 다룬 사회 현상 하나를 골라 주변 사례에 적용하는 보고서를 작성합니다.',
      readKind: '서평', chapters: { R1: '제2장과 제3장', R2: '제4장과 제5장', R3: '제6장과 제7장' },
      topics: { Q1: '기술통계', Q2: '확률분포', Q3: '가설검정' } },
    Z: { ta: ['김연습', 'ta-practice@example.com'], pShort: '연습과목가', qShort: '연습 과목 나', qCh: { Q1: 1, Q2: 2, Q3: 3 }, design: '연습', item: '연습 항목', groupWork: '발표', groupOut: '슬라이드', finalName: '연습 기말 보고서',
      finalAim: '수업에서 다룬 내용 하나를 골라 사례에 적용하는 보고서를 작성합니다.',
      readKind: '감상문', chapters: { R1: '제1장과 제2장', R2: '제3장과 제4장', R3: '제5장과 제6장' },
      topics: { Q1: '연습 주제 1', Q2: '연습 주제 2', Q3: '연습 주제 3' } }
  };
  const T2 = {
    X: { taskId: 'P3', volume: 'A4 5쪽 이내', submit: 'PDF 파일로 eTL 과제 메뉴에 제출', volumeIn: 'notice', submitIn: 'board' },
    Y: { taskId: 'P3', volume: 'A4 7쪽 이내', submit: 'Word 파일로 eTL 과제 메뉴에 제출', volumeIn: 'board', submitIn: 'notice' },
    Z: { taskId: 'P3', volume: 'A4 2쪽 이내', submit: 'PDF 파일로 eTL 과제 메뉴에 제출', volumeIn: 'notice', submitIn: 'board' }
  };
  const MIN = { R: [15, 75], Q2: [20, 100], Q3: [20, 100, 60], P1: [20, 70, 120, 90], P2: [25, 95, 180, 180, 150, 90], P3: [10, 50, 120, 180] };

  const planOf = (t, v) => {
    const first = t.first.replace(/ \(\d+분\)$/, '');
    const week = (t.related.find((r) => r.includes('주차 강의자료')) || '');
    const pick = (texts, mins, srcs) => texts.map((x, i) => ({ text: x, min: mins[i], src: srcs[i] }));
    if (t.course === 'R') return pick([first, `${v.chapters[t.id]} 읽고 ${v.readKind} 1쪽 쓰기`], MIN.R, ['주차학습 읽기 자료', '과제 설명']);
    if (t.id === 'Q1') return pick([first, '나머지 문제 풀고 풀이 정리하기'], MIN.Q2, ['과제 설명', '게시판 글 1건']);
    if (t.course === 'Q') return pick([first, '나머지 문제 풀기', '풀이 검토하고 제출 파일 만들기'], MIN.Q3, ['과제 설명', '과제 설명', '게시판 글 1건']);
    if (t.id === 'P1') return pick([first, `${v.design} 절차를 표로 정리하기`, '보고서 초안 쓰기', '고치고 제출 파일 만들기'], MIN.P1, [week, week, '과제 설명', '공지 1건']);
    if (t.id === 'P2') return pick([first, '조원별 자료 조사 나누기', '내용 초안 만들기', `${v.groupOut} 만들기`, '조원 의견 반영하기', `${v.groupWork} 리허설 하기`], MIN.P2, ['공지 2건', '과제 설명', week, '과제 설명', '과제 설명', '공지 2건']);
    return pick([first, `${week} 읽고 연구 질문 정하기`, '참고 자료 2편 찾아 근거 정리하기', '분석과 결론 쓰고 다듬기'], MIN.P3, ['과제 설명', week, week, '과제 설명']);
  };

  // 실제 eTL 과제 설명의 특징: 짧고, 과목마다 말투가 다르고, 앞 과제나 공지를 참고하라는 식이 많아요.
  const UL = (items) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  const L = (lines) => lines.map((x) => `<p>${x}</p>`).join('');
  const FILE = (n) => `<a href="#" data-toast="이 실험에서는 파일을 열지 않아도 됩니다.">${n}</a>`;
  const descOf = (t, v) => {
    const ta = `담당조교: ${v.ta[0]} / ${v.ta[1]}`;
    const fileTag = t.title.replace(/\s/g, '');
    const ch = v.qCh[t.id];
    const kind = v.readKind;
    switch (t.id) {
      case 'R1': return L([
        `작성요령: 제목 필수, 아래한글 기준 글씨크기 11pt, 줄 간격 160%.`,
        `분량: A4 1장 (반 장 이상은 채울 것)`,
        `교재 ${v.chapters.R1}을 읽고 가장 인상적인 주장 하나를 골라 본인의 생각을 쓰기 바랍니다. 내용 요약만 있는 경우 감점합니다.`,
        `제출기한: 11/11(수) 23:59`,
        `<strong>생성형 AI 활용은 금지됩니다.</strong>`
      ]);
      case 'R2': return L([`${kind} 과제 2입니다. 범위는 ${v.chapters.R2}.`, `작성요령과 분량은 ${kind} 1과 동일합니다.`, `제출기한: 11/18(수) 23:59`]);
      case 'R3': return L([`${kind} 과제 3입니다. 범위는 ${v.chapters.R3}.`, `작성요령과 분량은 ${kind} 1과 동일합니다.`, `제출기한: 11/25(수) 23:59`, `※ 3회 모두 제출해야 점수가 인정됩니다.`]);
      case 'Q1': return L([
        `${v.qShort} ${t.title} 제출함입니다. `,
        `범위 : 교재 ${ch}장 연습문제 1~5번 (${FILE(`${fileTag}_문제.pdf`)})`,
        `파일명 : 학번_이름_${fileTag} ( ex : 2026-12345_홍길동_${fileTag} )`,
        `기한 : 11.16 월요일 수업시간 전까지 (오전 11시)`,
        `정답은 기한 이후 주차학습에 업로드됩니다.`
      ]);
      case 'Q2': return L([`${t.title} 제출함입니다.`, `범위는 교재 ${ch}장 1~5번 입니다.`, `기한은 11.23(월) 수업시간 전까지 입니다.`]);
      case 'Q3': return L([`${t.title} 제출함입니다.`, `범위는 교재 ${ch}장 1~5번 입니다.`, `기한은 11.30(월) 수업시간 전까지 입니다.`, `※ 풀이 과정 없이 답만 적으면 감점됩니다.`]);
      case 'P1': return UL([
        `구성 내용: 1)${v.design} 목적, 2)${v.item} 및 절차, 3)예상 결과`,
        `참고 자료: 8주차 강의자료 p.9`,
        `양식: 자유 양식 (분량 등 세부 사항은 공지 참고)`,
        `<strong>주의사항: 타 조 자료를 그대로 사용한 경우 0점 처리</strong>`,
        ta
      ]);
      case 'P2': return `<p>조별 ${v.groupWork} 과제입니다.</p>${UL([
        `구성 내용: 주제 선정 배경, 핵심 내용, 토의 질문 2개`,
        `조 편성 및 ${v.groupWork} 순서: 공지 확인`,
        `제출: <span class="hl">조장 1인만</span> 제출하시면 됩니다`,
        `파일명: ${v.pShort} ${v.groupWork}자료_N조.pdf`
      ])}`;
      default: return UL([
        `주제: ${v.finalAim.replace('보고서를 작성합니다.', '보고서 (자유 주제)')}`,
        `구성 내용: 1)주제 및 연구 질문, 2)관련 근거(강의자료 및 참고문헌 2편 이상), 3)분석, 4)결론`,
        `양식 및 분량, 제출 방법: 공지사항 및 Q&amp;A 게시판 확인 바랍니다`,
        `주의사항: 생성형 AI를 활용한 경우 활용 범위를 보고서 끝에 명시할 것`,
        ta
      ]);
    }
  };

  const build = (key) => {
    const S = window.SETS[key];
    const v = V[key];
    const a = T2[key];
    const name = (id) => S.tasks.find((t) => t.id === id).title;
    S.tasks.forEach((t) => { t.desc = descOf(t, v); t.plan = planOf(t, v); });
    // 실제 공지처럼 인사말과 다른 안내 사이에 T2 정답이 섞여 있고, 제목에는 드러나지 않아요.
    const final = v.finalName;
    const pName = S.courses.P.name.replace(/^2026-2 | \(\d+\)$/g, '');
    const room = { X: '302호', Y: '415호', Z: '101호' }[key];
    const finalLine = a.volumeIn === 'notice'
      ? `• 분량: 표지와 참고문헌을 제외하고 ${a.volume}입니다. 글씨 크기와 줄 간격은 자유입니다.`
      : `• 제출: ${a.submit}해 주세요. 파일에 직접 피드백을 달 예정이라 다른 형식은 받지 않습니다.`;
    const finalNotice = { task: 'P3', by: v.ta[0], title: `[${final}] 관련 안내`, date: '11월 5일 오후 5:32', body: [
      `안녕하세요. ${pName} 조교 ${v.ta[0]}입니다.`,
      `${final} 관련하여 문의가 많아 몇 가지 안내드립니다.`,
      '• 주제: 수업 시간에 다룬 내용이면 자유롭게 정해도 됩니다. 주제가 애매하면 메일로 문의 바랍니다.',
      '• 참고문헌: APA 형식 권장 (형식 때문에 감점하지는 않습니다)',
      finalLine,
      '• 그림과 표는 본문에 넣어 주세요. 부록은 따로 받지 않습니다.',
      '추가 문의는 Q&A 게시판을 이용해 주시기 바랍니다.',
      '감사합니다.'
    ] };
    const finalPost = a.submitIn === 'board'
      ? { task: 'P3', title: `${final} 질문있습니다`, date: '11월 6일 오전 1:47',
          q: ['안녕하세요 조교님!', `${final} 제출은 어떤 형식으로 하면 되는지 궁금합니다. 한글 파일로 내도 괜찮을까요?`],
          a: ['안녕하세요.', `${a.submit}해 주세요. 한글 파일은 서식이 깨지는 경우가 있어 받지 않습니다.`, '감사합니다.'] }
      : { task: 'P3', title: `${final} 질문있습니다`, date: '11월 6일 오전 1:47',
          q: ['안녕하세요 조교님!', `${final} 분량이 어느 정도인지 궁금합니다. 표지랑 참고문헌도 쪽수에 포함되나요?`],
          a: ['안녕하세요.', `표지와 참고문헌을 제외하고 ${a.volume}로 작성해 주세요. 글씨 크기와 줄 간격은 자유입니다.`, '감사합니다.'] };
    S.notices = {
      P: [
        finalNotice,
        { by: v.ta[0], title: '금일 강의실 변경', date: '11월 4일 오전 9:12', body: [`기존 강의실 행사 진행으로, 금일 강의는 ${room}에서 진행됩니다.`] },
        { task: 'P2', by: v.ta[0], title: `[${name('P2')}] ${v.groupWork} 순서 및 진행 방식`, date: '11월 3일 오후 8:05', body: [
          `안녕하세요. ${name('P2')} 진행 방식 안내드립니다.`,
          `${v.groupWork} 순서는 당일 수업 시간에 추첨으로 정합니다.`,
          `조별 15분 (${v.groupWork} 10분 + 질의응답 5분)이고, 시간 초과 시 감점될 수 있습니다.`,
          `${v.groupWork}자는 조 내에서 자유롭게 정하시면 됩니다.`
        ] },
        { task: 'P2', by: v.ta[0], title: '조 편성 안내', date: '11월 3일 오전 10:40', body: [
          '조 편성 결과 안내드립니다. 조는 4명씩이며 명단은 다음 수업 시간에 공개합니다.',
          '조 변경이 꼭 필요한 경우 조교에게 메일 부탁드립니다.'
        ] },
        { task: 'P1', by: v.ta[0], title: `[${name('P1')}] 작성 관련`, date: '11월 2일 오후 4:18', body: [
          `안녕하세요. ${pName} 조교 ${v.ta[0]}입니다.`,
          '8주차 강의자료 업로드 완료했습니다.',
          `${name('P1')}은 A4 3쪽 이내로 작성하고, ${v.item}을 2개 이상 포함해 주세요.`,
          '실제 데이터를 수집할 필요는 없습니다.'
        ] },
        { by: v.ta[0], title: '중간고사 점수 확인 안내', date: '10월 29일 오후 2:51', body: [
          '중간고사 채점이 완료되어 성적 탭에 반영했습니다.',
          '답안지 확인을 원하는 학생은 이번 주 안으로 조교에게 메일 보내주세요.'
        ] }
      ],
      Q: [
        { by: '담당 조교', title: '중간고사 클레임 신청', date: '11월 2일 오전 11:26', body: ['중간고사 답안지 확인을 원하는 분들은 이번 주 수업 끝나고 남아주시기 바랍니다.', '평균은 수업 시간에 공지하겠습니다.'] },
        { by: '담당 조교', title: `${name('Q1')} 제출함 열었습니다`, date: '10월 30일 오후 6:02', body: ['과제 제출함 열었습니다. 기한 확인하시고 늦지 않게 제출 부탁드립니다.'] }
      ],
      R: [
        { by: '담당 교수', title: '이번 주 목요일 수업은 동영상 강의로 대체합니다', date: '11월 2일 오후 3:44', body: ['학회 일정으로 이번 주 목요일 수업은 동영상 강의로 대체합니다.', '학습인정기간 안에 시청해야 출석으로 인정되니 확인 바랍니다.'] }
      ]
    };
    S.board = {
      P: [
        finalPost,
        { title: '강의자료 어디서 받나요?', date: '11월 2일 오후 11:09', q: ['이번 주 강의자료가 안 보여서요ㅠㅠ 어디에 올라와 있나요?'], a: ['주차학습 메뉴에 올려 두었습니다.'] },
        { title: '다음 주 수업 정상 진행하나요?', date: '10월 30일 오후 9:33', q: ['혹시 다음 주에 휴강인지 궁금합니다.'], a: ['정상 진행합니다.'] }
      ],
      Q: ['Q3', 'Q2', 'Q1'].map((id, i) => ({ task: id, title: `${name(id)} 풀이 어디까지 적어야 하나요?`, date: `11월 ${6 - i}일 오후 10:1${i}`,
        q: ['안녕하세요. 답만 적어도 되는지, 풀이도 다 적어야 하는지 궁금합니다.'], a: ['풀이 과정도 같이 적어주세요. 손글씨 스캔해서 올려도 됩니다.'] })),
      R: []
    };
    S.t2 = a;
  };
  build('X');
  build('Y');
  build('Z');
})();
