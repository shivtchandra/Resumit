import { Building2, Briefcase, Leaf, Target } from 'lucide-react';

interface TargetSelectorProps {
    selected: string | null;
    onSelect: (target: string) => void;
}

const TARGETS = [
    { id: 'taleo', name: 'Taleo', Icon: Building2 },
    { id: 'workday', name: 'Workday', Icon: Briefcase },
    { id: 'greenhouse', name: 'Greenhouse', Icon: Leaf },
    { id: 'icims', name: 'iCIMS', Icon: Target },
];

export const TargetSelector = ({ selected, onSelect }: TargetSelectorProps) => {
    return (
        <div className="space-y-3">
            <label className="block text-sm font-bold text-vault-white uppercase tracking-wider flex items-center gap-2">
                <Building2 size={16} /> Choose Vault (ATS System)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TARGETS.map((target) => {
                    const IconComponent = target.Icon;
                    return (
                        <button
                            key={target.id}
                            onClick={() => onSelect(target.id)}
                            className={`p-4 rounded-lg border-2 transition-all ${selected === target.id
                                ? 'border-heist-red bg-heist-red/20 shadow-vault'
                                : 'border-vault-steel bg-vault-gray hover:border-vault-silver'
                                }`}
                        >
                            <div className="mb-2 flex justify-center">
                                <IconComponent size={32} className="text-vault-white" />
                            </div>
                            <div className="text-sm font-bold text-vault-white">{target.name}</div>
                        </button>
                    );
                })}
            </div>
            <button
                onClick={() => onSelect('auto')}
                className="w-full py-2 text-sm text-vault-silver hover:text-vault-white transition-colors"
            >
                [Auto-Detect]
            </button>
        </div>
    );
};
