import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PRESETS } from '../presets';
import { Mic, MicOff, Volume2, Loader2, Square } from 'lucide-react';

interface SearchAndChipsProps {
  onSelectWord: (word: string) => void;
  activeWord: string;
  disabled?: boolean;
}

/**
 * Blob을 base64 문자열로 변환하는 도우미 함수
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = (reader.result as string) || '';
      const base64 = res.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 아이들의 자연어 발화에서 핵심 낱말을 정밀하게 추출하고
 * 추천 모양(프리셋)과 스마트 매칭해 주는 도우미 함수
 */
function extractCoreWord(raw: string): string {
  let text = raw.trim().replace(/[.,?!~^*_#@'"「」]/g, '');

  // 1. 추천 목록에 있는 단어가 포함되어 있으면 즉시 해당 단어로 확정
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [isSpeakingLive, setIsSpeakingLive] = useState(false);

  // 음성 엔진 관리 Refs
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<any>(null);
  const finishTimeoutRef = useRef<any>(null);
  const animFrameRef = useRef<any>(null);
  const latestWordRef = useRef<string>('');
  const hasEverFailedWebSpeech = useRef<boolean>(false);

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
    if (animFrameRef.current) {
      clearTimeout(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const stopAllRecognition = useCallback(() => {
    stopAllTimers();

    // 1. Web Speech API 중지
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    // 2. MediaRecorder 중지
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;

    // 3. 마이크 스트림 트랙 완벽 해제 (안드로이드/갤럭시 패드 마이크 점유 방지)
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore
      }
      audioStreamRef.current = null;
    }

    // 4. AudioContext 해제
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }

    setIsListening(false);
    setIsSpeakingLive(false);
  }, [stopAllTimers]);

  useEffect(() => {
    return () => {
      stopAllRecognition();
    };
  }, [stopAllRecognition]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    stopAllRecognition();
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
        stopAllRecognition();
        return;
      }

      setInputValue(clean);
      setSpeechNotice(`"${clean}" 모양을 만들어요! ✨`);
      stopAllRecognition();
      onSelectWord(clean);
      setTimeout(() => setSpeechNotice(null), 2500);
    },
    [onSelectWord, stopAllRecognition]
  );

  /**
   * 갤럭시 패드/삼성 인터넷 및 모바일 기기를 위한 고성능 AI 음성 녹음 인식 엔진
   */
  const startMediaRecorder = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setSpeechNotice('이 기기에서는 음성 녹음을 지원하지 않아요.');
        setTimeout(() => setSpeechNotice(null), 3000);
        return;
      }

      setSpeechNotice('마이크를 켜고 있어요... 🎙️');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      audioStreamRef.current = stream;

      // 지원되는 최적 오디오 포맷 감지
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // 녹음 완료 시 즉시 마이크 장치 해제
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((t) => t.stop());
          audioStreamRef.current = null;
        }
        if (audioContextRef.current) {
          try {
            audioContextRef.current.close();
          } catch {
            // ignore
          }
          audioContextRef.current = null;
        }

        setIsListening(false);
        setIsSpeakingLive(false);

        const chunks = audioChunksRef.current;
        if (chunks.length === 0) {
          setSpeechNotice('목소리가 녹음되지 않았어요. 다시 시도해 주세요.');
          setTimeout(() => setSpeechNotice(null), 2500);
          return;
        }

        const audioBlob = new Blob(chunks, {
          type: mediaRecorder.mimeType || mimeType || 'audio/webm',
        });

        if (audioBlob.size < 400) {
          setSpeechNotice('목소리가 들리지 않았어요. 마이크 가까이에서 말씀해 주세요.');
          setTimeout(() => setSpeechNotice(null), 2500);
          return;
        }

        setIsAnalyzing(true);
        setSpeechNotice('목소리를 귀 기울여 알아듣고 있어요... 🤖');

        try {
          const base64 = await blobToBase64(audioBlob);
          const res = await fetch('/api/transcribe-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64,
              mimeType: mediaRecorder.mimeType || mimeType || 'audio/webm',
            }),
          });

          const data = await res.json();
          setIsAnalyzing(false);

          if (data.ok && data.word) {
            commitRecognizedWord(data.word);
          } else {
            setSpeechNotice('소리를 잘 듣지 못했어요. 다시 말씀해 보세요 👂');
            setTimeout(() => setSpeechNotice(null), 2500);
          }
        } catch (err) {
          console.error('Failed to transcribe audio:', err);
          setIsAnalyzing(false);
          setSpeechNotice('음성 분석 중 문제가 생겼어요. 다시 시도해 주세요.');
          setTimeout(() => setSpeechNotice(null), 2500);
        }
      };

      // 실시간 음량 감지 (어린이가 말할 때 귀여운 파동 애니메이션)
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          let spokeOnce = false;
          let silenceTicks = 0;

          const checkVolume = () => {
            if (!audioContextRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
              return;
            }
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;

            if (avg > 14) {
              setIsSpeakingLive(true);
              spokeOnce = true;
              silenceTicks = 0;
            } else {
              setIsSpeakingLive(false);
              if (spokeOnce) {
                silenceTicks++;
                // 아이가 말을 마치고 약 1.4초 동안 조용하면 자동으로 녹음 종료 및 분석
                if (silenceTicks > 28) {
                  if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                  }
                  return;
                }
              }
            }
            animFrameRef.current = setTimeout(checkVolume, 50);
          };
          checkVolume();
        }
      } catch {
        // AudioContext는 시각 효과용이므로 실패해도 녹음은 정상 진행
      }

      mediaRecorder.start(250);
      setIsListening(true);
      setSpeechNotice('말씀해 주세요! 귀 기울여 듣고 있어요 👂 (마치면 다시 터치)');

      // 최대 4.5초 후 자동 종료
      stopAllTimers();
      silenceTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 4500);
    } catch (err: any) {
      console.error('Microphone recording error:', err);
      setIsListening(false);
      setIsAnalyzing(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setSpeechNotice('마이크 사용 권한을 허용해 주세요 (주소창 왼쪽 자물쇠 확인) 🎙️');
      } else {
        setSpeechNotice('마이크를 시작할 수 없어요. 브라우저 설정을 확인해 주세요.');
      }
      setTimeout(() => setSpeechNotice(null), 3000);
    }
  }, [commitRecognizedWord, stopAllTimers]);

  const handleToggleVoiceSearch = async () => {
    if (disabled || isAnalyzing) return;

    // 이미 듣고 있는 중이면 수동 종료 및 결과 확정
    if (isListening) {
      // 1. Web Speech가 동작 중이었고 캡처된 단어가 있으면 커밋
      if (recognitionRef.current && latestWordRef.current.trim()) {
        commitRecognizedWord(latestWordRef.current);
        return;
      }

      // 2. MediaRecorder가 동작 중이면 즉시 녹음 종료하여 전송 분석
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        return;
      }

      stopAllRecognition();
      setSpeechNotice(null);
      return;
    }

    // 갤럭시 패드 / 삼성 인터넷 감지
    const isSamsungBrowser =
      typeof navigator !== 'undefined' &&
      (/SamsungBrowser/i.test(navigator.userAgent) ||
        /Samsung/i.test(navigator.vendor || '') ||
        /SM-T|SM-P|GT-|Galaxy Tab/i.test(navigator.userAgent));

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // 삼성 인터넷이거나 Web Speech API가 없거나 이전에 실패했던 환경은
    // 100% 안정적인 AI MediaRecorder 엔진을 우선 실행
    if (isSamsungBrowser || !SpeechRecognition || hasEverFailedWebSpeech.current) {
      await startMediaRecorder();
      return;
    }

    // 데스크톱 Chrome 등 Web Speech API 지원 브라우저 실행
    try {
      stopAllRecognition();

      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 3;

      latestWordRef.current = '';

      recognition.onstart = () => {
        setIsListening(true);
        setIsSpeakingLive(false);
        setSpeechNotice('말씀해 주세요! 귀 기울여 듣고 있어요 👂');

        stopAllTimers();
        silenceTimerRef.current = setTimeout(() => {
          if (!latestWordRef.current.trim()) {
            setSpeechNotice('목소리가 들리지 않았어요. 마이크 가까이에서 다시 말씀해 주세요.');
            stopAllRecognition();
            setTimeout(() => setSpeechNotice(null), 3000);
          }
        }, 5000);
      };

      recognition.onspeechstart = () => {
        setIsSpeakingLive(true);
      };

      recognition.onresult = (event: any) => {
        setIsSpeakingLive(true);

        let currentBest = '';
        let isFinalResult = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            isFinalResult = true;
          }

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

          if (isFinalResult) {
            stopAllTimers();
            commitRecognizedWord(currentBest);
            return;
          }

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
        hasEverFailedWebSpeech.current = true;

        // 권한 거부가 아닌 서비스/네트워크/오디오 캡처 에러 시 MediaRecorder로 부드럽게 자동 전환
        if (
          event.error === 'service-not-allowed' ||
          event.error === 'network' ||
          event.error === 'audio-capture' ||
          event.error === 'not-allowed'
        ) {
          stopAllRecognition();
          startMediaRecorder();
          return;
        }

        if (event.error === 'no-speech') {
          setSpeechNotice('목소리가 들리지 않았어요. 마이크 가까이에서 말씀해 주세요.');
        } else {
          setSpeechNotice('음성을 인식하지 못했어요. 다시 시도해 주세요.');
        }
        stopAllRecognition();
        setTimeout(() => setSpeechNotice(null), 3000);
      };

      recognition.onend = () => {
        if (latestWordRef.current.trim()) {
          commitRecognizedWord(latestWordRef.current);
        } else {
          stopAllRecognition();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Direct SpeechRecognition failed, switching to MediaRecorder:', err);
      hasEverFailedWebSpeech.current = true;
      await startMediaRecorder();
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
            placeholder={
              isAnalyzing
                ? '목소리를 분석하고 있어요…'
                : isListening
                ? '지금 말씀해 주세요…'
                : '예: 기차, 사과, 토끼'
            }
            aria-label="만들고 싶은 것"
            disabled={disabled || isAnalyzing}
            className={`w-full min-w-0 font-gaegu text-2xl font-bold pl-4 pr-12 py-2.5 border-3 rounded-[18px] text-[#3C3A32] focus:outline-none transition-all ${
              isListening
                ? 'border-solid border-[#EE7A55] bg-[#FFF5F0] ring-4 ring-[#EE7A55]/30 animate-pulse'
                : isAnalyzing
                ? 'border-solid border-[#6FA83C] bg-[#F4F9EE] ring-4 ring-[#6FA83C]/30'
                : 'border-dashed border-[#E4DCC4] bg-[#FDF9EC] focus:border-[#6FA83C] focus:border-solid'
            }`}
          />
          {/* 음성 검색 버튼 */}
          <button
            type="button"
            id="voice-search-btn"
            onClick={handleToggleVoiceSearch}
            disabled={disabled || isAnalyzing}
            title={
              isAnalyzing
                ? '분석 중…'
                : isListening
                ? '말씀 끝내고 찾기 (터치)'
                : '목소리로 말해서 찾기'
            }
            aria-label="음성 검색"
            className={`absolute right-2 p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center min-w-[42px] min-h-[42px] ${
              isAnalyzing
                ? 'bg-[#6FA83C] text-white shadow-md'
                : isListening
                ? 'bg-[#EE7A55] text-white shadow-md scale-105 ring-4 ring-[#EE7A55]/40'
                : 'bg-[#FDF9EC] text-[#B08968] hover:text-[#456F22] hover:bg-[#EEF7E2] active:scale-95'
            }`}
          >
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isListening ? (
              <div className="flex items-center gap-1">
                <Square className="w-4 h-4 fill-white animate-pulse" />
              </div>
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>

        <button
          type="submit"
          id="go"
          disabled={disabled || isAnalyzing}
          className="font-jua text-2xl px-5 sm:px-6 py-2.5 rounded-[18px] bg-[#6FA83C] text-white shadow-[0_4px_0_#456F22] active:translate-y-[3px] active:shadow-[0_1px_0_#456F22] cursor-pointer hover:bg-[#669c36] disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
        >
          만들기
        </button>
      </form>

      {/* 실시간 음성 피드백 배너 */}
      {speechNotice && (
        <div
          id="speech-feedback"
          className={`mt-2.5 px-3.5 py-2 rounded-xl border font-jua text-base flex items-center justify-between transition-all ${
            isAnalyzing
              ? 'bg-[#EEF7E2] border-[#6FA83C] text-[#456F22]'
              : isListening
              ? 'bg-[#FFF5F0] border-[#EE7A55] text-[#D9532B]'
              : 'bg-[#EEF7E2] border-[#6FA83C] text-[#456F22]'
          }`}
        >
          <div className="flex items-center gap-2">
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 text-[#6FA83C] animate-spin" />
            ) : isListening ? (
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
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-3.5 bg-[#EE7A55] rounded-full animate-bounce"></span>
              <span className="w-1.5 h-5 bg-[#EE7A55] rounded-full animate-bounce [animation-delay:0.15s]"></span>
              <span className="w-1.5 h-2.5 bg-[#EE7A55] rounded-full animate-bounce [animation-delay:0.3s]"></span>
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
