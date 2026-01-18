import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'outline';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', variant = 'default', padding = 'md', children, ...props }, ref) => {
        const variantStyles = {
            default: `
        bg-gray-800/80 backdrop-blur-sm
        border border-gray-700/50
        shadow-xl shadow-black/20
      `,
            glass: `
        bg-white/5 backdrop-blur-xl
        border border-white/10
        shadow-2xl shadow-violet-500/5
      `,
            outline: `
        bg-transparent
        border-2 border-gray-700
      `,
        };

        const paddingStyles = {
            none: '',
            sm: 'p-3',
            md: 'p-5',
            lg: 'p-8',
        };

        return (
            <div
                ref={ref}
                className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

export default Card;
