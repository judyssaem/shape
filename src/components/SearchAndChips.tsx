import React, { useState, useRef, useEffect } from 'react';
import { PRESETS } from '../presets';
import { Mic, MicOff } from 'lucide-react';

interface SearchAndChipsProps {
  onSelectWord: (word: string) => void;
  activeWord: string;
  disabled?: boolean;
}

export const SearchAndChips: React.FC<SearchAndChipsProps> = ({
  onSelectWord,
  activeWord,
  disabled
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputValue.trim();
    if (clean) {
      onSelectWord(clean);
    }
  };

  const handleToggleVoiceSearch = () => {
    if (disabled) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechNotice('이 브라우저는 음성 검색을 지원하지 않아요.');
      setTimeout(() => setSpeechNotice(null), 3000);
      return;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechNotice('귀 기울여 듣고 있어요… 👂');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        // 자연어 어미 정리 (예: "비행기 만들어줘" -> "비행기", 마침표 제거)
        const cleaned = transcript
          .replace(/[.?!,]/g, '')
          .replace(/만들어(줘|주세요|봐|라)?/g, '')
          .replace(/그려(줘|주세요|봐|라)?/g, '')
          .trim();

        if (cleaned) {
          setInputValue(cleaned);
          setSpeechNotice(`"${cleaned}" 모양을 찾아요! ✨`);
          onSelectWord(cleaned);
        } else {
          setSpeechNotice('소리를 잘 듣지 못했어요.');
        }

        setTimeout(() => setSpeechNotice(null), 2500);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event?.error);
        if (event.error === 'not-allowed') {
          setSpeechNotice('마이크 사용 권한을 허용해 주세요 🎙️');
        } else if (event.error === 'no-speech') {
          setSpeechNotice('목소리가 들리지 않았어요. 다시 말해 볼까요?');
        } else {
          setSpeechNotice('음성을 인식하지 못했어요. 다시 시도해 주세요.');
        }
        setIsListening(false);
        setTimeout(() => setSpeechNotice(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setSpeechNotice('음성 검색을 시작할 수 없습니다.');
      setIsListening(false);
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
            placeholder={isListening ? '말씀해 주세요…' : '예: 기차'}
            aria-label="만들고 싶은 것"
            disabled={disabled}
            className={`w-full min-w-0 font-gaegu text-2xl font-bold pl-4 pr-12 py-2.5 border-3 rounded-[18px] text-[#3C3A32] focus:outline-none transition-all ${
              isListening
                ? 'border-solid border-[#EE7A55] bg-[#FFF5F0] ring-3 ring-[#EE7A55]/30'
                : 'border-dashed border-[#E4DCC4] bg-[#FDF9EC] focus:border-[#6FA83C] focus:border-solid'
            }`}
          />
          {/* Voice Search Button inside input */}
          <button
            type="button"
            id="voice-search-btn"
            onClick={handleToggleVoiceSearch}
            disabled={disabled}
            title={isListening ? '음성 검색 중지' : '목소리로 말해서 찾기'}
            aria-label="음성 검색"
            className={`absolute right-2 p-2 rounded-xl transition-all cursor-pointer ${
              isListening
                ? 'bg-[#EE7A55] text-white shadow-sm scale-105 animate-pulse'
                : 'bg-[#FDF9EC] text-[#B08968] hover:text-[#456F22] hover:bg-[#EEF7E2]'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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

      {/* Voice feedback banner */}
      {speechNotice && (
        <div
          id="speech-feedback"
          className="mt-2.5 px-3 py-1.5 rounded-xl bg-[#EEF7E2] border border-[#6FA83C] text-[#456F22] font-jua text-base flex items-center gap-2 animate-fade-in"
        >
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#6FA83C] animate-ping"></span>
          <span>{speechNotice}</span>
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
