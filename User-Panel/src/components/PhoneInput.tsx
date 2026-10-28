import React from 'react';
import { Phone } from 'lucide-react';
import { formatUzbekPhone } from '../utils/phone';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  autoFocus?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = '+998 (90) 123-45-67',
  className = '',
  required = false,
  disabled = false,
  id,
  autoFocus = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Format to +998 (XX) XXX-XX-XX
    const formatted = formatUzbekPhone(raw);
    onChange(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If input is just '+998 ' and user presses Backspace, prevent deleting prefix
    if ((value === '+998 ' || value === '+998' || value.length <= 5) && e.key === 'Backspace') {
      e.preventDefault();
      onChange('+998 ');
    }
  };

  const handleFocus = () => {
    if (!value || value.trim() === '' || value === '+998') {
      onChange('+998 ');
    }
  };

  return (
    <div className="relative w-full">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center gap-1.5">
        <Phone className="w-4 h-4 text-[#00897B]" />
      </div>
      <input
        type="tel"
        id={id}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        value={value || '+998 '}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00897B]/20 focus:border-[#00897B] transition font-mono ${className}`}
      />
    </div>
  );
};
