import PropTypes from 'prop-types';

export const ButtonPrimary = ({ href, label, icon, classes = '', onClick }) => {
    const Tag = href ? 'a' : 'button';
    return (
        <Tag
            href={href}
            onClick={onClick}
            className={`btn btn-primary ${classes}`}
        >
            {label}
            {icon && (
                <span className="material-symbols-rounded">
                    {icon}
                </span>
            )}
        </Tag>
    );
};

export const ButtonOutline = ({ href, label, icon, classes = '', onClick }) => {
    const Tag = href ? 'a' : 'button';
    return (
        <Tag
            href={href}
            onClick={onClick}
            className={`btn btn-outline ${classes}`}
        >
            {label}
            {icon && (
                <span className="material-symbols-rounded">
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
    onClick: PropTypes.func
};

ButtonOutline.propTypes = {
    href: PropTypes.string,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string,
    classes: PropTypes.string,
    onClick: PropTypes.func
}; 