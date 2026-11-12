import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { AssessmentArea, AssessmentData, AssessmentMeta, StudentScore } from '../types';

// PDF.js 워커 설정
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

/**
 * 텍스트 내 줄바꿈으로 끊어진 한국어 단어들을 자연스럽게 정리 (예: '관\n계' -> '관계', '만\n들기' -> '만들기')
 */
function cleanKoreanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/관\s+계/g, '관계')
    .replace(/만\s+들기/g, '만들기')
    .trim();
}

/**
 * 나이스 수행평가 일람표 PDF 텍스트 추출 및 구조화 파싱
 */
export async function parseAssessmentPdf(file: File): Promise<AssessmentData> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join('\n');
    fullText += pageText + '\n';
  }

  return parseNeisPdfText(fullText);
}

/**
 * PDF에서 추출된 텍스트를 분석하여 AssessmentData로 파싱
 */
export function parseNeisPdfText(fullText: string): AssessmentData {
  // 1. 메타데이터 파싱
  const subjectMatch = fullText.match(/교과목\s*:\s*([^\n\r]+)/);
  const subject = subjectMatch ? subjectMatch[1].trim() : '수행평가';

  const academicMatch = fullText.match(/(\d{4}학년도)\s*(\d학기)?(?:\s*주간)?\s*(\d학년)?\s*([^\n\r]+)?/);
  const academicYear = academicMatch ? academicMatch[1] : `${new Date().getFullYear()}학년도`;
  const semester = academicMatch && academicMatch[2] ? academicMatch[2] : '1학기';
  const grade = academicMatch && academicMatch[3] ? academicMatch[3] : '';
  const classroomInfo = academicMatch && academicMatch[4] ? academicMatch[4].trim() : '';

  const teacherMatch = fullText.match(/교과담당교사\s*\(?([^\n\r()]+)\)?(?:\s*인|\n|$)/);
  const teacher = teacherMatch ? teacherMatch[1].trim() : '';

  const schoolMatch = fullText.match(/([가-힣]+(?:중학교|고등학교|초등학교))/);
  const schoolName = schoolMatch ? schoolMatch[1].trim() : '학교';

  const dateMatch = fullText.match(/(\d{4}\.\d{1,2}\.\d{1,2})/);
  const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('ko-KR');

  const meta: AssessmentMeta = {
    schoolName,
    academicYear,
    semester,
    grade,
    classroomInfo,
    subject,
    teacher,
    date,
    title: '수행평가 일람표'
  };

  // 2. 평가 영역 파싱
  const areas: AssessmentArea[] = [];
  const areaSectionMatch = fullText.match(/반\/번호\s*성명\s*([\s\S]+?)\s*합계/);

  if (areaSectionMatch) {
    const areaSectionText = areaSectionMatch[1];
    // (만점 20.00, 20.00%) 정규식으로 분할
    const parts = areaSectionText.split(/\(만점\s*([0-9.]+),\s*([0-9.]+)%\)/);
    // parts 구조: [area1_name, maxScore1, weight1, area2_name, maxScore2, weight2, ...]
    for (let i = 0; i < parts.length - 2; i += 3) {
      const rawName = cleanKoreanText(parts[i]);
      const maxScore = parseFloat(parts[i + 1]);
      const weight = parseFloat(parts[i + 2]);
      if (rawName && !isNaN(maxScore)) {
        areas.push({
          id: `area_${areas.length + 1}`,
          name: rawName,
          maxScore,
          weight: isNaN(weight) ? undefined : weight
        });
      }
    }
  }

  // 3. 학생 데이터 파싱
  const students: StudentScore[] = [];
  // 학생 데이터는 '합계  비고' 다음부터 '응시생수' 또는 '총점' 또는 '평균' 직전까지
  const studentSectionMatch = fullText.match(/합계\s+(?:비고)?\s*([\s\S]+?)\s*(?:응시생수|총점|평균|교과목)/);
  
  if (studentSectionMatch) {
    const lines = studentSectionMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    
    for (const line of lines) {
      // 행 예시: 1/1 2 고민혁 19.00 16.00 18.00 24.00 8.00 85.00 
      const tokens = line.split(/\s+/).filter(Boolean);
      if (tokens.length >= 4) {
        // 첫 번째 토큰이 반/번호 형식 (예: 1/1, 2/15 등) 또는 번호인지 확인
        const classNumMatch = tokens[0].match(/^(\d+)(?:\/(\d+))?$/);
        if (!classNumMatch) continue;

        let rawClassNum = tokens[0];
        let classRoom = classNumMatch[1];
        let studentNumber = classNumMatch[2] || tokens[1];
        let gradeToken = '';
        let name = '';
        let scoreTokensStartIndex = 3;

        // 토큰 구성 파악:
        // Case A: 1/1 2 고민혁 ... (반/번호, 학년, 성명)
        // Case B: 1/1 고민혁 ... (반/번호, 성명)
        // Case C: 1 고민혁 ... (번호, 성명)
        if (tokens[1].match(/^\d+$/) && isNaN(Number(tokens[2]))) {
          gradeToken = tokens[1];
          name = tokens[2];
          scoreTokensStartIndex = 3;
        } else {
          name = tokens[1];
          scoreTokensStartIndex = 2;
        }

        // 숫자 점수 추출
        const numericTokens: number[] = [];
        let note = '';
        for (let t = scoreTokensStartIndex; t < tokens.length; t++) {
          const num = parseFloat(tokens[t].replace(/,/g, ''));
          if (!isNaN(num)) {
            numericTokens.push(num);
          } else {
            note += (note ? ' ' : '') + tokens[t];
          }
        }

        if (numericTokens.length > 0) {
          // 마지막 숫자는 대개 총점(합계)
          const totalScore = numericTokens[numericTokens.length - 1];
          const areaScores = numericTokens.slice(0, numericTokens.length - 1);

          const studentScoreMap: { [areaId: string]: number | null } = {};
          areas.forEach((area, idx) => {
            studentScoreMap[area.id] = areaScores[idx] !== undefined ? areaScores[idx] : null;
          });

          students.push({
            id: `s_${students.length + 1}`,
            rawClassNum,
            grade: gradeToken || meta.grade,
            classRoom,
            studentNumber: studentNumber || String(students.length + 1),
            name,
            scores: studentScoreMap,
            totalScore,
            note: note || undefined
          });
        }
      }
    }
  }

  // 만약 areas가 비어있다면 학생들의 점수 개수를 기준으로 기본 영역 생성
  if (areas.length === 0 && students.length > 0) {
    const firstStudent = students[0];
    const scoreCount = Object.keys(firstStudent.scores).length;
    for (let i = 1; i <= scoreCount; i++) {
      areas.push({
        id: `area_${i}`,
        name: `영역 ${i}`,
        maxScore: 100
      });
    }
  }

  return { meta, areas, students };
}

