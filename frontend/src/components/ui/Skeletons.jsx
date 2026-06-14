import { motion } from 'framer-motion';

export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

export const StatCardSkeleton = () => (
  <div className="stat-card">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <Skeleton className="w-16 h-5 rounded-full" />
    </div>
    <Skeleton className="w-24 h-8 rounded-lg mb-1" />
    <Skeleton className="w-32 h-4 rounded" />
  </div>
);

export const LinkCardSkeleton = () => (
  <div className="glass-card p-4">
    <div className="flex items-start gap-3">
      <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="w-3/4 h-4 rounded mb-2" />
        <Skeleton className="w-1/2 h-3 rounded mb-3" />
        <div className="flex gap-2">
          <Skeleton className="w-16 h-5 rounded-full" />
          <Skeleton className="w-20 h-5 rounded-full" />
        </div>
      </div>
      <Skeleton className="w-20 h-8 rounded-lg flex-shrink-0" />
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <tr>
    {[...Array(5)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className={`h-4 rounded ${i === 0 ? 'w-48' : i === 1 ? 'w-32' : 'w-16'}`} />
      </td>
    ))}
  </tr>
);

export const ChartSkeleton = ({ height = 200 }) => (
  <div className="relative overflow-hidden rounded-xl" style={{ height }}>
    <Skeleton className="w-full h-full" />
    <div className="absolute inset-0 flex items-end gap-2 p-4">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm opacity-30"
          style={{
            height: `${30 + Math.random() * 60}%`,
            background: 'rgba(99,102,241,0.3)',
          }}
        />
      ))}
    </div>
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <motion.div
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
      style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
      {Icon && <Icon size={28} className="text-indigo-400" />}
    </div>
    <h3 className="text-lg font-semibold text-slate-200 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm max-w-xs mb-6">{description}</p>
    {action}
  </motion.div>
);

export const ErrorState = ({ message, onRetry }) => (
  <motion.div
    className="flex flex-col items-center justify-center py-12 px-4 text-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
      <span className="text-2xl">⚠️</span>
    </div>
    <p className="text-red-400 font-medium mb-2">Something went wrong</p>
    <p className="text-slate-500 text-sm mb-5">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-secondary text-sm px-4 py-2">
        Try again
      </button>
    )}
  </motion.div>
);

export const LoadingSpinner = ({ size = 20, className = '' }) => (
  <div
    className={`border-2 border-transparent border-t-indigo-500 border-r-violet-500 rounded-full animate-spin ${className}`}
    style={{ width: size, height: size }}
  />
);
