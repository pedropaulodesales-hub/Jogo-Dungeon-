import React from 'react';
import { ORNATE_BORDER } from '../constants';

interface RunePanelProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const RunePanel: React.FC<RunePanelProps> = ({ children, title, className = "" }) => {
  return (
    <div className={`panel-border p-5 rounded-sm ${className}`}>
      {ORNATE_BORDER}
      {title && (
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3 relative z-10">
          <div className="flex items-center space-x-2">
            <span className="text-slate-700 text-xs exocet-font opacity-40">᚛</span>
            <h2 className="text-xl font-bold exocet-font text-slate-300 tracking-[0.2em] uppercase">{title}</h2>
            <span className="text-slate-700 text-xs exocet-font opacity-40">᚜</span>
          </div>
          <div className="flex space-x-3">
            <span className="text-slate-700 text-sm animate-pulse-rune">ᚱ</span>
            <span className="text-slate-700 text-sm animate-pulse-rune" style={{ animationDelay: '1s' }}>ᛟ</span>
          </div>
        </div>
      )}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
};

export default RunePanel;