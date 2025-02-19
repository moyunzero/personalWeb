// 颜色配置
export const COLORS = {
    primary: {
        50: '#f0f9ff',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
    },
    zinc: {
        50: '#fafafa',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b',
    }
};

// 间距配置
export const SPACING = {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
};

// 字体配置
export const TYPOGRAPHY = {
    fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        serif: ['Lora', 'serif'],
    },
    fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
    },
    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    }
};

// 动画配置
export const ANIMATIONS = {
    transition: {
        fast: 'all 0.2s ease',
        normal: 'all 0.3s ease',
        slow: 'all 0.5s ease',
    },
    keyframes: {
        fadeIn: {
            from: { opacity: 0 },
            to: { opacity: 1 },
        },
        slideUp: {
            from: { transform: 'translateY(20px)', opacity: 0 },
            to: { transform: 'translateY(0)', opacity: 1 },
        },
    }
};

// 布局配置
export const LAYOUT = {
    container: {
        maxWidth: '1280px',
        padding: '0 1rem',
    },
    breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
    }
}; 