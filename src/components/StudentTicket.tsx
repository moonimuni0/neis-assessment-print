import React from 'react';
import { AssessmentArea, AssessmentMeta, PrintSettings, StudentScore } from '../types';

interface StudentTicketProps {
  student: StudentScore;
  areas: AssessmentArea[];
  meta: AssessmentMeta;
  settings: PrintSettings;
}

export const StudentTicket: React.FC<StudentTicketProps> = ({
  student,
  areas,
  meta,
  settings,
}) => {
  const isCompact = settings.itemsPerPage === 4;
  const isSpacious = settings.itemsPerPage === 2;

  // 전체 만점 합계 계산
  const totalMaxScore = areas.reduce((sum, a) => sum + (a.maxScore || 0), 0);

  // 제목 구성
  const titleText = settings.customTitle || 
    `${meta.academicYear} ${meta.semester} [${meta.subject}] 수행평가 성적 확인표`;

  return (
    <div
      className={`student-ticket-container bg-white border border-slate-800 rounded-sm text-slate-900 flex flex-col justify-between ${
        isCompact ? 'p-2 text-xs' : isSpacious ? 'p-5 text-sm' : 'p-3 text-xs'
      }`}
      style={{
        boxSizing: 'border-box',
        // flex-1로 남은 공간을 균등 분할
        flex: '1 1 0%',
      }}
    >
      {/* 1. 상단 헤더: 타이틀 & 학교/과목 */}
      <div>
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1 mb-2">
          <div className="flex items-center gap-2">
            <h2 className={`font-bold tracking-tight text-slate-900 ${
              isCompact ? 'text-xs' : isSpacious ? 'text-base' : 'text-sm'
            }`}>
              {titleText}
            </h2>
          </div>
          {settings.showSubject && (
            <span className="text-slate-600 font-medium text-[11px]">
              {meta.schoolName} {meta.classroomInfo && `(${meta.classroomInfo})`}
            </span>
          )}
        </div>

        {/* 2. 학생 정보 바 */}
        <div className="flex items-center justify-between bg-slate-100 border border-slate-300 px-3 py-1 mb-2 font-medium">
          <div className="flex items-center gap-4">
            <span>
              <strong className="text-slate-700">반/번호:</strong>{' '}
              <span className="font-bold text-slate-900">
                {student.rawClassNum || `${student.classRoom}반 ${student.studentNumber}번`}
              </span>
            </span>
            <span>
              <strong className="text-slate-700">성명:</strong>{' '}
              <span className="font-bold text-slate-900 text-sm tracking-wider">
                {student.name}
              </span>
            </span>
          </div>
          <div className="text-slate-600 text-[11px]">
            확인일: {meta.date || new Date().toLocaleDateString('ko-KR')}
          </div>
        </div>

        {/* 3. 성적 표 */}
        <table className="w-full border-collapse border border-slate-800 text-center mb-2">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-800">
              <th className="border-r border-slate-800 py-1 px-1 font-semibold text-slate-700 w-12">
                구분
              </th>
              {areas.map((area) => (
                <th
                  key={area.id}
                  className="border-r border-slate-800 py-1 px-1 font-semibold text-slate-800 text-[11px] leading-tight"
                >
                  <div className="break-keep line-clamp-2 max-w-[130px] mx-auto text-[11px] leading-snug" title={area.name}>
                    {area.name}
                  </div>
                  {settings.showMaxScore && area.maxScore !== undefined && (
                    <span className="text-[10px] text-slate-500 font-normal block mt-0.5">
                      ({area.maxScore % 1 === 0 ? area.maxScore : area.maxScore}점
                      {area.weight !== undefined ? `/${area.weight % 1 === 0 ? area.weight : area.weight}%` : ''})
                    </span>
                  )}
                </th>
              ))}
              <th className="py-1 px-2 font-bold text-slate-900 bg-slate-200 w-16">
                총점
                {settings.showMaxScore && totalMaxScore > 0 && (
                  <span className="text-[10px] text-slate-600 font-normal block mt-0.5">
                    ({totalMaxScore % 1 === 0 ? totalMaxScore : totalMaxScore}점)
                  </span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-r border-slate-800 py-1.5 px-1 font-medium bg-slate-50 text-slate-700">
                점수
              </td>
              {areas.map((area) => {
                const score = student.scores[area.id];
                return (
                  <td
                    key={area.id}
                    className="border-r border-slate-800 py-1.5 px-1 font-semibold text-slate-900"
                  >
                    {score !== null && score !== undefined ? (
                      <span>{score % 1 === 0 ? score.toString() : parseFloat(score.toFixed(2)).toString()}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                );
              })}
              <td className="py-1.5 px-2 font-black text-slate-950 bg-slate-100 text-sm">
                {student.totalScore !== undefined
                  ? (student.totalScore % 1 === 0 ? student.totalScore.toString() : parseFloat(student.totalScore.toFixed(2)).toString())
                  : '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. 하단 안내 및 서명 확인란 */}
      <div className="border-t border-slate-200 pt-1.5 mt-auto">
        <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1.5">
          <span>{settings.noticeText}</span>
          {meta.teacher && (
            <span className="text-[10px] text-slate-500">
              담당교사: {meta.teacher}
            </span>
          )}
        </div>

        {/* 서명란 */}
        {settings.showSignature && (
          <div className="flex items-center justify-end gap-6 text-xs text-slate-800 pt-1 border-t border-dashed border-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">학생 확인:</span>
              <div className="inline-block border-b border-slate-900 w-24 text-center text-slate-400 font-normal">
                (서명/인)
              </div>
            </div>

            {settings.showParentSignature && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">보호자 확인:</span>
                <div className="inline-block border-b border-slate-900 w-24 text-center text-slate-400 font-normal">
                  (서명/인)
                </div>
              </div>
            )}

            {settings.showTeacherSignature && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">교사 확인:</span>
                <div className="inline-block border-b border-slate-900 w-20 text-center text-slate-400 font-normal">
                  (인)
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
