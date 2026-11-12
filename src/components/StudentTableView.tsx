import React, { useState, useMemo } from 'react';
import { AssessmentArea, AssessmentData } from '../types';
import { Search, ArrowUpDown, Award, Users, BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react';

interface StudentTableViewProps {
  data: AssessmentData;
  selectedStudentIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export const StudentTableView: React.FC<StudentTableViewProps> = ({
  data,
  selectedStudentIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'num' | 'name' | 'total'>('num');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 통계 계산
  const stats = useMemo(() => {
    if (data.students.length === 0) return { avg: 0, max: 0, min: 0, count: 0 };
    const totals = data.students.map((s) => s.totalScore || 0);
    const sum = totals.reduce((a, b) => a + b, 0);
    const avg = sum / totals.length;
    const max = Math.max(...totals);
    const min = Math.min(...totals);
    return {
      count: totals.length,
      avg: Number(avg.toFixed(1)),
      max,
      min,
    };
  }, [data.students]);

  // 검색 및 정렬
  const filteredStudents = useMemo(() => {
    return data.students
      .filter((s) => {
        const term = searchTerm.toLowerCase();
        return (
          s.name.toLowerCase().includes(term) ||
          s.rawClassNum.includes(term) ||
          s.studentNumber.includes(term)
        );
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'name') {
          comp = a.name.localeCompare(b.name, 'ko');
        } else if (sortField === 'total') {
          comp = (a.totalScore || 0) - (b.totalScore || 0);
        } else {
          // num (반/번호)
          const numA = parseInt(a.studentNumber) || 0;
          const numB = parseInt(b.studentNumber) || 0;
          comp = numA - numB;
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [data.students, searchTerm, sortField, sortOrder]);

  const handleSort = (field: 'num' | 'name' | 'total') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'total' ? 'desc' : 'asc');
    }
  };

  const isAllSelected = data.students.length > 0 && selectedStudentIds.size === data.students.length;

  return (
    <div className="space-y-6">
      {/* 통계 요약 카드 4종 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">전체 학생수</div>
            <div className="text-xl font-bold text-slate-900">{stats.count}명</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">학급 평균</div>
            <div className="text-xl font-bold text-slate-900">{stats.avg}점</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">최고 득점</div>
            <div className="text-xl font-bold text-slate-900">{stats.max}점</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">최저 득점</div>
            <div className="text-xl font-bold text-slate-900">{stats.min}점</div>
          </div>
        </div>
      </div>

      {/* 테이블 컨트롤 (검색, 선택 제어) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="이름 또는 번호로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {filteredStudents.length}명 검색됨
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            className="px-3 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className={`w-4 h-4 ${isAllSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>{isAllSelected ? '선택 전체 해제' : '전체 학생 선택'}</span>
          </button>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600 font-medium">
            인쇄 대상: <strong className="text-indigo-600">{selectedStudentIds.size}</strong>명
          </span>
        </div>
      </div>

      {/* 학생 목록 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                <th className="py-3 px-4 w-12 text-center">선택</th>
                <th
                  onClick={() => handleSort('num')}
                  className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition-colors w-24"
                >
                  <div className="flex items-center gap-1">
                    <span>반/번호</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition-colors w-32"
                >
                  <div className="flex items-center gap-1">
                    <span>성명</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                {data.areas.map((area: AssessmentArea) => (
                  <th key={area.id} className="py-3 px-3 text-center text-xs">
                    <div className="truncate max-w-[130px]" title={area.name}>
                      {area.name}
                    </div>
                    {area.maxScore && (
                      <span className="text-[10px] text-slate-400 font-normal block">
                        (만점 {area.maxScore}점)
                      </span>
                    )}
                  </th>
                ))}
                <th
                  onClick={() => handleSort('total')}
                  className="py-3 px-4 text-center cursor-pointer hover:text-indigo-600 transition-colors w-24 bg-slate-100/70"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>총점</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={4 + data.areas.length}
                    className="py-8 text-center text-slate-400 text-sm"
                  >
                    일치하는 학생이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = selectedStudentIds.has(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(student.id)}
                          className="w-4 h-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 font-medium">
                        {student.rawClassNum || `${student.classRoom}/${student.studentNumber}`}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {student.name}
                      </td>
                      {data.areas.map((area: AssessmentArea) => {
                        const score = student.scores[area.id];
                        return (
                          <td key={area.id} className="py-3 px-3 text-center font-medium">
                            {score !== null && score !== undefined ? (
                              <span
                                className={
                                  area.maxScore && score === area.maxScore
                                    ? 'text-indigo-600 font-bold'
                                    : 'text-slate-800'
                                }
                              >
                                {Number(score).toFixed(score % 1 === 0 ? 0 : 1)}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 text-center font-black text-slate-950 bg-slate-50">
                        {student.totalScore !== undefined
                          ? Number(student.totalScore).toFixed(
                              student.totalScore % 1 === 0 ? 0 : 1
                            )
                          : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
