import React from 'react';

interface DancingMenuTextProps {
  text: string;
  isActive: boolean;
  isIdle?: boolean;
  MenuIcon?: React.ElementType;
}

export const DancingMenuText: React.FC<DancingMenuTextProps> = ({
  text,
  isActive,
}) => {
  return (
    <span
      className={`relative z-10 tracking-tight transition-all duration-150 leading-none ${
        isActive
          ? 'text-white font-extrabold text-[13px] drop-shadow-sm'
          : 'text-slate-600 group-hover:text-slate-900 group-hover:translate-x-0.5 font-semibold text-[13px]'
      }`}
    >
      {text}
    </span>
  );
};
