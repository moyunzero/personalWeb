import PropTypes from 'prop-types';

export const ButtonPrimary = ({ 
    href, 
    label, 
    icon, 
    classes = '', 
    onClick, 
    disabled = false,
    loading = false,
    iconPosition = 'right' // 'left' | 'right'
}) => {
    const Tag = href ? 'a' : 'button';
    const isDisabled = disabled || loading;
    
    return (
        <Tag
            href={href}
            onClick={onClick}
            disabled={isDisabled}
            className={`btn btn-primary ${classes} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-busy={loading}
            aria-disabled={isDisabled}
        >
            {loading && (
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-zinc-950" aria-hidden="true"></span>
            )}
            {icon && iconPosition === 'left' && !loading && (
                <span className="material-symbols-rounded" aria-hidden="true">
                    {icon}
                </span>
            )}
            {label}
            {icon && iconPosition === 'right' && !loading && (
                <span className="material-symbols-rounded" aria-hidden="true">
                    {icon}
                </span>
            )}
        </Tag>
    );
};

export const ButtonOutline = ({ 
    href, 
    label, 
    icon, 
    classes = '', 
    onClick, 
    disabled = false,
    loading = false,
    iconPosition = 'right' // 'left' | 'right'
}) => {
    const Tag = href ? 'a' : 'button';
    const isDisabled = disabled || loading;
    
    return (
        <Tag
            href={href}
            onClick={onClick}
            disabled={isDisabled}
            className={`btn btn-outline ${classes} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-busy={loading}
            aria-disabled={isDisabled}
        >
            {loading && (
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-zinc-50" aria-hidden="true"></span>
            )}
            {icon && iconPosition === 'left' && !loading && (
                <span className="material-symbols-rounded" aria-hidden="true">
                    {icon}
                </span>
            )}
            {label}
            {icon && iconPosition === 'right' && !loading && (
                <span className="material-symbols-rounded" aria-hidden="true">
                    {icon}
                </span>
            )}
        </Tag>
    );
};

ButtonPrimary.propTypes = {
    href: PropTypes.string,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string,
    classes: PropTypes.string,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    iconPosition: PropTypes.oneOf(['left', 'right'])
};

ButtonOutline.propTypes = {
    href: PropTypes.string,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string,
    classes: PropTypes.string,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    iconPosition: PropTypes.oneOf(['left', 'right'])
}; 