// ============================================================
// Excel読込ユーティリティ + スマート列認識
// ============================================================

import * as XLSX from 'xlsx';
import { Student, ExcelImportConfig } from '../types/student';
import { normalizeStudents } from '../engine/normalizer';

/** 列名から意味を推定するマッピング */
const COLUMN_MAPPINGS: { [key: string]: string } = {
  // 必須列
  '氏名': 'name', '名前': 'name', '生徒名': 'name', '児童名': 'name',
  '性別': 'gender',
  '現クラス': 'currentClass', '前クラス': 'currentClass', '旧クラス': 'currentClass',
  'クラス': 'currentClass', '組': 'currentClass',

  // 学力（総合）
  '学力': 'academicRaw', '総合学力': 'academicRaw', '成績': 'academicRaw',

  // 学力（科目別）
  '国語': 'subject_国語', '算数': 'subject_算数', '数学': 'subject_数学',
  '英語': 'subject_英語', '理科': 'subject_理科', '社会': 'subject_社会',
  '音楽': 'subject_音楽', '体育': 'subject_体育', '図工': 'subject_図工',

  // 運動
  '運動': 'physicalRaw', '体力': 'physicalRaw', '体力テスト': 'physicalRaw',
  '50m走': 'physicalRaw', '運動能力': 'physicalRaw',

  // フラグ
  'ピアノ': 'canPlayPiano', '伴奏': 'canPlayPiano', 'ピアノ伴奏': 'canPlayPiano',
  'リーダー': 'isLeader', 'リーダー性': 'isLeader',
  '特別支援': 'hasSpecialSupport', '特支': 'hasSpecialSupport',
  '不登校': 'hasTendencyAbsence', '不登校傾向': 'hasTendencyAbsence',
  '要配慮': 'careFlag', '配慮': 'careFlag',
  '生徒指導': 'behavior',

  // 詳細配慮
  '学習支援': 'care_learning', '生活指導': 'care_behavior',
  '人間関係': 'care_relationship', '家庭環境': 'care_family',
  '健康・心理': 'care_health', '健康': 'care_health',

  // その他
  '選択科目': 'selectedSubject', '選択': 'selectedSubject',
  'コース': 'course', '科': 'course', 'コース/科': 'course',
  '通学班': 'commutingGroup', '地区': 'commutingGroup', '通学班/地区': 'commutingGroup',
  '備考': 'note',
};

/** 性別値の正規化 */
function normalizeGender(value: string): 'male' | 'female' {
  const str = String(value).trim();
  if (['男', '男性', 'M', 'male', '1'].includes(str)) return 'male';
  if (['女', '女性', 'F', 'female', '2'].includes(str)) return 'female';
  return 'male'; // デフォルト
}

/** ○フラグの正規化 */
function normalizeFlag(value: unknown): boolean {
  if (value === '○' || value === '◯' || value === true || value === 1 || value === '1') return true;
  return false;
}

