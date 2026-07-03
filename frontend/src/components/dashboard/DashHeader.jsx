import { cn } from '@/utils/format.js';

export const DashHeader = ({ eyebrow, title, subtitle, actions, className }) => (
  <div className={cn('mb-10 md:mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6', className)}>
    <div>
      {eyebrow && <div className="text-eyebrow mb-4">{eyebrow}</div>}
      <h1 className="text-display-lg">{title}</h1>
      {subtitle && <p className="text-slate mt-4 max-w-xl leading-relaxed">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-3">{actions}</div>}
  </div>
);

export const DashEmpty = ({ title, subtitle, action }) => (
  <div className="border border-dashed border-hairline p-12 md:p-16 text-center">
    <div className="text-eyebrow mb-4">Empty</div>
    <div className="text-display-sm mb-2">{title}</div>
    {subtitle && <p className="text-slate max-w-md mx-auto leading-relaxed">{subtitle}</p>}
    {action && <div className="mt-8">{action}</div>}
  </div>
);
