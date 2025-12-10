interface TargetSelectorProps {
    selected: string | null;
    onSelect: (target: string) => void;
}

const TARGETS = [
    { id: 'taleo', name: 'Taleo', icon: '🏢' },
    { id: 'workday', name: 'Workday', icon: '💼' },
    { id: 'greenhouse', name: 'Greenhouse', icon: '🌿' },
    { id: 'icims', name: 'iCIMS', icon: '🎯' },
];

export const TargetSelector = ({ selected, onSelect }: TargetSelectorProps) => {
    return (
        <div className="space-y-3">
            <label className="block text-sm font-bold text-vault-white uppercase tracking-wider">
                🏢 Choose Vault (ATS System)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TARGETS.map((target) => (
                    <button
                        key={target.id}
                        onClick={() => onSelect(target.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${selected === target.id
                            ? 'border-heist-red bg-heist-red/20 shadow-vault'
                            : 'border-vault-steel bg-vault-gray hover:border-vault-silver'
                            }`}
                    >
                        <div className="text-3xl mb-2">{target.icon}</div>
                        <div className="text-sm font-bold text-vault-white">{target.name}</div>
                    </button>
                ))}
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
