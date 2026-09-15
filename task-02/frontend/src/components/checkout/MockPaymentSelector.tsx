import React from 'react';
import { CheckCircle2, XCircle, Clock, Info } from 'lucide-react';
import { MockPaymentMode } from '../../types';

interface MockPaymentSelectorProps {
  selectedMode: MockPaymentMode;
  onChange: (mode: MockPaymentMode) => void;
  disabled?: boolean;
}

export const MockPaymentSelector: React.FC<MockPaymentSelectorProps> = ({
  selectedMode,
  onChange,
  disabled = false,
}) => {
  const options: {
    mode: MockPaymentMode;
    title: string;
    description: string;
    icon: React.ReactNode;
    colorClass: string;
    activeBorderClass: string;
  }[] = [
    {
      mode: 'MOCK_SUCCESS',
      title: 'Credit Card (Success)',
      description: 'Simulates an approved card payment. Your order will be confirmed immediately.',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      colorClass: 'text-emerald-400',
      activeBorderClass: 'border-emerald-500 bg-emerald-500/10',
    },
    {
      mode: 'MOCK_FAILURE',
      title: 'Card Declined',
      description: 'Simulates an insufficient funds or declined card. Your held items are released.',
      icon: <XCircle className="w-5 h-5 text-rose-400" />,
      colorClass: 'text-rose-400',
      activeBorderClass: 'border-rose-500 bg-rose-500/10',
    },
    {
      mode: 'MOCK_TIMEOUT',
      title: 'Gateway Timeout',
      description: 'Simulates a network timeout. Your items remain held so you can retry payment.',
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      colorClass: 'text-amber-400',
      activeBorderClass: 'border-amber-500 bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-emerald-400" />
          Payment Simulation Mode:
        </label>
        <span className="text-xs text-slate-400">Select test scenario</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {options.map((opt) => {
          const isSelected = selectedMode === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.mode)}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? `${opt.activeBorderClass} shadow-lg ring-1 ring-emerald-500/30`
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 text-slate-300'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                {opt.icon}
                <span className={`font-semibold text-sm ${opt.colorClass}`}>
                  {opt.title}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {opt.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
