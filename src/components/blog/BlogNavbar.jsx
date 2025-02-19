import { Link } from 'react-router-dom';

const BlogNavbar = () => {
    return (
        <header className="fixed top-0 left-0 w-full h-20 flex items-center z-40 bg-zinc-900">
            <div className="container mx-auto px-4 flex justify-between items-center">
                <h1>
                    <Link 
                        to="/" 
                        className="logo flex items-center gap-2 text-xl font-bold text-white"
                    >
                        <img 
                            src="/images/logo.svg" 
                            alt="Logo" 
                            className="w-10 h-10"
                        />
                        我的博客
                    </Link>
                </h1>
                <nav className="flex items-center gap-6">
                    <Link 
                        to="/" 
                        className="text-zinc-300 hover:text-white transition-colors"
                    >
                        首页
                    </Link>
                    <a 
                        href="https://github.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-zinc-300 hover:text-white transition-colors"
                    >
                        GitHub
                    </a>
                </nav>
            </div>
        </header>
    );
};

export default BlogNavbar; 