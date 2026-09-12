import React from 'react';
import { HelpLevel } from '../types';
import { Printer, Volume2, VolumeX } from 'lucide-react';

interface LevelSelectorProps {
  level: HelpLevel;
  onLevelChange: (level: HelpLevel) => void;
  onPrint: () => void;
  onSpeak: () => void;
  isSpeaking: boolean;
  hasShapes: boolean;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  level,
  onLevelChange,
  onPrint,
  onSpeak,
  isSpeaking,
  hasShapes
}) => {
  const levels = [
    {
      id: 'shadow' as HelpLevel,
      stepNumber: '1',
      title: '그림자만 보기',
      desc: '모양을 스스로 찾아 놓아요'
    },
    {
      id: 'full' as HelpLevel,
      stepNumber: '2',
      title: '완성 그림 보기',
      desc: '어려우면 다 만든 그림을 봐요'
    }
  ];

  return (
    <div
      id="levels-card"
      className="card levels-card bg-[#FFFFFF] border-3 border-[#E4DCC4] rounded-[26px] p-4 shadow-[0_4px_0_#E4DCC4] mt-4"
    >
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-jua text-xl text-[#B08968] m-0">도움 단계</h2>
        <div className="flex items-center gap-2">
          {hasShapes && (
            <button
              type="button"
              id="speak-btn"
              onClick={onSpeak}
              className={`flex items-center gap-1 font-jua text-sm px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                isSpeaking
                  ? 'bg-[#EEF7E2] text-[#456F22] border-[#6FA83C]'
                  : 'bg-[#FDF9EC] text-[#3C3A32] border-[#E4DCC4] hover:border-[#6FA83C]'
              }`}
              title="소리로 안내 듣기"
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isSpeaking ? '멈추기' : '읽어주기'}</span>
            </button>
          )}

          <button
            type="button"
            id="print-btn"
            onClick={onPrint}
            className="flex items-center gap-1 font-jua text-sm bg-[#FDF9EC] text-[#3C3A32] px-2.5 py-1 rounded-full border border-[#E4DCC4] hover:border-[#6FA83C] cursor-pointer transition-colors"
            title="수업용 활동지로 인쇄하기"
          >
            <Printer className="w-3.5 h-3.5 text-[#B08968]" />
            <span>학습지 인쇄</span>
          </button>
        </div>
      </div>

      <div className="levels grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {levels.map((item) => {
          const isActive = level === item.id;
          return (
            <button
              key={item.id}
              type="button"
              id={`level-btn-${item.id}`}
              onClick={() => onLevelChange(item.id)}
              aria-pressed={isActive}
              className={`flex items-center gap-3 font-gaegu font-bold text-xl sm:text-2xl p-3 rounded-[18px] text-left border-2 w-full transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#EEF7E2] border-[#6FA83C] shadow-[inset_0_0_0_2px_#6FA83C]'
                  : 'bg-[#FDF9EC] border-[#E4DCC4] hover:border-[#6FA83C]'
              }`}
            >
              <span
                className={`font-jua text-sm text-white rounded-full px-2.5 py-0.5 shrink-0 ${
                  isActive ? 'bg-[#6FA83C]' : 'bg-[#B08968]'
                }`}
              >
                {item.stepNumber}
              </span>
              <span className="flex-1">
                <span className="block text-[#3C3A32] leading-tight">{item.title}</span>
                <small className="block font-normal text-base sm:text-lg text-[#B08968] leading-tight mt-0.5">
                  {item.desc}
                </small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
