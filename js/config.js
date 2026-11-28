// 저장 설정. experimentID가 비어 있으면 참가자용 링크는 시작되지 않아요(잘못된 실행으로 자료가 사라지는 일 방지).
window.STUDY_CONFIG = {
  endpoint: 'https://pipe.jspsych.org/api',
  experimentID: 'AhlF0aNqcBAQ',
  // 11/28 실험 끝(24명). true면 참가자 링크는 '실험이 끝났어요' 화면만 보여요. ?review=1 은 그대로 돼요.
  closed: true
};
