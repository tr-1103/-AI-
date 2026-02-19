import React from 'react';
import { SchoolType } from '../../types/student';
import { SCHOOL_PRESETS } from '../../data/presets';

interface SelectOptions {
  isTransition: boolean;
  sourceSchoolType?: SchoolType;
}

interface Props {
  onSelect: (schoolType: SchoolType, useSample: boolean, options?: SelectOptions) => void;
}

const SCHOOL_LABELS: { [key in SchoolType]: string } = {
  elementary: '小学校',
  middle: '中学校',
  high: '高校',
};

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
  const [mode, setMode] = React.useState<'normal' | 'transition'>('normal');
  // normal mode: selected = destination school
  // transition mode: sourceSelected = current school, destSelected = destination school
  const [selected, setSelected] = React.useState<SchoolType | null>(null);
  const [sourceSelected, setSourceSelected] = React.useState<SchoolType | null>(null);
  const [destSelected, setDestSelected] = React.useState<SchoolType | null>(null);

  const handleUseSample = () => {
    if (mode === 'normal') {
      if (!selected) return;
      onSelect(selected, true);
    } else {
      if (!sourceSelected || !destSelected) return;
      onSelect(destSelected, true, { isTransition: true, sourceSchoolType: sourceSelected });
    }
  };

  const handleUploadOwn = () => {
    if (mode === 'normal') {
      if (!selected) return;
      onSelect(selected, false);
    } else {
      if (!sourceSelected || !destSelected) return;
      onSelect(destSelected, false, { isTransition: true, sourceSchoolType: sourceSelected });
    }
  };

  const isReady = mode === 'normal' ? !!selected : (!!sourceSelected && !!destSelected);

  const schoolTypes: SchoolType[] = ['elementary', 'middle', 'high'];

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">校種を選択してください</h2>
        <p className="text-gray-500 text-lg">
          選択した校種に合わせて、データ形式と最適化パラメータが自動設定されます
        </p>
      </div>

      {/* モード切替 */}
      <div className="flex gap-3 mb-8 justify-center">
        <button
          onClick={() => { setMode('normal'); setSelected(null); setSourceSelected(null); setDestSelected(null); }}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all border-2
            ${mode === 'normal'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
            }`}
        >
          通常のクラス編成
        </button>
        <button
          onClick={() => { setMode('transition'); setSelected(null); setSourceSelected(null); setDestSelected(null); }}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all border-2
            ${mode === 'transition'
              ? 'bg-orange-500 text-white border-orange-500 shadow-md'
              : 'bg-white text-gray-700 border-gray-300 hover:border-orange-300'
            }`}
        >
          🎓 進学時の再編成（校種変更）
        </button>
      </div>

      {/* 通常モード */}
      {mode === 'normal' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {(Object.keys(SCHOOL_PRESETS) as SchoolType[]).map(type => {
            const preset = SCHOOL_PRESETS[type];
            const isSelectedItem = selected === type;
            return (
              <button
                key={type}
                onClick={() => setSelected(type)}
                className={`relative p-6 rounded-2xl border-2 text-left transition-all hover:shadow-lg
                  ${isSelectedItem
                    ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
              >
                {isSelectedItem && (
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
      )}

      {/* 進学時の再編成モード */}
      {mode === 'transition' && (
        <div className="mb-10">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-orange-500 text-xl mt-0.5">🎓</span>
            <div>
              <p className="font-bold text-orange-800 text-sm">進学時の再編成モード</p>
              <p className="text-orange-700 text-xs mt-1">
                卒業・進学に伴い、現在の校種のデータを進学先の校種のクラス数に再編成します。
                例：小学6年（3クラス）→ 中学1年（8クラス）への再編
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 現在の校種（データ形式） */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-gray-500 text-white flex items-center justify-center text-sm font-bold">現</div>
                <h3 className="font-bold text-gray-800">現在の校種（データ形式）</h3>
              </div>
              <div className="flex flex-col gap-3">
                {schoolTypes.map(type => {
                  const preset = SCHOOL_PRESETS[type];
                  const isSelectedItem = sourceSelected === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSourceSelected(type)}
                      className={`p-4 rounded-xl border-2 text-left transition-all
                        ${isSelectedItem
                          ? 'border-gray-600 bg-gray-100 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-400'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{SCHOOL_ICONS[type]}</span>
                          <span className="font-bold text-gray-900">{preset.label}</span>
                        </div>
                        {isSelectedItem && <span className="text-gray-600 font-bold text-lg">✓</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">
                        学力形式: {preset.defaultAcademicInput === 'scale_3' ? '3段階（◎○△）' :
                                   preset.defaultAcademicInput === 'scale_5' ? '5段階（1〜5）' :
                                   preset.defaultAcademicInput === 'deviation' ? '偏差値' :
                                   preset.defaultAcademicInput}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 矢印 */}
            <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 mt-16 text-3xl text-gray-400">→</div>

            {/* 進学先の校種（最適化設定） */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">先</div>
                <h3 className="font-bold text-gray-800">進学先の校種（最適化設定）</h3>
              </div>
              <div className="flex flex-col gap-3">
                {schoolTypes.map(type => {
                  const preset = SCHOOL_PRESETS[type];
                  const isSelectedItem = destSelected === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setDestSelected(type)}
                      disabled={type === sourceSelected}
                      className={`p-4 rounded-xl border-2 text-left transition-all
                        ${isSelectedItem
                          ? 'border-orange-500 bg-orange-50 shadow-md'
                          : type === sourceSelected
                          ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                          : 'border-gray-200 bg-white hover:border-orange-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{SCHOOL_ICONS[type]}</span>
                          <span className="font-bold text-gray-900">{preset.label}</span>
                        </div>
                        {isSelectedItem && <span className="text-orange-500 font-bold text-lg">✓</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">
                        デフォルトクラス数: {preset.defaultNumClasses}クラス
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 遷移プレビュー */}
          {sourceSelected && destSelected && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-blue-800 font-bold text-base">
                {SCHOOL_LABELS[sourceSelected]} →{' '}
                <span className="text-orange-600">{SCHOOL_LABELS[destSelected]}</span> への再編成
              </p>
              <p className="text-blue-600 text-sm mt-1">
                現在のデータ形式（{SCHOOL_PRESETS[sourceSelected].label}式）を読み込み、
                {SCHOOL_LABELS[destSelected]}の{SCHOOL_PRESETS[destSelected].defaultNumClasses}クラス編成に最適化します。
                クラス数は次の画面で変更できます。
              </p>
            </div>
          )}
        </div>
      )}

      {/* データ読み込み方法選択 */}
      {isReady && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">
            {mode === 'normal'
              ? `${SCHOOL_PRESETS[selected!].label}を選択しました`
              : `${SCHOOL_LABELS[sourceSelected!]} → ${SCHOOL_LABELS[destSelected!]} の再編成`
            }
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
              <span className="text-blue-100 text-sm">デモデータを読込</span>
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
