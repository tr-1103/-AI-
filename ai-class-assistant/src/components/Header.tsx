import React from 'react';
import { Users } from 'lucide-react';

interface Props {
  currentStep: number;
}

const STEPS = [
  { label: '校種選択', description: 'Step 0' },
  { label: 'データ確認', description: 'Step 1' },
  { label: '条件設定', description: 'Step 2' },
  { label: '結果確認', description: 'Step 3' },
];

const Header: React.FC<Props> = ({ currentStep }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">AIクラス編成アシスタント</h1>
              <p className="text-xs text-gray-500">完全オフライン | 文科省ガイドライン準拠</p>
            </div>
          </div>

          {/* ステップバー */}
          <nav className="flex items-center gap-1">
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStep;
              const isDone = idx < currentStep;
              return (
                <div key={idx} className="flex items-center">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : isDone
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                    }`}>
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold
                      ${isActive ? 'bg-white text-blue-600' : isDone ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'}`}>
                      {isDone ? '✓' : idx}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-6 h-0.5 mx-0.5 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
