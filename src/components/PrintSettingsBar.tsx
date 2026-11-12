import React, { useState } from 'react';
import { PrintSettings } from '../types';
import { Printer, Settings, Sliders, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';

interface PrintSettingsBarProps {
  settings: PrintSettings;
  onChange: (newSettings: PrintSettings) => void;
  totalStudents: number;
  onPrint: () => void;
}

export const PrintSettingsBar: React.FC<PrintSettingsBarProps> = ({
  settings,
  onChange,
  totalStudents,
  onPrint,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalPages = Math.ceil(totalStudents / settings.itemsPerPage);

  const updateSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="no-print bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden mb-6 transition-all">
      {/* 기본 제어 바 */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm md:text-base">A4 출력 설정</h3>
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                총 {totalStudents}명 / A4 {totalPages}장
              </span>
            </div>
            <p className="text-xs text-slate-500">한 페이지당 인원수 및 서식 세부옵션을 지정하세요.</p>
          </div>
        </div>

        {/* 간편 설정 컨트롤들 */}
        <div className="flex items-center flex-wrap gap-2">
          {/* 한 페이지당 인원수 선택 버튼 그룹 */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
            {([2, 3, 4] as const).map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => updateSetting('itemsPerPage', count)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  settings.itemsPerPage === count
                    ? 'bg-white text-indigo-600 shadow-xs font-bold border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1장에 {count}명 {count === 3 && '(권장)'}
              </button>
            ))}
          </div>

          {/* 세부 옵션 열기/닫기 */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>상세 옵션</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* 인쇄하기 버튼 */}
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm hover:shadow transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>A4 인쇄하기</span>
          </button>
        </div>
      </div>

      {/* 펼쳐지는 상세 옵션 */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 서명란 체크박스 */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">확인 서명란 옵션</label>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => updateSetting('showSignature', !settings.showSignature)}
                  className="flex items-center gap-2 text-slate-700 hover:text-slate-950 text-left"
                >
                  {settings.showSignature ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>학생 확인 서명란 표시</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSetting('showParentSignature', !settings.showParentSignature)}
                  className="flex items-center gap-2 text-slate-700 hover:text-slate-950 text-left"
                >
                  {settings.showParentSignature ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>보호자 확인 서명란 표시</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSetting('showTeacherSignature', !settings.showTeacherSignature)}
                  className="flex items-center gap-2 text-slate-700 hover:text-slate-950 text-left"
                >
                  {settings.showTeacherSignature ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>담당교사 확인란 표시</span>
                </button>
              </div>
            </div>

            {/* 표시 요소 체크박스 */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">표시 항목</label>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => updateSetting('showMaxScore', !settings.showMaxScore)}
                  className="flex items-center gap-2 text-slate-700 hover:text-slate-950 text-left"
                >
                  {settings.showMaxScore ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>영역별 만점 및 반영비율 표시</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSetting('showSubject', !settings.showSubject)}
                  className="flex items-center gap-2 text-slate-700 hover:text-slate-950 text-left"
                >
                  {settings.showSubject ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>학교명 및 강의실/반 정보 표시</span>
                </button>
              </div>
            </div>

            {/* 안내 문구 커스텀 */}
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <label className="font-semibold text-slate-700 block">하단 안내 문구</label>
              <input
                type="text"
                value={settings.noticeText}
                onChange={(e) => updateSetting('noticeText', e.target.value)}
                placeholder="예: 위 점수를 확인하고 서명하여 제출하세요."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                각 학생 성적표 하단에 인쇄되는 이의신청 및 확인 안내 문구입니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
