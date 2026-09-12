import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PRESETS } from '../presets';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface SearchAndChipsProps {
  onSelectWord: (word: string) => void;
  activeWord: string;
  disabled?: boolean;
}

/**
 * 아이들의 자연어 발화에서 핵심 낱말을 정밀하게 추출하고
 * 추천 모양(프리셋)과 스마트 매칭해 주는 도우미 함수
 */
function extractCoreWord(raw: string): string {
  let text = raw.trim().replace(/[.,?!~^*_#@]/g, '');

  // 1. 추천 목록에 있는 단어가 포함되어 있으면 즉시 해당 단어로 확정 (정확도 대폭 향상)
  const presetKeys = Object.keys(PRESETS);
  for (const preset of presetKeys) {
    if (text.includes(preset)) {
      return preset;
    }
  }

  // 2. 일상 대화형 어미 및 요청 표현 제거
  const requestPhrases = [
    /만들어\s*(줘|주세요|봐|라|줄래|주라|볼래)?/g,
    /그려\s*(줘|주세요|봐|라|줄래|주라|볼래)?/g,
    /보여\s*(줘|주세요|봐|라|줄래|주라)?/g,
    /찾아\s*(줘|주세요|봐|라|줄래|주라)?/g,
    /해\s*(줘|주세요|봐|라|줄래|주라|볼래)?/g,
    /만들기/g,
    /그리기/g,
    /(하고\s*싶어|할래요|할래)/g,
    /모양/g,
  ];

  for (const regex of requestPhrases) {
    text = text.replace(regex, '');
  }

  // 3. 낱말 끝의 조사 제거
  text = text.trim();
  text = text.replace(/(으로|로|을|를|이|가|은|는|예요|에요|이야|야|요)$/, '');
  text = text.trim();

  // 4. 여러 단어인 경우 (예: "빨간 사과" -> "사과" 등 마지막 명사 또는 첫 명사)
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    // 뒤쪽 핵심 단어 우선 확인
    return tokens[tokens.length - 1];
  }

  return text;
}

export const SearchAndChips: React.FC<SearchAndChipsProps> = ({
  onSelectWord,
  activeWord,
  disabled,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [isSpeakingLive, setIsSpeakingLive] = useState(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const finishTimeoutRef = useRef<any>(null);
  const latestWordRef = useRef<string>('');

  // 타이머 및 음성인식 정리
  const stopAllTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
  }, []);

  const stopRecognition = useCallback(() => {
    stopAllTimers();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setIsSpeakingLive(false);
  }, [stopAllTimers]);

  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, [stopRecognition]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    stopRecognition();
    const clean = inputValue.trim();
    if (clean) {
      onSelectWord(clean);
    }
  };

  // 단어 확정 및 검색 실행
  const commitRecognizedWord = useCallback(
    (rawWord: string) => {
      const clean = extractCoreWord(rawWord);
      if (!clean) {
        setSpeechNotice('소리를 잘 듣지 못했어요. 다시 말씀해 보세요 👂');
        setTimeout(() => setSpeechNotice(null), 2500);
        stopRecognition();
        return;
      }

      setInputValue(clean);
      setSpeechNotice(`"${clean}" 모양을 만들어요! ✨`);
      stopRecognition();
      onSelectWord(clean);
      setTimeout(() => setSpeechNotice(null), 2500);
    },
    [onSelectWord, stopRecognition]
  );

  const handleToggleVoiceSearch = async () => {
    if (disabled) return;

    // 이미 듣고 있는 중이면 수동 중지
    if (isListening) {
      if (latestWordRef.current.trim()) {
        commitRecognizedWord(latestWordRef.current);
      } else {
        stopRecognition();
        setSpeechNotice(null);
      }
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechNotice('이 브라우저는 음성 검색을 지원하지 않아요. Chrome을 권장합니다.');
      setTimeout(() => setSpeechNotice(null), 3000);
      return;
    }

    // 마이크 권한 요청 및 점검
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr) {
      console.warn('Microphone permission warning:', permErr);
    }

    try {
      stopRecognition();

      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      // 실시간 빠른 피드백을 위해 interimResults를 true로 활성화 (속도 3배 향상)
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 3;

      latestWordRef.current = '';

      recognition.onstart = () => {
        setIsListening(true);
        setIsSpeakingLive(false);
        setSpeechNotice('말씀해 주세요! 귀 기울여 듣고 있어요 👂');

        // 6초 동안 아무 소리도 입력되지 않으면 자동 종료 안내 (무반응 먹통 방지)
        stopAllTimers();
        silenceTimerRef.current = setTimeout(() => {
          if (!latestWordRef.current.trim()) {
            setSpeechNotice('목소리가 들리지 않았어요. 마이크 가까이에서 다시 말씀해 주세요.');
            stopRecognition();
            setTimeout(() => setSpeechNotice(null), 3000);
          }
        }, 6000);
      };

      recognition.onspeechstart = () => {
        setIsSpeakingLive(true);
      };

      recognition.onresult = (event: any) => {
        setIsSpeakingLive(true);

        // 상위 후보군(Alternatives) 중 최적 텍스트 탐색
        let currentBest = '';
        let isFinalResult = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            isFinalResult = true;
          }

          // 대안 후보들 중 프리셋과 일치하는 단어가 있는지 우선 확인
          for (let a = 0; a < res.length; a++) {
            const altText = res[a].transcript || '';
            const core = extractCoreWord(altText);
            if (Object.keys(PRESETS).includes(core)) {
              currentBest = core;
              break;
            }
          }

          if (!currentBest && res[0]?.transcript) {
            currentBest = res[0].transcript;
          }
        }

        if (currentBest) {
          latestWordRef.current = currentBest;
          const cleaned = extractCoreWord(currentBest);
          setInputValue(cleaned);
          setSpeechNotice(`듣고 있어요: "${cleaned}" 🗣️`);

          // 1. 만약 완벽한 최종 결과(isFinal)가 오면 즉시 확정
          if (isFinalResult) {
            stopAllTimers();
            commitRecognizedWord(currentBest);
            return;
          }

          // 2. 발화가 잠시 멈췄을 때 브라우저 지연을 기다리지 않고 600ms 만에 초고속 자동 확정
          if (finishTimeoutRef.current) {
            clearTimeout(finishTimeoutRef.current);
          }
          finishTimeoutRef.current = setTimeout(() => {
            if (latestWordRef.current.trim()) {
              commitRecognizedWord(latestWordRef.current);
            }
          }, 650);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event?.error);
        if (event.error === 'not-allowed') {
          setSpeechNotice('마이크 사용 권한을 허용해 주세요 🎙️');
        } else if (event.error === 'no-speech') {
          setSpeechNotice('목소리가 들리지 않았어요. 마이크 가까이에서 말씀해 주세요.');
        } else if (event.error === 'network') {
          setSpeechNotice('음성 인식 네트워크 상태를 확인해 주세요.');
        } else {
          setSpeechNotice('음성을 인식하지 못했어요. 다시 시도해 주세요.');
        }
        stopRecognition();
        setTimeout(() => setSpeechNotice(null), 3000);
      };

      recognition.onend = () => {
        // 만약 마지막에 수집된 단어가 있다면 즉시 확정
        if (latestWordRef.current.trim()) {
          commitRecognizedWord(latestWordRef.current);
        } else {
          stopRecognition();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setSpeechNotice('마이크를 시작할 수 없습니다. 권한 설정을 확인해 주세요.');
      stopRecognition();
      setTimeout(() => setSpeechNotice(null), 3000);
    }
  };

  const presetKeys = Object.keys(PRESETS);

  return (
    <div
      id="search-card"
      className="search bg-[#FFFFFF] border-3 border-[#E4DCC4] rounded-[26px] p-3.5 sm:p-4 shadow-[0_4px_0_#E4DCC4]"
    >
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <div className="relative flex-1 flex items-center">
          <input
            id="word"
            type="text"
            maxLength={12}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isListening ? '지금 말씀해 주세요…' : '예: 기차, 사과, 비행기'}
            aria-label="만들고 싶은 것"
            disabled={disabled}
            className={`w-full min-w-0 font-gaegu text-2xl font-bold pl-4 pr-12 py-2.5 border-3 rounded-[18px] text-[#3C3A32] focus:outline-none transition-all ${
              isListening
                ? 'border-solid border-[#EE7A55] bg-[#FFF5F0] ring-4 ring-[#EE7A55]/30 animate-pulse'
                : 'border-dashed border-[#E4DCC4] bg-[#FDF9EC] focus:border-[#6FA83C] focus:border-solid'
            }`}
          />
          {/* 음성 검색 버튼 */}
          <button
            type="button"
            id="voice-search-btn"
            onClick={handleToggleVoiceSearch}
            disabled={disabled}
            title={isListening ? '말씀 끝내고 찾기' : '목소리로 말해서 찾기'}
            aria-label="음성 검색"
            className={`absolute right-2 p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              isListening
                ? 'bg-[#EE7A55] text-white shadow-md scale-110 ring-2 ring-[#EE7A55]/50'
                : 'bg-[#FDF9EC] text-[#B08968] hover:text-[#456F22] hover:bg-[#EEF7E2]'
            }`}
          >
            {isListening ? (
              <div className="flex items-center gap-1">
                <MicOff className="w-5 h-5 animate-pulse" />
              </div>
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>

        <button
          type="submit"
          id="go"
          disabled={disabled}
          className="font-jua text-2xl px-5 sm:px-6 py-2.5 rounded-[18px] bg-[#6FA83C] text-white shadow-[0_4px_0_#456F22] active:translate-y-[3px] active:shadow-[0_1px_0_#456F22] cursor-pointer hover:bg-[#669c36] disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
        >
          만들기
        </button>
      </form>

      {/* 실시간 음성 피드백 배너 */}
      {speechNotice && (
        <div
          id="speech-feedback"
          className={`mt-2.5 px-3 py-1.5 rounded-xl border font-jua text-base flex items-center justify-between transition-all ${
            isListening
              ? 'bg-[#FFF5F0] border-[#EE7A55] text-[#D9532B]'
              : 'bg-[#EEF7E2] border-[#6FA83C] text-[#456F22]'
          }`}
        >
          <div className="flex items-center gap-2">
            {isListening ? (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EE7A55] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#EE7A55]"></span>
              </span>
            ) : (
              <Volume2 className="w-4 h-4 text-[#6FA83C]" />
            )}
            <span>{speechNotice}</span>
          </div>

          {isListening && isSpeakingLive && (
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-3.5 bg-[#EE7A55] rounded-full animate-bounce"></span>
              <span className="w-1 h-5 bg-[#EE7A55] rounded-full animate-bounce [animation-delay:0.15s]"></span>
              <span className="w-1 h-2.5 bg-[#EE7A55] rounded-full animate-bounce [animation-delay:0.3s]"></span>
            </div>
          )}
        </div>
      )}

      {/* Preset Chips */}
      <div id="chips" className="chips flex flex-wrap gap-2 mt-3">
        {presetKeys.map((k) => {
          const isSelected = activeWord === k;
          return (
            <button
              key={k}
              type="button"
              id={`chip-${k}`}
              onClick={() => {
                setInputValue(k);
                onSelectWord(k);
              }}
              className={`font-gaegu font-bold text-xl sm:text-2xl px-3.5 py-1 rounded-full border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#EEF7E2] border-[#6FA83C] text-[#456F22] shadow-[0_2px_0_#6FA83C]'
                  : 'bg-[#FDF9EC] border-[#E4DCC4] text-[#3C3A32] hover:border-[#6FA83C]'
              }`}
            >
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
};
