import { PRESETS } from '../presets';

/**
 * 아이들의 자연어 발화 또는 문장형 입력에서 핵심 모양(명사)을 정밀하게 추출합니다.
 *
 * 지원 예시:
 * - "오리" -> "오리"
 * - "오리를 그려줘" -> "오리"
 * - "오리 모양을 보여줘" -> "오리"
 * - "오리 모양으로 만들어줘" -> "오리"
 * - "오리 그림 그려줘" -> "오리"
 * - "선생님 오리를 보여주세요" -> "오리"
 * - "귀여운 오리 하고 싶어" -> "오리"
 * - "칠교로 오리 만들어줘" -> "오리"
 */
export function extractCoreWord(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  // 1. 문장 부호 및 특수문자 제거
  let text = raw.trim().replace(/[.,?!~^*_#@'"「」…:;`·]/g, ' ');

  // 2. 부름말, 감탄사, 군더더기 말 제거 (문장 앞/뒤)
  const fillers = [
    /^(선생님|컴퓨터야|인공지능아|친구야|안녕|저기|음|어|저|그|제발|좀)\s+/g,
    /\s+(선생님|컴퓨터야|인공지능아|제발|좀)$/g
  ];
  for (const f of fillers) {
    text = text.replace(f, ' ');
  }

  // 3. 칠교/도형 관련 부가 어휘 제거
  text = text.replace(/(칠교판|칠교놀이|칠교|도형|퍼즐|블록)(\s*(으로|로|판|놀이))?/g, ' ');

  // 4. 일상 대화형 요청 어미 및 술어 제거
  const requestPhrases = [
    /만들어\s*(줘|주세요|봐|라|줄래|주라|볼래|보자|요)?/g,
    /그려\s*(줘|주세요|봐|라|줄래|주라|볼래|보자|요)?/g,
    /보여\s*(줘|주세요|봐|라|줄래|주라|볼래|보자|요)?/g,
    /찾아\s*(줘|주세요|봐|라|줄래|주라|요)?/g,
    /띄워\s*(줘|주세요|봐|라|줄래|주라)?/g,
    /꺼내\s*(줘|주세요|봐|라|줄래|주라)?/g,
    /열어\s*(줘|주세요|봐|라|줄래|주라)?/g,
    /가르쳐\s*(줘|주세요|줄래)?/g,
    /알려\s*(줘|주세요|줄래)?/g,
    /해\s*(줘|주세요|봐|라|줄래|주라|볼래|보자|요)?/g,
    /나와\s*(라|봐|줘|요)?/g,
    /나타나\s*(라|봐|줘|요)?/g,
    /부탁\s*(해|해요|합니다)/g,
    /(만들기|그리기|보기|찾기|하기)/g,
    /(만들래|그릴래|볼래|할래)(요)?/g,
    /(만들자|그리자|보자|하자)/g,
    /(만들고|그리고|보고|하고)\s*싶(어|어요|다)/g
  ];

  for (const regex of requestPhrases) {
    text = text.replace(regex, ' ');
  }

  // 5. '모양', '그림', '모습' 등 부가 명사 제거 (조사 포함)
  text = text.replace(/(모양|그림|모습)(\s*(으로|로|을|를|이|가|은|는|도|에|의))?/g, ' ');

  // 6. 단어별 분리 및 조사(Postpositions) 제거
  const rawTokens = text.split(/\s+/).filter(Boolean);
  const cleanedTokens: string[] = [];

  const particleRegex = /(으로는|에서는|에게|으로|까지|부터|처럼|이나|이랑|랑|으로|로|을|를|이|가|은|는|도|와|과|이야|야|예요|에요|요|다|입니다)$/;

  for (const token of rawTokens) {
    const stripped = token.replace(particleRegex, '').trim();
    if (stripped) {
      cleanedTokens.push(stripped);
    }
  }

  const presetKeys = Object.keys(PRESETS);

  // 7. [우선순위 1] 토큰 중 추천 목록(PRESETS)과 100% 일치하는 단어가 있는지 확인
  for (const token of cleanedTokens) {
    if (presetKeys.includes(token)) {
      return token;
    }
  }

  // 8. [우선순위 2] 2글자 이상인 추천 단어가 문장 또는 토큰에 포함되어 있는지 확인
  // (예: "오리를그려줘"에서 "오리" 포함 감지, 단 1글자 단어는 오탐 방지를 위해 별도 처리)
  const multiCharPresets = presetKeys.filter(k => k.length >= 2);
  for (const preset of multiCharPresets) {
    if (text.includes(preset) || rawTokens.some(t => t.includes(preset))) {
      return preset;
    }
  }

  // 9. [우선순위 3] 1글자 추천 단어 (예: "집", "꽃", "배") 일치 확인
  const singleCharPresets = presetKeys.filter(k => k.length === 1);
  for (const preset of singleCharPresets) {
    for (const token of rawTokens) {
      // "집을", "꽃을", "배를", "집", "꽃", "배" 등 정확한 낱말 형태일 때만 매칭
      if (token === preset || token.replace(particleRegex, '') === preset) {
        return preset;
      }
    }
  }

  // 10. [우선순위 4] 프리셋에 없는 일반 명사 (예: "사자", "공룡", "비행기")
  // 흔한 형용사/수식어 제거 후 마지막 핵심 명사 선택
  const modifiers = new Set([
    '예쁜', '귀여운', '멋진', '노란', '빨간', '파란', '초록', '하얀', '검은',
    '큰', '작은', '재미있는', '신기한', '좋은'
  ]);

  const candidateTokens = cleanedTokens.filter(t => !modifiers.has(t));
  if (candidateTokens.length > 0) {
    return candidateTokens[candidateTokens.length - 1];
  }

  if (cleanedTokens.length > 0) {
    return cleanedTokens[cleanedTokens.length - 1];
  }

  // 만약 모든 단계에서 정제되지 못했다면 기본 텍스트 반환
  return text.trim().replace(particleRegex, '');
}
