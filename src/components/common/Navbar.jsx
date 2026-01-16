/**
 * Node Modules
 */
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useSmoothScroll, SCROLL_OFFSET } from '../../hooks/useSmoothScroll';

const Navbar = ({navOpen, setNavOpen}) => {
    const location = useLocation();
    const scrollToElement = useSmoothScroll();
    
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
            label: '联系',
            href: 'contact'
        },
        // 暂时隐藏博客导航按钮
        // {
        //     label: '博客',
        //     href: '/blog',
        //     isRoute: true
        // }
    ];

    // 处理路由中的hash
    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#', '');
            // 使用 requestAnimationFrame 替代 setTimeout，更优雅
            requestAnimationFrame(() => {
                scrollToElement(id, SCROLL_OFFSET);
            });
        }
    }, [location, scrollToElement]);

    // 路由变化时自动关闭移动端菜单
    useEffect(() => {
        setNavOpen(false);
    }, [location.pathname, setNavOpen]);

    const handleScroll = (e, href) => {
        e.preventDefault();
        setNavOpen(false);
        scrollToElement(href, SCROLL_OFFSET);
    };
    
    // 获取当前激活的路由/锚点
    const getActiveClass = (href, isRoute) => {
        if (isRoute) {
            return location.pathname === href ? 'active' : '';
        }
        // 对于锚点链接，检查当前 URL hash
        return location.hash === `#${href}` ? 'active' : '';
    };

    return (
        <nav 
            id="main-navigation"
            className={'navbar' + (navOpen ? ' active' : '')} 
            role="navigation" 
            aria-label="主导航"
        >
            {navItems.map(({label, href, isRoute}, key) => (
                isRoute ? (
                    <Link
                        key={key}
                        to={href}
                        className={`nav-link ${getActiveClass(href, true)}`}
                        onClick={() => setNavOpen(false)}
                        aria-current={location.pathname === href ? 'page' : undefined}
                    >
                        {label}
                    </Link>
                ) : (
                    <a
                        key={key}
                        href={`#${href}`}
                        className={`nav-link ${getActiveClass(href, false)}`}
                        onClick={(e) => handleScroll(e, href)}
                        aria-current={location.hash === `#${href}` ? 'page' : undefined}
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