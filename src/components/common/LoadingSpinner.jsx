import PropTypes from 'prop-types';

/**
 * 加载状态组件
 * @param {Object} props - 组件属性
 * @param {string} props.size - 尺寸大小 ('sm' | 'md' | 'lg')
 * @param {string} props.className - 额外的 CSS 类名
 */
const LoadingSpinner = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'h-6 w-6 border-t-2 border-b-2',
        md: 'h-12 w-12 border-t-2 border-b-2',
        lg: 'h-16 w-16 border-t-2 border-b-2'
    };

    return (
        <div className={`w-full h-screen flex items-center justify-center ${className}`}>
            <div 
                className={`animate-spin rounded-full ${sizeClasses[size]} border-sky-400`}
                role="status"
                aria-label="加载中"
            >
                <span className="sr-only">加载中...</span>
            </div>
        </div>
    );
};

LoadingSpinner.propTypes = {
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    className: PropTypes.string
};

export default LoadingSpinner;
