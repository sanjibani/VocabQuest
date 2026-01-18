interface ProgressBarProps {
    value: number;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'xp';
    showLabel?: boolean;
    label?: string;
    animated?: boolean;
}

export default function ProgressBar({
    value,
    max = 100,
    size = 'md',
    variant = 'default',
    showLabel = false,
    label,
    animated = true,
}: ProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const sizeStyles = {
        sm: 'h-1.5',
        md: 'h-3',
        lg: 'h-5',
    };

    const variantStyles = {
        default: 'bg-gradient-to-r from-violet-600 to-indigo-600',
        success: 'bg-gradient-to-r from-emerald-500 to-green-500',
        warning: 'bg-gradient-to-r from-amber-500 to-orange-500',
        xp: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500',
    };

    return (
        <div className="w-full">
            {(showLabel || label) && (
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-gray-300">{label}</span>
                    {showLabel && (
                        <span className="text-sm font-medium text-gray-400">
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
            )}
            <div
                className={`w-full bg-gray-700/50 rounded-full overflow-hidden ${sizeStyles[size]}`}
            >
                <div
                    className={`
            ${sizeStyles[size]} rounded-full
            ${variantStyles[variant]}
            ${animated ? 'transition-all duration-500 ease-out' : ''}
          `}
                    style={{ width: `${percentage}%` }}
                >
                    {animated && (
                        <div className="w-full h-full bg-white/20 animate-pulse" />
                    )}
                </div>
            </div>
        </div>
    );
}
