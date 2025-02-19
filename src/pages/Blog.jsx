import { Link } from 'react-router-dom';
import BlogNavbar from '../components/blog/BlogNavbar';

const Blog = () => {
    return (
        <div className="min-h-screen bg-zinc-900 text-white">
            <BlogNavbar />
            <div className="container mx-auto px-4 py-20">
                <div className="flex items-center mb-8">
                    <Link 
                        to="/" 
                        className="text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        返回首页
                    </Link>
                </div>
                <h1 className="text-4xl font-bold mb-8">博客文章</h1>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* 示例博客文章卡片 */}
                    <article className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-700 transition-colors">
                        <h2 className="text-xl font-semibold mb-4">示例博客标题</h2>
                        <p className="text-zinc-400 mb-4">这是一篇示例博客文章的简短描述...</p>
                        <div className="flex justify-between items-center text-sm text-zinc-500">
                            <span>2024-03-21</span>
                            <span>阅读更多 →</span>
                        </div>
                    </article>
                </div>
            </div>
        </div>
    );
};

export default Blog; 