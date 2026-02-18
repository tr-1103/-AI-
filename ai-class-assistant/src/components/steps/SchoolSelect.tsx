import React from 'react';
import { SchoolType } from '../../types/student';
import { SCHOOL_PRESETS } from '../../data/presets';

interface Props {
  onSelect: (schoolType: SchoolType, useSample: boolean) => void;
}

const SCHOOL_ICONS: { [key in SchoolType]: string } = {
  elementary: '🏫',
  middle: '🏫',
  high: '🎓',
};

const SCHOOL_COUNTS: { [key in SchoolType]: string } = {
  elementary: '4クラス / 108名',
  middle: '5クラス / 150名',
  high: '6クラス / 180名',
};

const SchoolSelect: React.FC<Props> = ({ onSelect }) => {
  const [selected, setSelected] = React.useState<SchoolType | null>(null);

  const handleUseSample = () => {
    if (!selected) return;
    onSelect(selected, true);
  };

  const handleUploadOwn = () => {
    if (!selected) return;
    onSelect(selected, false);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">校種を選択してください</h2>
        <p className="text-gray-500 text-lg">
          選択した校種に合わせて、データ形式と最適化パラメータが自動設定されます
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {(Object.keys(SCHOOL_PRESETS) as SchoolType[]).map(type => {
          const preset = SCHOOL_PRESETS[type];
          const isSelected = selected === type;
          return (
            <button
              key={type}
              onClick={() => setSelected(type)}
              className={`relative p-6 rounded-2xl border-2 text-left transition-all hover:shadow-lg
                ${isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                  : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
              <div className="text-4xl mb-3">{SCHOOL_ICONS[type]}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{preset.label}</h3>
              <p className="text-sm text-gray-500 mb-4">{preset.description}</p>
              <div className="bg-gray-100 rounded-lg px-3 py-2">
                <p className="text-xs font-medium text-gray-600">サンプル規模</p>
                <p className="text-sm font-bold text-gray-800">{SCHOOL_COUNTS[type]}</p>
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-500">デフォルト学力形式:</p>
                <p className="text-sm font-medium text-gray-700">
                  {preset.defaultAcademicInput === 'scale_3' ? '3段階（◎○△）' :
                   preset.defaultAcademicInput === 'scale_5' ? '5段階（1〜5）' :
                   preset.defaultAcademicInput === 'deviation' ? '偏差値' :
                   preset.defaultAcademicInput}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">
            {SCHOOL_PRESETS[selected].label}を選択しました
          </h3>
          <p className="text-gray-600 text-sm mb-6">
            データの読み込み方法を選択してください：
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleUseSample}
              className="flex flex-col items-center gap-2 p-5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <span className="text-2xl">📊</span>
              <span className="font-bold text-lg">サンプルデータで試す</span>
              <span className="text-blue-100 text-sm">108名のデモデータを読込</span>
            </button>
            <button
              onClick={handleUploadOwn}
              className="flex flex-col items-center gap-2 p-5 bg-white text-gray-700 rounded-xl border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <span className="text-2xl">📂</span>
              <span className="font-bold text-lg">Excelから読み込む</span>
              <span className="text-gray-500 text-sm">.xlsx / .xls ファイルを選択</span>
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-amber-500 text-xl">🔒</span>
          <div>
            <p className="font-bold text-amber-800 text-sm">完全オフライン動作</p>
            <p className="text-amber-700 text-xs mt-1">
              入力されたすべてのデータはお使いのPC内にのみ保存されます。
              外部サーバーへの送信は一切行いません（文科省情報セキュリティガイドライン準拠）。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolSelect;
