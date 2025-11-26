import React from 'react';
import { Search, Radio, Microscope, ArrowUpCircle, Hammer, Move } from 'lucide-react';

interface ActionPanelProps {
    onAction: (action: string) => void;
    influence: number;
}

const ActionButton: React.FC<{ 
    label: string; 
    icon: React.ReactNode; 
    desc: string; 
    color: string;
    onClick: () => void;
}> = ({ label, icon, desc, color, onClick }) => (
    <button 
        onClick={onClick}
        className={`group relative overflow-hidden bg-space-800 border border-gray-700 hover:border-${color} p-2 md:p-4 rounded-lg md:rounded-xl text-left transition-all hover:shadow-[0_0_15px_rgba(0,0,0,0.5)] md:hover:-translate-y-1 active:scale-95`}
    >
        <div className={`absolute top-0 left-0 w-1 h-full bg-${color} group-hover:w-full group-hover:opacity-10 transition-all duration-300`}></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-1 md:gap-3 text-center md:text-left">
            <div className={`p-1.5 md:p-2 rounded-lg bg-black/50 text-${color}`}>
                {icon}
            </div>
            <div>
                <div className="font-bold text-[10px] md:text-lg uppercase tracking-wider">{label}</div>
                <div className="hidden md:block text-xs text-gray-400 font-mono mt-1">{desc}</div>
            </div>
        </div>
    </button>
);

const ActionPanel: React.FC<ActionPanelProps> = ({ onAction, influence }) => {
  return (
    <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 h-full">
        <ActionButton 
            label="Explore" 
            icon={<Search size={18} className="md:w-6 md:h-6" />} 
            desc="Reveal sectors" 
            color="blue-400"
            onClick={() => onAction('EXPLORE')}
        />
        <ActionButton 
            label="Influence" 
            icon={<Radio size={18} className="md:w-6 md:h-6" />} 
            desc={`Available: ${influence}`} 
            color="purple-400"
             onClick={() => onAction('INFLUENCE')}
        />
        <ActionButton 
            label="Research" 
            icon={<Microscope size={18} className="md:w-6 md:h-6" />} 
            desc="Unlock tech" 
            color="pink-400"
             onClick={() => onAction('RESEARCH')}
        />
        <ActionButton 
            label="Upgrade" 
            icon={<ArrowUpCircle size={18} className="md:w-6 md:h-6" />} 
            desc="Blueprints" 
            color="green-400"
             onClick={() => onAction('UPGRADE')}
        />
        <ActionButton 
            label="Build" 
            icon={<Hammer size={18} className="md:w-6 md:h-6" />} 
            desc="Construct ships" 
            color="orange-400"
             onClick={() => onAction('BUILD')}
        />
        <ActionButton 
            label="Move" 
            icon={<Move size={18} className="md:w-6 md:h-6" />} 
            desc="Deploy fleet" 
            color="red-400"
             onClick={() => onAction('MOVE')}
        />
    </div>
  );
};

export default ActionPanel;