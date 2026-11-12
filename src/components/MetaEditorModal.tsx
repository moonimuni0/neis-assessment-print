import React, { useState } from 'react';
import { AssessmentArea, AssessmentMeta } from '../types';
import { X, Check, Plus, Trash2 } from 'lucide-react';

interface MetaEditorModalProps {
  meta: AssessmentMeta;
  areas: AssessmentArea[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (newMeta: AssessmentMeta, newAreas: AssessmentArea[]) => void;
}

export const MetaEditorModal: React.FC<MetaEditorModalProps> = ({
  meta,
  areas,
  isOpen,
  onClose,
  onSave,
}) => {
  const [editedMeta, setEditedMeta] = useState<AssessmentMeta>({ ...meta });
  const [editedAreas, setEditedAreas] = useState<AssessmentArea[]>([...areas]);

  if (!isOpen) return null;

  const handleAreaChange = (index: number, field: keyof AssessmentArea, value: any) => {
    const updated = [...editedAreas];
    updated[index] = { ...updated[index], [field]: value };
    setEditedAreas(updated);
  };

  const handleAddArea = () => {
    setEditedAreas([
      ...editedAreas,
      {
        id: `area_${Date.now()}`,
        name: `새 평가 영역 ${editedAreas.length + 1}`,
        maxScore: 20,
      },
    ]);
  };

  const handleRemoveArea = (index: number) => {
    setEditedAreas(editedAreas.filter((_, idx) => idx !== index));
  };

  const handleSave = () => {
    onSave(editedMeta, editedAreas);
    onClose();
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 모달 헤더 */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-base">과목 정보 및 평가 영역 수정</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm">
          {/* 기본 정보 */}
          <div>
            <h4 className="font-semibold text-slate-700 mb-3 text-xs uppercase tracking-wider">
              기본 정보
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">학교명</label>
                <input
                  type="text"
                  value={editedMeta.schoolName}
                  onChange={(e) => setEditedMeta({ ...editedMeta, schoolName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">교과목</label>
                <input
                  type="text"
                  value={editedMeta.subject}
                  onChange={(e) => setEditedMeta({ ...editedMeta, subject: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">학년도/학기</label>
                <input
                  type="text"
                  value={`${editedMeta.academicYear} ${editedMeta.semester}`}
                  onChange={(e) => {
                    const parts = e.target.value.split(' ');
                    setEditedMeta({
                      ...editedMeta,
                      academicYear: parts[0] || '',
                      semester: parts[1] || '',
                    });
                  }}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">학급 / 강의실</label>
                <input
                  type="text"
                  value={editedMeta.classroomInfo}
                  onChange={(e) => setEditedMeta({ ...editedMeta, classroomInfo: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">교과담당교사</label>
                <input
                  type="text"
                  value={editedMeta.teacher}
                  onChange={(e) => setEditedMeta({ ...editedMeta, teacher: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">확인 기준일</label>
                <input
                  type="text"
                  value={editedMeta.date}
                  onChange={(e) => setEditedMeta({ ...editedMeta, date: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* 평가 영역 목록 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider">
                평가 영역 설정 ({editedAreas.length}개)
              </h4>
              <button
                type="button"
                onClick={handleAddArea}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>영역 추가</span>
              </button>
            </div>

            <div className="space-y-2">
              {editedAreas.map((area, idx) => (
                <div
                  key={area.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <span className="w-5 text-center text-xs text-slate-400 font-mono font-bold">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={area.name}
                    onChange={(e) => handleAreaChange(idx, 'name', e.target.value)}
                    placeholder="영역 이름"
                    className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md"
                  />
                  <div className="flex items-center gap-1 text-xs whitespace-nowrap">
                    <span className="text-slate-500">만점:</span>
                    <input
                      type="number"
                      value={area.maxScore}
                      onChange={(e) =>
                        handleAreaChange(idx, 'maxScore', parseFloat(e.target.value) || 0)
                      }
                      className="w-14 px-2 py-1 text-xs bg-white border border-slate-300 rounded-md text-right"
                    />
                    <span className="text-slate-400">점</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveArea(idx)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>변경사항 저장</span>
          </button>
        </div>
      </div>
    </div>
  );
};
