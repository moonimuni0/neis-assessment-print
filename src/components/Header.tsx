import React from 'react';
import { AssessmentData } from '../types';
import { Printer, Upload, Edit3, Table, Eye, Sparkles } from 'lucide-react';

interface HeaderProps {
  data: AssessmentData | null;
  activeTab: 'table' | 'preview';
  onTabChange: (tab: 'table' | 'preview') => void;
  onOpenUpload: () => void;
  onOpenMetaEdit: () => void;
  onLoadSample: () => void;
  onPrint: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  data,
  activeTab,
  onTabChange,
  onOpenUpload,
  onOpenMetaEdit,
  onLoadSample,
  onPrint,
}) => {
  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* 로고 & 타이틀 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex items-center justify-center font-black text-lg shadow-sm">
              성
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-base sm:text-lg">
                  수행평가 일람표 성적표 출력기
                </h1>
                <span className="hidden sm:inline-block bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-sm">
                  NEIS 완벽 호환
                </span>
              </div>
              {data && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    {data.meta.schoolName}
                  </span>
                  <span>•</span>
                  <span>{data.meta.academicYear} {data.meta.semester}</span>
                  <span>•</span>
                  <span className="font-semibold text-indigo-600">
                    {data.meta.subject}
                  </span>
                  {data.meta.classroomInfo && (
                    <>
                      <span>•</span>
                      <span>{data.meta.classroomInfo}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 중앙: 탭 전환 (데이터가 있을 때만) */}
          {data && (
            <div className="hidden md:flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => onTabChange('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'table'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>성적 목록표</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>A4 인쇄 미리보기</span>
              </button>
            </div>
          )}

          {/* 우측 버튼 액션들 */}
          <div className="flex items-center gap-2">
            {data ? (
              <>
                <button
                  type="button"
                  onClick={onOpenMetaEdit}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  title="과목명, 학교명, 평가영역 수정"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>정보 수정</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenUpload}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">새 파일</span>
                </button>

                <button
                  type="button"
                  onClick={onPrint}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>A4 인쇄</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onLoadSample}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>예시 데이터 불러오기</span>
              </button>
            )}
          </div>
        </div>

        {/* 모바일용 탭 전환 */}
        {data && (
          <div className="flex md:hidden border-t border-slate-100 py-2 justify-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => onTabChange('table')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-medium ${
                activeTab === 'table' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>성적 목록표</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('preview')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-medium ${
                activeTab === 'preview' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>A4 인쇄 미리보기</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
