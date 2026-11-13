import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { AssessmentArea, AssessmentData, AssessmentMeta, StudentScore } from '../types';

// PDF.js 워커 설정
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

/**
 * 텍스트 내 줄바꿈 및 분절된 한국어 단어들을 자연스럽게 결합하고 공백을 정제
 */
export function cleanKoreanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/관\s+계/g, '관계')
    .replace(/만\s+들\s*기/g, '만들기')
    .replace(/기\s+획/g, '기획')
    .replace(/설\s*명\s*서/g, '설명서')
    .replace(/카\s*드\s*뉴\s*스/g, '카드뉴스')
    .replace(/글\s*쓰\s*기/g, '글쓰기')
    .replace(/작\s+품/g, '작품')
    .replace(/탐\s+색/g, '탐색')
    .replace(/전\s*달\s*법/g, '전달법')
    .replace(/제\s+작/g, '제작')
    .replace(/활\s+동/g, '활동')
    .replace(/보\s*고\s*서/g, '보고서')
    .replace(/프\s*레\s*젠\s*테\s*이\s*션/g, '프레젠테이션')
    .replace(/발\s+표/g, '발표')
    .replace(/평\s+가/g, '평가')
    .replace(/실\s+험/g, '실험')
    .replace(/실\s+습/g, '실습')
    .replace(/포\s*트\s*폴\s*리\s*오/g, '포트폴리오')
    .trim();
}

/**
 * 평가 영역 문자열에서 순수 영역명, 만점(maxScore), 반영비율(weight)을 추출
 * 예: "가족의 가치와 미래\n(만점 20.00, 20.00%)" -> { name: "가족의 가치와 미래", maxScore: 20, weight: 20 }
 */
