'use client';

import { Lock } from 'lucide-react';
import { InputHTMLAttributes } from 'react';

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export default function PhoneInput({ label = 'Phone Number', error, className = '', ...props }: PhoneInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-bold text-gray-700">{label}</label>
      )}
      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#002b5b] focus-within:ring-2 focus-within:ring-[#002b5b]/10 transition-all bg-white">
        <span className="px-3 py-3.5 text-sm font-semibold text-gray-500 bg-gray-50 border-r border-gray-200 select-none">
          🇶🇦 +974
        </span>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="5x xxx xxxx"
          className={`flex-1 px-3 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-gray-400">
          <Lock size={11} className="text-[#002b5b] flex-shrink-0" />
          Your number is never shared without your permission
        </p>
      )}
    </div>
  );
}
