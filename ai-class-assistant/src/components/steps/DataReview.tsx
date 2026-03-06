import React, { useState, useCallback } from 'react';
import { Student, SchoolType, AcademicInputType, PhysicalInputType } from '../../types/student';
import { SCHOOL_PRESETS } from '../../data/presets';
import { readExcelFile } from '../../utils/excelReader';
import { normalizeStudents } from '../../engine/normalizer';

interface Props {
  students: Student[];
  schoolType: SchoolType;
  academicInputType: AcademicInputType;
  physicalInputType: PhysicalInputType;
  onNext: (students: Student[], academicType: AcademicInputType, physicalType: PhysicalInputType) => void;
  onBack: () => void;
  showUpload?: boolean;
}

const ACADEMIC_TYPE_LABELS: { [key in AcademicInputType]: string } = {
  scale_3: '3段階（◎○△）',
  scale_5: '5段階（1〜5）',
  points_100: '100点満点',
  points_500: '5教科合計（500点）',
  deviation: '偏差値',
  custom: 'カスタム',
};

const PHYSICAL_TYPE_LABELS: { [key in PhysicalInputType]: string } = {
  numeric: '数値（体力テスト）',
  grade_AE: '段階評価（A〜E）',
  scale_5: '5段階（1〜5）',
  flag: 'フラグ（○印）',
};

