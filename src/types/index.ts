export interface AssessmentArea {
  id: string;
  name: string;
  maxScore: number;
  weight?: number;
}

export interface StudentScore {
  id: string;
  rawClassNum: string;    // 예: "1/1"
  grade: string;          // 예: "2"
  classRoom: string;      // 예: "1"
  studentNumber: string;  // 예: "1"
  name: string;
  scores: { [areaId: string]: number | null };
  totalScore: number;
  note?: string;
}

export interface AssessmentMeta {
  schoolName: string;
  academicYear: string;
  semester: string;
  grade: string;
  classroomInfo: string;
  subject: string;
  teacher: string;
  date: string;
  title: string;
}

export interface AssessmentData {
  meta: AssessmentMeta;
  areas: AssessmentArea[];
  students: StudentScore[];
}

export interface PrintSettings {
  itemsPerPage: 2 | 3 | 4;
  showSignature: boolean;
  showParentSignature: boolean;
  showTeacherSignature: boolean;
  showMaxScore: boolean;
  showSubject: boolean;
  noticeText: string;
  customTitle: string;
}
