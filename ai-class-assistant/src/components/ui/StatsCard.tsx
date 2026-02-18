import React from 'react';
import { ClassStats } from '../../types/student';
import { CARE_COLORS, CARE_CATEGORY_LABELS, CLASS_COLORS } from '../../data/presets';
import { CareCategory } from '../../types/student';

interface Props {
  stats: ClassStats;
  isSelected?: boolean;
}

interface StatRowProps {
  label: string;
  value: string | number;
  bar?: number; // 0〜100 のパーセンテージ
  barColor?: string;
}

const StatRow: React.FC<StatRowProps> = ({ label, value, bar, barColor = '#2563eb' }) => (
  <div className="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0">
    <span className="text-gray-500 text-xs flex-shrink-0 w-24">{label}</span>
    <div className="flex-1 flex items-center gap-2">
      {bar !== undefined && (
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${bar}%`, backgroundColor: barColor }} />
        </div>
      )}
      <span className="text-gray-800 text-xs font-medium flex-shrink-0">{value}</span>
    </div>
  </div>
);

const StatsCard: React.FC<Props> = ({ stats, isSelected = false }) => {
  const classColor = CLASS_COLORS[(stats.classNumber - 1) % CLASS_COLORS.length];
  const categories: CareCategory[] = ['learning', 'behavior', 'relationship', 'family', 'health'];

  return (
    <div className={`bg-white rounded-xl border-2 transition-all ${isSelected ? 'border-blue-400 shadow-lg' : 'border-gray-200'}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: classColor }} />
          <span className="font-bold text-gray-900">{stats.classNumber}組</span>
        </div>
        <span className="text-2xl font-bold text-gray-900">{stats.total}<span className="text-sm font-normal text-gray-500">名</span></span>
      </div>

      {/* 統計 */}
      <div className="px-4 py-3">
        <StatRow
          label="男女比"
          value={`男${stats.maleCount} / 女${stats.femaleCount}`}
          bar={stats.maleRatio * 100}
          barColor="#3b82f6"
        />
        <StatRow
          label="学力平均"
          value={`${stats.avgAcademic}点`}
          bar={stats.avgAcademic}
          barColor="#3b82f6"
        />
        <StatRow
          label="運動平均"
          value={`${stats.avgPhysical}点`}
          bar={stats.avgPhysical}
          barColor="#10b981"
        />
        <StatRow
          label="ピアノ伴奏"
          value={`${stats.pianoCount}名`}
          bar={stats.pianoCount > 0 ? 100 : 0}
          barColor={stats.pianoCount > 0 ? '#8b5cf6' : '#ef4444'}
        />
        <StatRow
          label="リーダー"
          value={`${stats.leaderCount}名`}
        />
        <StatRow
          label="特別支援"
          value={`${stats.specialSupportCount}名`}
        />
        <StatRow
          label="不登校傾向"
          value={`${stats.absenceTendencyCount}名`}
        />
        <StatRow
          label="配慮合計Pt"
          value={`${stats.totalCarePoints}pt`}
        />
      </div>

      {/* カテゴリ別配慮 */}
      {Object.keys(stats.categoryBreakdown).length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs font-medium text-gray-500 mb-2">配慮カテゴリ内訳</p>
          <div className="flex flex-wrap gap-1">
            {categories.map(cat => {
              const data = stats.categoryBreakdown[cat];
              if (!data) return null;
              return (
                <div
                  key={cat}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white"
                  style={{ backgroundColor: CARE_COLORS[cat] }}
                  title={`${CARE_CATEGORY_LABELS[cat]}: ${data.count}名（重度${data.severe}名）`}
                >
                  <span>{CARE_CATEGORY_LABELS[cat].slice(0, 2)}</span>
                  <span className="font-bold">{data.count}</span>
                  {data.severe > 0 && <span className="opacity-75">(!{data.severe})</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 旧クラス分布 */}
      {Object.keys(stats.formerClasses).length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs font-medium text-gray-500 mb-2">旧クラス出身</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(stats.formerClasses)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([cls, count]) => (
                <span key={cls} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {cls}組: {count}名
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