export function extractAreaInfo(rawTitle: string): { name: string; maxScore: number; weight?: number } {
  const cleaned = cleanKoreanText(rawTitle);

  // 1. (만점 20.00, 20.00%) 또는 (만점 30.00) 또는 (30점, 30%) 또는 만점: 20점 패턴 매칭
  const scoreRegex = /\(?\s*(?:만점|배점)\s*[:：]?\s*([0-9.]+)(?:점)?(?:\s*,\s*([0-9.]+)%?)?\s*\)?|\(([0-9.]+)점(?:\s*,\s*([0-9.]+)%)?\)/i;
  const match = cleaned.match(scoreRegex);

  let maxScore = 20; // 기본값
  let weight: number | undefined = undefined;

  if (match) {
    if (match[1]) {
      const parsedMax = parseFloat(match[1]);
      if (!isNaN(parsedMax)) maxScore = parsedMax;
      if (match[2]) {
        const parsedWeight = parseFloat(match[2]);
        if (!isNaN(parsedWeight)) weight = parsedWeight;
      }
    } else if (match[3]) {
      const parsedMax = parseFloat(match[3]);
      if (!isNaN(parsedMax)) maxScore = parsedMax;
      if (match[4]) {
        const parsedWeight = parseFloat(match[4]);
        if (!isNaN(parsedWeight)) weight = parsedWeight;
      }
    }
  }

  // 2. 영역 이름에서 만점 및 반영비율 표기 완전 제거
  let cleanName = cleaned
    .replace(/\(?\s*(?:만점|배점)\s*[:：]?\s*[0-9.]+(?:점)?(?:\s*,\s*[0-9.]+%?)?\s*\)?/gi, '')
    .replace(/\([0-9.]+점(?:\s*,\s*[0-9.]+%)?\)/gi, '')
    .replace(/\([0-9.]+%?\)/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 말줄임표나 끝에 남은 괄호 찌꺼기 제거
  cleanName = cleanName.replace(/[(\[]\s*$/, '').trim();

  return {
    name: cleanName || cleaned,
    maxScore,
    weight,
  };
}

/**
 * 텍스트 전체에서 일람표 메타데이터(학교, 학년도, 학기, 학년, 강의실/반, 교과목 등) 추출
 */
export function parseAssessmentMetaFromText(fullText: string): AssessmentMeta {
  // 학년도 (예: 2026학년도)
  const yearMatch = fullText.match(/(\d{4}학년도)/);
  const academicYear = yearMatch ? yearMatch[1] : `${new Date().getFullYear()}학년도`;

  // 학기 (예: 1학기, 2학기)
  const semesterMatch = fullText.match(/([12]학기)/);
  const semester = semesterMatch ? semesterMatch[1] : '1학기';

  // 학년 (예: 3학년, 2학년 - 단, 2026학년도 뒤의 6학년 매칭 방지)
  const gradeMatch = fullText.match(/(?:^|\s|[^\d])([1-6])학년/);
  const grade = gradeMatch ? `${gradeMatch[1]}학년` : '';

  // 강의실 또는 반 정보 (예: 3 강의실, 1 강의실, 3반)
  const classMatch = fullText.match(/(\d+\s*(?:강의실|반))/i);
  const classroomInfo = classMatch ? classMatch[1].trim() : '';

  // 교과목 (예: 교과목 : 기술·가정)
  const subjMatch = fullText.match(/교과목\s*[:：]?\s*([^\n\r,]+)/);
  let subject = '수행평가';
  if (subjMatch) {
    subject = subjMatch[1].trim();
  } else {
    // 괄호 안의 과목명 (예: [기술·가정])
    const bracketMatch = fullText.match(/\[([가-힣a-zA-Z0-9·_~]+)\]/);
    if (bracketMatch) subject = bracketMatch[1].trim();
  }

  // 교과담당교사
  const teacherMatch = fullText.match(/교과담당교사\s*\(?([^\n\r()]+)\)?(?:\s*인|\n|$)/);
  const teacher = teacherMatch ? teacherMatch[1].trim() : '';

  // 학교명
  const schoolMatch = fullText.match(/([가-힣]+(?:중학교|고등학교|초등학교))/);
  const schoolName = schoolMatch ? schoolMatch[1].trim() : '학교';

  // 날짜
  const dateMatch = fullText.match(/(\d{4}\.\d{1,2}\.\d{1,2})/);
  const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('ko-KR');

  return {
    schoolName,
    academicYear,
    semester,
    grade,
    classroomInfo,
    subject,
    teacher,
    date,
    title: '수행평가 일람표',
  };
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
  const meta = parseAssessmentMetaFromText(fullText);

  // 2. 평가 영역 파싱
  const areas: AssessmentArea[] = [];
  const areaSectionMatch = fullText.match(/반\/번호\s*성명\s*([\s\S]+?)\s*합계/);

  if (areaSectionMatch) {
    const areaSectionText = areaSectionMatch[1];
    // 만점 표기 기준으로 영역 분할 및 추출
    const areaRegex = /([\s\S]+?)\(?\s*(?:만점|배점)?\s*([0-9.]+)(?:점)?(?:\s*,\s*([0-9.]+)%?)?\s*\)?/g;
    let match;
    while ((match = areaRegex.exec(areaSectionText)) !== null) {
      const areaInfo = extractAreaInfo(`${match[1]} (만점 ${match[2]}${match[3] ? `, ${match[3]}%` : ''})`);
      if (areaInfo.name) {
        areas.push({
          id: `area_${areas.length + 1}`,
          name: areaInfo.name,
          maxScore: areaInfo.maxScore,
          weight: areaInfo.weight,
        });
      }
    }
  }

  // 3. 학생 데이터 파싱
  const students: StudentScore[] = [];
  const studentSectionMatch = fullText.match(/합계\s+(?:비고)?\s*([\s\S]+?)\s*(?:응시생수|총점|평균|교과목|$)/);

  if (studentSectionMatch) {
    const lines = studentSectionMatch[1].split('\n').map((l) => l.trim()).filter(Boolean);

    for (const line of lines) {
      const tokens = line.split(/\s+/).filter(Boolean);
      if (tokens.length >= 3) {
        const classNumMatch = tokens[0].match(/^(\d+)(?:\/(\d+))?$/);
        if (!classNumMatch) continue;

        let rawClassNum = tokens[0];
        let classRoom = classNumMatch[1];
        let studentNumber = classNumMatch[2] || tokens[1];
        let gradeToken = '';
        let name = '';
        let scoreTokensStartIndex = 2;

        if (tokens[1].match(/^\d+$/) && isNaN(Number(tokens[2]))) {
          // 예: 1/1 2 고민혁 ... (반/번호 학년 성명)
          gradeToken = tokens[1];
          name = tokens[2];
          scoreTokensStartIndex = 3;
        } else {
          // 예: 3/1 강주원 ... (반/번호 성명)
          name = tokens[1];
          scoreTokensStartIndex = 2;
        }

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
          const totalScore = numericTokens[numericTokens.length - 1];
          const areaScores = numericTokens.slice(0, numericTokens.length - 1);

          const studentScoreMap: { [areaId: string]: number | null } = {};
          areas.forEach((area, idx) => {
            studentScoreMap[area.id] = areaScores[idx] !== undefined ? areaScores[idx] : null;
          });

          students.push({
            id: `s_${students.length + 1}`,
            rawClassNum,
            grade: gradeToken ? `${gradeToken}학년` : meta.grade,
            classRoom,
            studentNumber: studentNumber || String(students.length + 1),
            name,
            scores: studentScoreMap,
            totalScore,
            note: note || undefined,
          });
        }
      }
    }
  }

  // 만약 areas가 비어있다면 학생 점수 개수 기준으로 기본 영역 생성
  if (areas.length === 0 && students.length > 0) {
    const firstStudent = students[0];
    const scoreCount = Object.keys(firstStudent.scores).length;
    for (let i = 1; i <= scoreCount; i++) {
      areas.push({
        id: `area_${i}`,
        name: `영역 ${i}`,
        maxScore: 20,
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

  // 1. 상단 행들에서 과목, 학교명, 학년도, 학기, 강의실 등 메타데이터 탐색
  let fullMetaText = '';
  for (let r = 0; r < Math.min(rawRows.length, 12); r++) {
    fullMetaText += rawRows[r].join(' ') + '\n';
  }
  const meta = parseAssessmentMetaFromText(fullMetaText);

  // 2. 헤더 행 탐색 ('성명' 또는 '이름' 또는 '학생명'이 포함된 행)
  let headerRowIndex = -1;
  let nameColIndex = -1;
  let numColIndex = -1;
  let totalColIndex = -1;

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r].map((c) => String(c).trim());
    const nIdx = row.findIndex((c) => c.includes('성명') || c.includes('이름') || c === '학생명');
    if (nIdx !== -1) {
      headerRowIndex = r;
      nameColIndex = nIdx;
      numColIndex = row.findIndex((c) => c.includes('번호') || c.includes('학번') || c.includes('반/번호'));
      totalColIndex = row.findIndex((c) => c.includes('합계') || c.includes('총점') || c.includes('총 점'));
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('엑셀 파일에서 "성명" 또는 "이름" 열을 찾을 수 없습니다.');
  }

  const headerRow = rawRows[headerRowIndex].map((c) => String(c).trim());
  const endColIndex = totalColIndex !== -1 ? totalColIndex : headerRow.length;

  // 3. 헤더 바로 다음 행이 만점/비율 전용 행인지 확인 (복수 행 헤더 양식 대응)
  let hasNextRowMaxScores = false;
  if (headerRowIndex + 1 < rawRows.length) {
    const nextRow = rawRows[headerRowIndex + 1].map((c) => String(c).trim());
    const maxScoreCount = nextRow.filter((c) => c.includes('만점') || c.includes('배점') || c.includes('%')).length;
    if (maxScoreCount >= 2) {
      hasNextRowMaxScores = true;
    }
  }

  // 4. 영역 열 추출 및 정보 정제 (만점, 가중치, 순수 영역명)
  const areas: AssessmentArea[] = [];
  const areaCols: { colIndex: number; areaId: string }[] = [];

  for (let c = nameColIndex + 1; c < endColIndex; c++) {
    const title = headerRow[c];
    if (title && !title.includes('비고') && !title.includes('순위')) {
      let combinedTitle = title;
      if (hasNextRowMaxScores && headerRowIndex + 1 < rawRows.length) {
        combinedTitle += ' ' + String(rawRows[headerRowIndex + 1][c] || '');
      }

      const areaInfo = extractAreaInfo(combinedTitle);
      const areaId = `area_${areas.length + 1}`;

      areas.push({
        id: areaId,
        name: areaInfo.name,
        maxScore: areaInfo.maxScore,
        weight: areaInfo.weight,
      });

      areaCols.push({ colIndex: c, areaId });
    }
  }

  // 5. 학생 데이터 행 파싱
  const students: StudentScore[] = [];
  const dataStartRow = headerRowIndex + (hasNextRowMaxScores ? 2 : 1);

  for (let r = dataStartRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    const name = String(row[nameColIndex] || '').trim();
    if (!name || name.includes('합계') || name.includes('평균') || name.includes('응시') || name.includes('교과목')) {
      continue;
    }

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

    // 반/번호 분리
    let classRoom = '1';
    let studentNumber = rawNum;
    if (rawNum.includes('/')) {
      const parts = rawNum.split('/');
      classRoom = parts[0];
      studentNumber = parts[1];
    } else if (meta.classroomInfo) {
      const cMatch = meta.classroomInfo.match(/\d+/);
      if (cMatch) classRoom = cMatch[0];
    }

    students.push({
      id: `s_${students.length + 1}`,
      rawClassNum: rawNum,
      grade: meta.grade,
      classRoom,
      studentNumber,
      name,
      scores,
      totalScore,
    });
  }

  return { meta, areas, students };
}
