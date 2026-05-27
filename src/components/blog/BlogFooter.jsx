import { Link } from 'react-router-dom';

const BlogFooter = () => {
    return (
        <footer className="relative z-10 border-t border-zinc-800 bg-zinc-900 py-8">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-zinc-500 sm:flex-row">
                <Link to="/" className="text-zinc-400 transition-colors hover:text-zinc-200">
                    返回首页
                </Link>
                <p>
                    &copy; {new Date().getFullYear()} <span className="text-zinc-300">Moyun</span>
                </p>
            </div>
        </footer>
    );
};

export default BlogFooter;