/** ExcelデータをStudentリストに変換する */
export function parseExcelData(
  data: unknown[][],
  config: ExcelImportConfig
): { students: Student[]; unknownColumns: string[] } {
  if (data.length < 2) return { students: [], unknownColumns: [] };

  const headers = data[0].map(h => String(h ?? '').trim());
  const rows = data.slice(1);

  // ヘッダー→フィールド名マッピング
  const fieldMap: { [colIdx: number]: string } = {};
  const unknownColumns: string[] = [];

  headers.forEach((header, idx) => {
    const mapped = COLUMN_MAPPINGS[header];
    if (mapped) {
      fieldMap[idx] = mapped;
    } else if (header !== '') {
      unknownColumns.push(header);
    }
  });

  const students: Student[] = rows
    .filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''))
    .map((row, rowIdx) => {
      const get = (idx: number) => row[idx];

      const student: Partial<Student> = {
        id: `S${String(rowIdx + 1).padStart(4, '0')}`,
        academicSubjects: {},
        careCategories: {},
      };

      for (const [idxStr, field] of Object.entries(fieldMap)) {
        const idx = parseInt(idxStr);
        const value = get(idx);

        if (value === undefined || value === null || value === '') continue;

        if (field === 'name') student.name = String(value);
        else if (field === 'gender') student.gender = normalizeGender(String(value));
        else if (field === 'currentClass') student.currentClass = parseInt(String(value)) || 1;
        else if (field === 'academicRaw') student.academicRaw = value as number | string;
        else if (field === 'physicalRaw') student.physicalRaw = value as number | string;
        else if (field === 'canPlayPiano') student.canPlayPiano = normalizeFlag(value);
        else if (field === 'isLeader') student.isLeader = normalizeFlag(value);
        else if (field === 'hasSpecialSupport') student.hasSpecialSupport = normalizeFlag(value);
        else if (field === 'hasTendencyAbsence') student.hasTendencyAbsence = normalizeFlag(value);
        else if (field === 'careFlag') student.careFlag = normalizeFlag(value);
        else if (field === 'selectedSubject') student.selectedSubject = String(value);
        else if (field === 'course') student.course = String(value);
        else if (field === 'commutingGroup') student.commutingGroup = String(value);
        else if (field === 'note') student.note = String(value);
        else if (field.startsWith('subject_')) {
          const subjectName = field.replace('subject_', '');
          student.academicSubjects![subjectName] = value as number | string;
        } else if (field.startsWith('care_')) {
          const catName = field.replace('care_', '') as keyof typeof student.careCategories;
          const level = parseInt(String(value));
          if (level >= 1 && level <= 3) {
            (student.careCategories as Record<string, number>)[catName] = level;
          }
        }
      }

      if (!student.name) student.name = `生徒${rowIdx + 1}`;
      if (!student.gender) student.gender = 'male';
      if (!student.currentClass) student.currentClass = 1;

      if (Object.keys(student.academicSubjects!).length === 0) {
        delete student.academicSubjects;
      }
      if (Object.keys(student.careCategories!).length === 0) {
        delete student.careCategories;
      }

      return student as Student;
    });

  // 正規化スコアを計算
  const normalized = normalizeStudents(
    students,
    config.academicInputType,
    config.physicalInputType,
    config.academicMaxValue
  );

  return { students: normalized, unknownColumns };
}

/**
 * Excelファイルを読み込んでパースする
 */
export function readExcelFile(
  file: File,
  config: ExcelImportConfig
): Promise<{ students: Student[]; unknownColumns: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // 「児童生徒名簿」シートを優先、なければ最初のシートを使用
        const sheetName =
          workbook.SheetNames.find(n => n.includes('名簿') || n.includes('生徒') || n.includes('児童'))
          ?? workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
        resolve(parseExcelData(jsonData, config));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * クラス編成結果をExcelとして出力する
 */
export function exportToExcel(
  planName: string,
  classData: { classNumber: number; students: Student[] }[]
): void {
  const wb = XLSX.utils.book_new();

  // 概要シート
  const summaryData = classData.map(cls => ({
    クラス: `${cls.classNumber}組`,
    人数: cls.students.length,
    男子: cls.students.filter(s => s.gender === 'male').length,
    女子: cls.students.filter(s => s.gender === 'female').length,
    学力平均: (cls.students.reduce((a, s) => a + (s.normalizedAcademic ?? 50), 0) / cls.students.length).toFixed(1),
    配慮ポイント合計: cls.students.reduce((a, s) => a + (s.totalCarePoints ?? 0), 0),
  }));
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, '概要');

  // 各クラスシート
  for (const cls of classData) {
    const rows = cls.students.map((s, idx) => ({
      番号: idx + 1,
      氏名: s.name,
      性別: s.gender === 'male' ? '男' : '女',
      旧クラス: s.currentClass,
      学力スコア: (s.normalizedAcademic ?? 50).toFixed(1),
      運動スコア: (s.normalizedPhysical ?? 50).toFixed(1),
      ピアノ: s.canPlayPiano ? '○' : '',
      リーダー: s.isLeader ? '○' : '',
      特別支援: s.hasSpecialSupport ? '○' : '',
      不登校傾向: s.hasTendencyAbsence ? '○' : '',
      配慮ポイント: s.totalCarePoints ?? 0,
      備考: s.note ?? '',
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, `${cls.classNumber}組`);
  }

  XLSX.writeFile(wb, `${planName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