const DataReview: React.FC<Props> = ({
  students: initialStudents,
  schoolType,
  academicInputType: initialAcademicType,
  physicalInputType: initialPhysicalType,
  onNext,
  onBack,
  showUpload = false,
}) => {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [academicType, setAcademicType] = useState<AcademicInputType>(initialAcademicType);
  const [physicalType, setPhysicalType] = useState<PhysicalInputType>(initialPhysicalType);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unknownColumns, setUnknownColumns] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await readExcelFile(file, {
        academicInputType: academicType,
        physicalInputType: physicalType,
        schoolType,
      });
      setStudents(result.students);
      setUnknownColumns(result.unknownColumns);
    } catch (err) {
      setError('Excelファイルの読み込みに失敗しました。形式を確認してください。');
    } finally {
      setIsLoading(false);
    }
  }, [academicType, physicalType, schoolType]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // 同じファイルを再選択できるようリセット
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleTypeChange = (newAcademicType: AcademicInputType, newPhysicalType: PhysicalInputType) => {
    setAcademicType(newAcademicType);
    setPhysicalType(newPhysicalType);
    // 正規化を再実行
    const renormalized = normalizeStudents(students, newAcademicType, newPhysicalType);
    setStudents(renormalized);
  };

  // 統計計算
  const totalStudents = students.length;
  const maleCount = students.filter(s => s.gender === 'male').length;
  const femaleCount = totalStudents - maleCount;
  const avgAcademic = totalStudents > 0
    ? students.reduce((a, s) => a + (s.normalizedAcademic ?? 50), 0) / totalStudents
    : 0;
  const pianoCount = students.filter(s => s.canPlayPiano).length;
  const specialSupportCount = students.filter(s => s.hasSpecialSupport).length;
  const absenceCount = students.filter(s => s.hasTendencyAbsence).length;
  const careCount = students.filter(s => (s.totalCarePoints ?? 0) > 0).length;

  const uniqueClasses = Array.from(new Set(students.map(s => s.currentClass))).sort((a, b) => a - b);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">データ確認</h2>
          <p className="text-gray-500">読み込んだデータを確認し、入力形式を設定してください</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
          ← 戻る
        </button>
      </div>

      {/* ファイルアップロードエリア */}
      {showUpload && (
        <div className="mb-6">
          <label
            htmlFor="excel-file-input"
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            className={`block bg-white border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
              ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <p className="text-gray-600 mb-2">
              Excelファイル（.xlsx / .xls）を選択またはここにドラッグ&amp;ドロップ
            </p>
            <p className="text-blue-600 font-semibold text-sm mb-4">クリックしてファイルを選択</p>
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isLoading}
              style={{ display: 'block', margin: '0 auto', fontSize: '14px' }}
            />
            {isLoading && <p className="text-blue-600 mt-3 text-sm font-medium">読み込み中...</p>}
          </label>
          {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
          {unknownColumns.length > 0 && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left">
              <p className="text-yellow-700 text-sm font-medium">認識できなかった列名：</p>
              <p className="text-yellow-600 text-xs">{unknownColumns.join('、')}</p>
              <p className="text-yellow-600 text-xs mt-1">これらの列はスキップされました。備考欄として扱う場合は列名を「備考」に変更してください。</p>
            </div>
          )}
        </div>
      )}

      {/* 入力形式設定 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-bold text-gray-800 mb-4">入力形式の設定</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">学力データの形式</label>
            <select
              value={academicType}
              onChange={e => handleTypeChange(e.target.value as AcademicInputType, physicalType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {(Object.entries(ACADEMIC_TYPE_LABELS) as [AcademicInputType, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">運動能力データの形式</label>
            <select
              value={physicalType}
              onChange={e => handleTypeChange(academicType, e.target.value as PhysicalInputType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {(Object.entries(PHYSICAL_TYPE_LABELS) as [PhysicalInputType, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* サマリー統計 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: '総生徒数', value: `${totalStudents}名`, sub: `男${maleCount} / 女${femaleCount}`, color: 'blue' },
          { label: '学力平均', value: `${avgAcademic.toFixed(1)}点`, sub: '正規化スコア(0-100)', color: 'green' },
          { label: 'ピアノ伴奏', value: `${pianoCount}名`, sub: `全体の${totalStudents > 0 ? Math.round(pianoCount/totalStudents*100) : 0}%`, color: 'purple' },
          { label: '要配慮生徒', value: `${careCount}名`, sub: `特支${specialSupportCount} / 不登校${absenceCount}`, color: 'orange' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-4`}>
            <p className={`text-xs font-medium text-${color}-600 mb-1`}>{label}</p>
            <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
            <p className={`text-xs text-${color}-500 mt-1`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* 旧クラス別内訳 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-bold text-gray-800 mb-3">旧クラス別生徒数</h3>
        <div className="flex flex-wrap gap-3">
          {uniqueClasses.map(cls => {
            const clsStudents = students.filter(s => s.currentClass === cls);
            return (
              <div key={cls} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span className="font-bold text-gray-700">{cls}組</span>
                <span className="text-gray-500 text-sm">{clsStudents.length}名</span>
                <span className="text-xs text-gray-400">
                  (男{clsStudents.filter(s => s.gender === 'male').length}/女{clsStudents.filter(s => s.gender === 'female').length})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 生徒一覧テーブル */}
      {students.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">生徒一覧（先頭20名）</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['氏名', '性別', '旧クラス', '学力スコア', '運動スコア', 'ピアノ', 'リーダー', '特支', '配慮Pt'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.slice(0, 20).map(student => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{student.name}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${student.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {student.gender === 'male' ? '男' : '女'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{student.currentClass}組</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${student.normalizedAcademic ?? 50}%` }} />
                        </div>
                        <span className="text-gray-700">{(student.normalizedAcademic ?? 50).toFixed(0)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${student.normalizedPhysical ?? 50}%` }} />
                        </div>
                        <span className="text-gray-700">{(student.normalizedPhysical ?? 50).toFixed(0)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">{student.canPlayPiano ? '○' : ''}</td>
                    <td className="px-3 py-2 text-center">{student.isLeader ? '○' : ''}</td>
                    <td className="px-3 py-2 text-center">{student.hasSpecialSupport ? '○' : ''}</td>
                    <td className="px-3 py-2">
                      {(student.totalCarePoints ?? 0) > 0 ? (
                        <span className="inline-flex px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                          {student.totalCarePoints}pt
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {students.length > 20 && (
            <div className="px-5 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-100">
              他 {students.length - 20}名（全{students.length}名）
            </div>
          )}
        </div>
      )}

      {/* 次へボタン */}
      <div className="flex justify-end">
        <button
          onClick={() => onNext(students, academicType, physicalType)}
          disabled={students.length === 0}
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          条件設定へ →
        </button>
      </div>
    </div>
  );
};

export default DataReview;
