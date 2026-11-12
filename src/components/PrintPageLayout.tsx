import React from 'react';
import { AssessmentArea, AssessmentMeta, PrintSettings, StudentScore } from '../types';
import { StudentTicket } from './StudentTicket';
import { CutLine } from './CutLine';

interface PrintPageLayoutProps {
  students: StudentScore[];
  areas: AssessmentArea[];
  meta: AssessmentMeta;
  settings: PrintSettings;
  isPreview?: boolean;
}

export const PrintPageLayout: React.FC<PrintPageLayoutProps> = ({
  students,
  areas,
  meta,
  settings,
  isPreview = false,
}) => {
  // itemsPerPage (2, 3, 4) 단위로 학생 묶음 생성
  const pageSize = settings.itemsPerPage;
  const pages: StudentScore[][] = [];

  for (let i = 0; i < students.length; i += pageSize) {
    pages.push(students.slice(i, i + pageSize));
  }

  return (
    <div className="print-layout-root w-full">
      {pages.map((pageStudents, pageIndex) => (
        <div
          key={`page_${pageIndex}`}
          className={`relative ${
            isPreview
              ? 'a4-preview-page border border-slate-300 shadow-md mb-8'
              : 'a4-print-page'
          }`}
        >
          {/* 화면 미리보기 시 상단 페이지 번호 배지 (인쇄 시 숨김) */}
          {isPreview && (
            <div className="no-print -mt-6 -ml-4 mb-2 text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span>A4 용지 #{pageIndex + 1}</span>
              <span>총 {pages.length}페이지 중 {pageIndex + 1}페이지 ({pageStudents.length}명)</span>
            </div>
          )}

          {/* 한 페이지 내 학생들 배치 */}
          <div className="h-full flex flex-col justify-between flex-1 gap-2">
            {pageStudents.map((student, idx) => {
              const isLastOnPage = idx === pageStudents.length - 1;
              return (
                <React.Fragment key={student.id}>
                  <StudentTicket
                    student={student}
                    areas={areas}
                    meta={meta}
                    settings={settings}
                  />
                  {/* 페이지 내 마지막 학생이 아니면 절취선 렌더링 */}
                  {!isLastOnPage && <CutLine />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
