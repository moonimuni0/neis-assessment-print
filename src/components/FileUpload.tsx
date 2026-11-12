import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, AlertCircle, FileSpreadsheet, Sparkles, ShieldCheck } from 'lucide-react';
import { parseAssessmentPdf, parseAssessmentExcel } from '../utils/parser';
import { AssessmentData } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: AssessmentData) => void;
  onLoadSample: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onLoadSample }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const fileName = file.name.toLowerCase();
      let parsedData: AssessmentData;

      if (fileName.endsWith('.pdf')) {
        parsedData = await parseAssessmentPdf(file);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
        parsedData = await parseAssessmentExcel(file);
      } else {
        throw new Error('지원되지 않는 파일 형식입니다. PDF 또는 Excel(.xlsx, .xls, .csv) 파일을 업로드해주세요.');
      }

      if (parsedData.students.length === 0) {
        throw new Error('파일에서 학생 성적 정보를 인식하지 못했습니다. 나이스 일람표 양식인지 확인해주세요.');
      }

      onDataLoaded(parsedData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '파일을 분석하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8">
      {/* 업로드 카드 */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/50 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.csv"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
            {isLoading ? (
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {isLoading ? '일람표 파일을 분석하는 중입니다...' : '수행평가 일람표 파일을 이곳에 끌어다 놓으세요'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              또는 클릭하여 내 컴퓨터에서 파일 선택 (NEIS PDF, Excel, CSV)
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-rose-500" /> 나이스 PDF 지원
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel (.xlsx, .xls, .csv) 지원
            </span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {errorMsg && (
          <div className="mt-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* 보조 안내 및 샘플 로드 버튼 */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>모든 파일은 브라우저에서만 즉시 처리되며 외부 서버로 전송되지 않습니다.</span>
        </div>

        <button
          type="button"
          onClick={onLoadSample}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>예시 일람표로 바로 체험하기</span>
        </button>
      </div>
    </div>
  );
};
