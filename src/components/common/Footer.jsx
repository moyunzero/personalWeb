/**
 * Components
 */
import { ButtonPrimary } from "./Button";

const logoSrc = `${import.meta.env.BASE_URL}images/logo.svg`;

const sitemap = [
    {
      label: '首页',
      href: '#home'
    },
    {
      label: '关于',
      href: '#about'
    },
    {
      label: '作品',
      href: '#work'
    },
    {
      label: '联系',
      href: '#contact'
    }
  ];
  
const socials = [
    {
      label: 'GitHub',
      href: 'https://github.com/moyunzero'
    }
  ];

const Footer = () => {
    return (
        <footer className="section">
            <div className="container">
                <div className="lg:grid lg:grid-cols-2">
                    <div className="mb-10">
                        <h2 className="headline-1 mb-8 lg:max-w-[12ch] reveal-up">
                            一起搞点有意思的？
                        </h2>
                        <ButtonPrimary 
                            href="mailto:zero305747648@gmail.com"
                            label="聊聊项目"
                            icon="chevron_right"
                            classes="reveal-up"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 lg:pl-20">
                        <div>
                            <p className="mb-2 reveal-up">
                                导航
                            </p>
                            <ul>
                                {
                                    sitemap.map(({label,href},key)=>(
                                        <li key={key}>
                                            <a 
                                                href={href}
                                                className="block text-sm text-zinc-400 py-1 transition-colors hover:text-zinc-200 reveal-up"
                                            >
                                                {label}
                                            </a>
                                        </li>
                                    ))
                                }
                            </ul>
                        </div>
                        <div>
                            <p className="mb-2 reveal-up">
                                社交
                            </p>
                            <ul>
                                {
                                    socials.map(({label,href},key)=>(
                                        <li key={key}>
                                            <a 
                                                href={href}
                                                target="_blank"
                                                className="block text-sm text-zinc-400 py-1 transition-colors hover:text-zinc-200 reveal-up"
                                            >
                                                {label}
                                            </a>
                                        </li>
                                    ))
                                }
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-10 mb-8">
                    <a
                        href="/"
                        className="logo reveal-up"
                    >
                        <img
                            src={logoSrc}
                            alt="Logo"
                            width={40}
                            height={40}
                        />
                    </a>
                    <p className="text-zinc-500 text-sm reveal-up">
                        &copy; {new Date().getFullYear()} <span className="text-zinc-200">Moyun</span>
                    </p>
                </div>

            </div>
        </footer>
    )
}

export default Footer