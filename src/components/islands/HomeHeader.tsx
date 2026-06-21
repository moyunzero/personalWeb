import { useState, useEffect } from 'react';

const base = import.meta.env.BASE_URL;
const logoSrc = `${base}images/logo.svg`;
const SCROLL_OFFSET = 80;

const navItems = [
    { label: '首页', href: 'home' },
    { label: '关于', href: 'about' },
    { label: '技能', href: 'skill' },
    { label: '作品', href: 'work' },
    { label: '联系', href: 'contact' },
    { label: '博客', href: `${base}blog/`, isRoute: true },
];

function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({
        top: el.offsetTop - SCROLL_OFFSET,
        behavior: 'smooth',
    });
}

export default function HomeHeader() {
    const [navOpen, setNavOpen] = useState(false);

    useEffect(() => {
        document.body.style.overflow = navOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [navOpen]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && navOpen) setNavOpen(false);
        };
        if (navOpen) {
            document.addEventListener('keydown', onKey);
            return () => document.removeEventListener('keydown', onKey);
        }
    }, [navOpen]);

    const handleAnchor = (e: React.MouseEvent, href: string) => {
        e.preventDefault();
        setNavOpen(false);
        scrollToId(href);
    };

    return (
        <header className="fixed top-0 left-0 w-full h-20 flex items-center z-40 bg-gradient-to-b from-zinc-900 to-zinc-900/0">
            <div className="max-w-screen-xl mx-auto w-full px-4 flex justify-between items-center md:px-6 md:grid md:grid-cols-[1fr,3fr,1fr]">
                <h1>
                    <a href={base} className="logo">
                        <img
                            src={logoSrc}
                            width={40}
                            height={40}
                            alt="墨韵-作品集"
                        />
                    </a>
                </h1>
                <div className="relative md:justify-self-center">
                    <button
                        className="menu-btn md:hidden"
                        onClick={() => setNavOpen((prev) => !prev)}
                        aria-label={navOpen ? '关闭菜单' : '打开菜单'}
                        aria-expanded={navOpen}
                        aria-controls="main-navigation"
                        type="button"
                    >
                        <span className="material-symbols-rounded" aria-hidden="true">
                            {navOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                    <nav
                        id="main-navigation"
                        className={`navbar${navOpen ? ' active' : ''}`}
                        role="navigation"
                        aria-label="主导航"
                    >
                        {navItems.map(({ label, href, isRoute }, key) =>
                            isRoute ? (
                                <a
                                    key={key}
                                    href={href}
                                    className="nav-link"
                                    onClick={() => setNavOpen(false)}
                                >
                                    {label}
                                </a>
                            ) : (
                                <a
                                    key={key}
                                    href={`#${href}`}
                                    className="nav-link"
                                    onClick={(e) => handleAnchor(e, href)}
                                >
                                    {label}
                                </a>
                            ),
                        )}
                    </nav>
                </div>
                <a
                    href="#contact"
                    className="btn btn-secondary max-md:hidden md:justify-self-end"
                    onClick={(e) => handleAnchor(e, 'contact')}
                >
                    联系我
                </a>
            </div>
        </header>
    );
}
