import { Badge } from '@/components/ui/badge';

interface EntityGroup {
    category: string;
    items: string[];
}

interface EntityHighlighterProps {
    entities: EntityGroup[];
}

export const EntityHighlighter = ({ entities }: EntityHighlighterProps) => {
    return (
        <div className="space-y-6">
            {entities.map((group) => (
                <div key={group.category}>
                    <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
                        {group.category}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {group.items.map((item, index) => (
                            <Badge
                                key={index}
                                variant="secondary"
                                className="bg-slate-100 text-primary hover:bg-slate-200 border-border-subtle font-normal px-3 py-1"
                            >
                                {item}
                            </Badge>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
