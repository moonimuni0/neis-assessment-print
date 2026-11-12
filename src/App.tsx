import { useState } from 'react';
import { AssessmentArea, AssessmentData, AssessmentMeta, PrintSettings } from './types';
import { SAMPLE_DATA } from './utils/sampleData';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { PrintSettingsBar } from './components/PrintSettingsBar';
import { PrintPageLayout } from './components/PrintPageLayout';
import { StudentTableView } from './components/StudentTableView';
import { MetaEditorModal } from './components/MetaEditorModal';
import { Scissors, CheckCircle } from 'lucide-react';

export function App() {
  // 기본적으로 폴더에 제공된 샘플 데이터(수행평가 일람표.pdf 파싱 결과)를 기본 로드
  const [data, setData] = useState<AssessmentData | null>(SAMPLE_DATA);
  const [activeTab, setActiveTab] = useState<'preview' | 'table'>('preview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMetaEditModal, setShowMetaEditModal] = useState(false);

  // 인쇄 설정 기본값
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    itemsPerPage: 3, // 권장: A4 1장에 3명
    showSignature: true,
    showParentSignature: true,
    showTeacherSignature: false,
    showMaxScore: true,
    showSubject: true,
    noticeText: '※ 위 평가 결과를 확인하였으며, 이의가 있을 경우 확인일로부터 3일 이내에 교과담당교사에게 문의 바랍니다.',
    customTitle: '',
  });

  // 선택된 학생 ID 세트 (기본: 전체 선택)
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(() => {
    return new Set(SAMPLE_DATA.students.map((s) => s.id));
  });

  // 새 데이터 로드 시 처리
  const handleDataLoaded = (newData: AssessmentData) => {
    setData(newData);
    setSelectedStudentIds(new Set(newData.students.map((s) => s.id)));
    setShowUploadModal(false);
    setActiveTab('preview');
  };

  // 예시 데이터 리셋
  const handleLoadSample = () => {
    setData(SAMPLE_DATA);
    setSelectedStudentIds(new Set(SAMPLE_DATA.students.map((s) => s.id)));
    setShowUploadModal(false);
    setActiveTab('preview');
  };

  // 학생 개별 선택 토글
  const handleToggleSelect = (id: string) => {
    const updated = new Set(selectedStudentIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedStudentIds(updated);
  };

  const handleSelectAll = () => {
    if (!data) return;
    setSelectedStudentIds(new Set(data.students.map((s) => s.id)));
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds(new Set());
  };

  // 메타데이터 및 영역 저장
  const handleSaveMeta = (newMeta: AssessmentMeta, newAreas: AssessmentArea[]) => {
    if (!data) return;
    setData({
      ...data,
      meta: newMeta,
      areas: newAreas,
    });
  };

  // 인쇄 실행
  const handlePrint = () => {
    window.print();
  };

  // 현재 인쇄 대상 학생들
  const studentsToPrint = data
    ? data.students.filter((s) => selectedStudentIds.has(s.id))
    : [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* 1. 상단 글로벌 헤더 */}
      <Header
        data={data}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenUpload={() => setShowUploadModal(true)}
        onOpenMetaEdit={() => setShowMetaEditModal(true)}
        onLoadSample={handleLoadSample}
        onPrint={handlePrint}
      />

      {/* 2. 메인 콘텐츠 영역 (화면 전용 no-print) */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {data ? (
          <div>
            {/* 상단 알림 배너 */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/60 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-950">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>[{data.meta.schoolName}] {data.meta.academicYear} {data.meta.semester} {data.meta.subject}</strong> 일람표가 성공적으로 로드되었습니다. (총 {data.students.length}명)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Scissors className="w-3.5 h-3.5 text-indigo-600" />
                <span>한 페이지당 <strong>{printSettings.itemsPerPage}명</strong>씩 절취선과 함께 A4 배치됩니다.</span>
              </div>
            </div>

            {/* 인쇄 설정 바 */}
            <PrintSettingsBar
              settings={printSettings}
              onChange={setPrintSettings}
              totalStudents={studentsToPrint.length}
              onPrint={handlePrint}
            />

            {/* 탭 1: A4 인쇄 미리보기 */}
            {activeTab === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>💡 <strong>인쇄 팁:</strong> 인쇄 창(Ctrl+P)에서 <strong>'배경 그래픽'</strong> 옵션을 체크하면 배경색이 선명하게 인쇄됩니다.</span>
                  <span>출력 대상: <strong>{studentsToPrint.length}명</strong></span>
                </div>

                {studentsToPrint.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                    <p className="text-slate-500 text-sm mb-4">인쇄할 학생이 선택되지 않았습니다.</p>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                    >
                      전체 학생 선택하기
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-8">
                    <PrintPageLayout
                      students={studentsToPrint}
                      areas={data.areas}
                      meta={data.meta}
                      settings={printSettings}
                      isPreview={true}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 탭 2: 성적 목록 테이블 뷰 */}
            {activeTab === 'table' && (
              <StudentTableView
                data={data}
                selectedStudentIds={selectedStudentIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
              />
            )}
          </div>
        ) : (
          /* 데이터가 없을 때 파일 업로드 화면 */
          <FileUpload
            onDataLoaded={handleDataLoaded}
            onLoadSample={handleLoadSample}
          />
        )}
      </main>

      {/* 3. 인쇄 전용 영역 (@media print 에서만 보이고 화면에서는 숨김) */}
      <div className="hidden print:block">
        {data && studentsToPrint.length > 0 && (
          <PrintPageLayout
            students={studentsToPrint}
            areas={data.areas}
            meta={data.meta}
            settings={printSettings}
            isPreview={false}
          />
        )}
      </div>

      {/* 4. 파일 업로드 모달 (상단 헤더에서 새 파일 버튼 클릭 시) */}
      {showUploadModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-2">새 수행평가 일람표 파일 업로드</h3>
            <p className="text-xs text-slate-500 mb-4">
              나이스(NEIS)에서 내려받은 PDF 파일 또는 Excel/CSV 일람표 파일을 업로드하세요.
            </p>
            <FileUpload
              onDataLoaded={handleDataLoaded}
              onLoadSample={handleLoadSample}
            />
          </div>
        </div>
      )}

      {/* 5. 메타데이터/영역 편집 모달 */}
      {data && (
        <MetaEditorModal
          meta={data.meta}
          areas={data.areas}
          isOpen={showMetaEditModal}
          onClose={() => setShowMetaEditModal(false)}
          onSave={handleSaveMeta}
        />
      )}

      {/* 하단 푸터 (화면 전용) */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 mt-auto">
        <p>수행평가 일람표 개인별 성적 확인표 생성 & A4 절취선 출력 시스템</p>
        <p className="mt-1 text-[11px] text-slate-400">
          모든 개인정보는 사용자 PC의 웹 브라우저 내에서만 안전하게 처리되며 서버에 저장되지 않습니다.
        </p>
      </footer>
    </div>
  );
}

export default App;
