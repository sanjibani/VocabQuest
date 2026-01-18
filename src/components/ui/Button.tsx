import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'cta';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        const baseStyles = `
      inline-flex items-center justify-center font-semibold rounded-xl
      transition-all duration-200 ease-out
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
      disabled:opacity-50 disabled:cursor-not-allowed
      transform hover:scale-[1.02] active:scale-[0.98]
    `;

        const variantStyles = {
            primary: `
        bg-gradient-to-r from-violet-600 to-indigo-600
        hover:from-violet-500 hover:to-indigo-500
        text-white shadow-lg shadow-violet-500/25
        focus:ring-violet-500
      `,
            secondary: `
        bg-gradient-to-r from-gray-700 to-gray-800
        hover:from-gray-600 hover:to-gray-700
        text-white shadow-lg shadow-gray-900/50
        focus:ring-gray-500
      `,
            outline: `
        border-2 border-violet-500 text-violet-400
        hover:bg-violet-500/10
        focus:ring-violet-500
      `,
            ghost: `
        text-gray-300 hover:text-white
        hover:bg-white/5
        focus:ring-gray-500
      `,
            danger: `
        bg-gradient-to-r from-red-600 to-rose-600
        hover:from-red-500 hover:to-rose-500
        text-white shadow-lg shadow-red-500/25
        focus:ring-red-500
      `,
            success: `
        bg-gradient-to-r from-emerald-600 to-green-600
        hover:from-emerald-500 hover:to-green-500
        text-white shadow-lg shadow-emerald-500/25
        focus:ring-emerald-500
      `,
            cta: `
        bg-gradient-to-r from-amber-500 to-orange-600
        hover:from-amber-400 hover:to-orange-500
        text-white font-bold shadow-lg shadow-orange-500/25
        focus:ring-orange-500 transform hover:scale-105
      `,
        };

        const sizeStyles = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-5 py-2.5 text-base',
            lg: 'px-8 py-4 text-lg',
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && (
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
