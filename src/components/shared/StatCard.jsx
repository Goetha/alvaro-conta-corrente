const variantStyles = {
  default: {
    border: 'border-l-slate-400',
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
    valueText: 'text-slate-800',
  },
  success: {
    border: 'border-l-emerald-500',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    valueText: 'text-emerald-700',
  },
  danger: {
    border: 'border-l-red-500',
    iconBg: 'bg-red-50',
    iconText: 'text-red-600',
    valueText: 'text-red-700',
  },
  warning: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    valueText: 'text-amber-700',
  },
  info: {
    border: 'border-l-blue-500',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    valueText: 'text-blue-700',
  },
};

export function StatCard({ title, value, icon: Icon, variant = 'default', subtitle, action }) {
  const styles = variantStyles[variant] || variantStyles.default;
  return (
    <div className={`bg-white rounded-xl border border-l-4 ${styles.border} border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
            {action && <div className="ml-2">{action}</div>}
          </div>
          <p className={`text-xl font-bold ${styles.valueText} leading-tight`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`${styles.iconBg} ${styles.iconText} p-2.5 rounded-lg flex-shrink-0 ml-3`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
