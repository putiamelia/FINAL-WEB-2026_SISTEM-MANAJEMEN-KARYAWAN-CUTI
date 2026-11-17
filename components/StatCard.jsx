import React from 'react';

export default function StatCard({ label, value, subtext, progress = null, icon: Icon = null }) {
  return (
    <div className="bg-white rounded-md border border-[#D9DEE5] p-4 sm:p-5 flex flex-col justify-between shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] sm:text-xs font-semibold text-[#4A5565] uppercase tracking-wider leading-tight">
          {label}
        </span>
        {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#C8A24A] shrink-0" aria-hidden="true" />}
      </div>

      <div className="mt-2">
        <div className="text-2xl sm:text-3xl font-bold text-[#13315C] tracking-tight">
          {value}
        </div>
        {subtext && (
          <p className="text-[11px] sm:text-xs text-[#4A5565] mt-1 leading-snug">
            {subtext}
          </p>
        )}
      </div>

      {progress !== null && (
        <div className="mt-3">
          <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#13315C] h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