/**
 * Excel 또는 CSV 파일 파싱
 */
export async function parseAssessmentExcel(file: File): Promise<AssessmentData> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  const meta: AssessmentMeta = {
    schoolName: '학교',
    academicYear: `${new Date().getFullYear()}학년도`,
    semester: '1학기',
    grade: '',
    classroomInfo: '',
    subject: '수행평가',
    teacher: '',
    date: new Date().toLocaleDateString('ko-KR'),
    title: '수행평가 일람표'
  };

  // 상단 행들에서 과목, 학교명 등 메타데이터 탐색
  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const rowStr = rawRows[r].join(' ');
    const subjMatch = rowStr.match(/교과목\s*[:：]\s*([^\s,]+)/);
    if (subjMatch) meta.subject = subjMatch[1];

    const schoolMatch = rowStr.match(/([가-힣]+(?:중학교|고등학교|초등학교))/);
    if (schoolMatch) meta.schoolName = schoolMatch[1];

    const yearMatch = rowStr.match(/(\d{4}학년도)/);
    if (yearMatch) meta.academicYear = yearMatch[1];
  }

  // 헤더 행 탐색 ('성명' 또는 '이름'이 포함된 행)
  let headerRowIndex = -1;
  let nameColIndex = -1;
  let numColIndex = -1;
  let totalColIndex = -1;

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r].map(c => String(c).trim());
    const nIdx = row.findIndex(c => c.includes('성명') || c.includes('이름') || c === '학생명');
    if (nIdx !== -1) {
      headerRowIndex = r;
      nameColIndex = nIdx;
      numColIndex = row.findIndex(c => c.includes('번호') || c.includes('학번') || c.includes('반/번호'));
      totalColIndex = row.findIndex(c => c.includes('합계') || c.includes('총점') || c.includes('총 점'));
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('엑셀 파일에서 "성명" 또는 "이름" 열을 찾을 수 없습니다.');
  }

  const headerRow = rawRows[headerRowIndex].map(c => String(c).trim());
  
  // 영역 열 추출: 이름열과 합계열 사이에 위치한 열들
  const endColIndex = totalColIndex !== -1 ? totalColIndex : headerRow.length;
  const areaCols: { colIndex: number; name: string }[] = [];

  for (let c = nameColIndex + 1; c < endColIndex; c++) {
    const title = headerRow[c];
    if (title && !title.includes('비고') && !title.includes('순위')) {
      areaCols.push({ colIndex: c, name: cleanKoreanText(title) });
    }
  }

  const areas: AssessmentArea[] = areaCols.map((ac, idx) => ({
    id: `area_${idx + 1}`,
    name: ac.name || `영역 ${idx + 1}`,
    maxScore: 20
  }));

  // 학생 데이터 추출
  const students: StudentScore[] = [];
  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    const name = String(row[nameColIndex] || '').trim();
    if (!name || name.includes('합계') || name.includes('평균') || name.includes('응시')) continue;

    const rawNum = numColIndex !== -1 ? String(row[numColIndex] || '').trim() : `${students.length + 1}`;
    const scores: { [areaId: string]: number | null } = {};
    let calculatedTotal = 0;

    areas.forEach((area, idx) => {
      const colIdx = areaCols[idx].colIndex;
      const val = parseFloat(String(row[colIdx]).replace(/,/g, ''));
      if (!isNaN(val)) {
        scores[area.id] = val;
        calculatedTotal += val;
      } else {
        scores[area.id] = null;
      }
    });

    const explicitTotal = totalColIndex !== -1 ? parseFloat(String(row[totalColIndex]).replace(/,/g, '')) : NaN;
    const totalScore = !isNaN(explicitTotal) ? explicitTotal : calculatedTotal;

    students.push({
      id: `s_${students.length + 1}`,
      rawClassNum: rawNum,
      grade: meta.grade,
      classRoom: rawNum.includes('/') ? rawNum.split('/')[0] : '1',
      studentNumber: rawNum.includes('/') ? rawNum.split('/')[1] : rawNum,
      name,
      scores,
      totalScore
    });
  }

  return { meta, areas, students };
}
