interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  children?: React.ReactNode;
}

export function MetricCard({ title, value, subtitle, icon, children }: MetricCardProps) {
  return (
    <div className="gradient-card gradient-card-hover rounded-2xl p-5 w-full">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-lg">{icon}</span>}
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{title}</p>
      </div>
      <p className="text-3xl font-bold text-white mt-2">{value}</p>
      {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
      {children}
    </div>
  );
}
