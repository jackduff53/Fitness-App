interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  children?: React.ReactNode;
}

export function MetricCard({ title, value, subtitle, children }: MetricCardProps) {
  return (
    <div className="bg-card rounded-xl p-4 w-full">
      <p className="text-sm text-text-secondary">{title}</p>
      <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
      {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
      {children}
    </div>
  );
}
