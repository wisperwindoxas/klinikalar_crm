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
      className={`relative z-10 tracking-tight transition-all duration-150 leading-none select-none ${
        isActive
          ? 'text-white font-black text-[14.5px] drop-shadow-sm'
          : 'text-slate-700 group-hover:text-slate-950 group-hover:translate-x-0.5 font-bold text-[14px]'
      }`}
    >
      {text}
    </span>
  );
};
