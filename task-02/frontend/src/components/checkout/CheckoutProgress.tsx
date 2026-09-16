import React from 'react';
import { Check } from 'lucide-react';

export interface CheckoutStep {
  id: number;
  label: string;
}

interface CheckoutProgressProps {
  steps: CheckoutStep[];
  currentStep: number;
}

/**
 * Shared progress indicator used across Cart, Delivery, and Payment screens.
 * Clean, restrained design with no glows or neon highlights.
 */
export const CheckoutProgress: React.FC<CheckoutProgressProps> = ({
  steps,
  currentStep,
}) => {
  return (
    <nav aria-label="Checkout progress" className="flex items-center justify-center">
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-2.5">
              {/* Step indicator */}
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-[#4FB7A5] text-[#080A0F]'
                    : isCurrent
                    ? 'bg-[#151922] border border-[#4FB7A5] text-[#4FB7A5]'
                    : 'bg-[#10131A] border border-[#242A35] text-[#6F7682]'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>

              {/* Step label */}
              <span
                className={`text-xs font-medium transition-colors ${
                  isCompleted
                    ? 'text-[#4FB7A5]'
                    : isCurrent
                    ? 'text-[#F5F3EE] font-semibold'
                    : 'text-[#6F7682]'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={`mx-3 sm:mx-5 h-px w-8 sm:w-16 transition-colors ${
                  isCompleted ? 'bg-[#4FB7A5]/50' : 'bg-[#242A35]'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export const CHECKOUT_STEPS: CheckoutStep[] = [
  { id: 1, label: 'Cart' },
  { id: 2, label: 'Delivery' },
  { id: 3, label: 'Payment' },
];
