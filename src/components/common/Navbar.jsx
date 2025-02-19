/**
 * Node Modules
 */
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const Navbar = ({navOpen, setNavOpen}) => {
    const location = useLocation();
    const navItems = [
        {
            label: '首页',
            href: 'home'
        },
        {
            label: '关于',
            href: 'about'
        },
        {
            label: '技能',
            href: 'skill'
        },
        {
            label: '作品',
            href: 'work'
        },
        {
            label: '评价',
            href: 'review'
        },
        {
            label: '联系',
            href: 'contact'
        },
        {
            label: '博客',
            href: '/blog',
            isRoute: true
        }
    ];

    // 处理路由中的hash
    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                setTimeout(() => {
                    const offset = element.offsetTop - 80;
                    window.scrollTo({
                        top: offset,
                        behavior: 'smooth'
                    });
                }, 0);
            }
        }
    }, [location]);

    const handleScroll = (e, href) => {
        e.preventDefault();
        setNavOpen(false);
        
        const element = document.getElementById(href);
        if (element) {
            const offset = element.offsetTop - 80;
            window.scrollTo({
                top: offset,
                behavior: 'smooth'
            });
        }
    };

    return (
        <nav className={'navbar' + (navOpen ? ' active' : '')}>
            {navItems.map(({label, href, isRoute}, key) => (
                isRoute ? (
                    <Link
                        key={key}
                        to={href}
                        className="nav-link"
                        onClick={() => setNavOpen(false)}
                    >
                        {label}
                    </Link>
                ) : (
                    <a
                        key={key}
                        href={`#${href}`}
                        className="nav-link"
                        onClick={(e) => handleScroll(e, href)}
                    >
                        {label}
                    </a>
                )
            ))}
        </nav>
    )
}

Navbar.propTypes = {
    navOpen: PropTypes.bool.isRequired,
    setNavOpen: PropTypes.func.isRequired
};

export default Navbar;