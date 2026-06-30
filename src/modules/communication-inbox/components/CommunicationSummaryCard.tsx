interface CommunicationSummaryCardProps {
  label: string;
  value: number;
  tone?: 'default' | 'blue' | 'amber' | 'emerald' | 'violet';
}

const toneClasses: Record<NonNullable<CommunicationSummaryCardProps['tone']>, string> = {
  default: 'border-slate-200 bg-white text-slate-950',
  blue: 'border-blue-200 bg-blue-50 text-blue-900',
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  violet: 'border-violet-200 bg-violet-50 text-violet-900',
};

export function CommunicationSummaryCard({ label, value, tone = 'default' }: CommunicationSummaryCardProps) {
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
