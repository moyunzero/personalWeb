import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import BlogNavbar from '../components/blog/BlogNavbar';
import { getAllBlogs } from '../data/blogs';

/**
 * 博客列表页面组件
 * 
 * 功能：
 * 1. 显示所有博客文章列表
 * 2. 支持从 localStorage 加载已发布的文章
 * 3. 显示文章卡片（标题、简介、日期、标签等）
 * 4. 提供跳转到编辑器的链接
 */
const Blog = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 获取所有博客文章
        const loadBlogs = () => {
            try {
                // 从数据文件获取
                const fileBlogs = getAllBlogs();
                
                // 从 localStorage 获取已发布的文章
                const publishedStr = localStorage.getItem('publishedBlogs');
                const publishedBlogs = publishedStr ? JSON.parse(publishedStr) : [];
                
                // 合并并去重（localStorage 中的文章优先级更高）
                const allBlogs = [...publishedBlogs];
                fileBlogs.forEach(blog => {
                    if (!allBlogs.find(b => b.id === blog.id)) {
                        allBlogs.push(blog);
                    }
                });
                
                // 按发布日期排序
                allBlogs.sort((a, b) => {
                    return new Date(b.publishDate) - new Date(a.publishDate);
                });
                
                setBlogs(allBlogs);
            } catch (error) {
                console.error('加载博客列表失败:', error);
                // 如果出错，至少显示文件中的博客
                setBlogs(getAllBlogs());
            } finally {
                setLoading(false);
            }
        };

        loadBlogs();
    }, []);

    return (
        <div className="min-h-screen bg-zinc-900 text-white">
            <BlogNavbar />
            <div className="container mx-auto px-4 py-20">
                {/* 头部操作栏 */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <Link 
                            to="/" 
                            className="text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-2 mb-4"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            返回首页
                        </Link>
                        <h1 className="text-4xl font-bold">博客文章</h1>
                    </div>
                    <Link
                        to="/blog/editor"
                        className="px-6 py-3 bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors font-semibold flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        写文章
                    </Link>
                </div>

                {/* 加载状态 */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400"></div>
                        <p className="mt-4 text-zinc-400">加载中...</p>
                    </div>
                ) : blogs.length === 0 ? (
                    // 空状态
                    <div className="text-center py-20">
                        <svg className="mx-auto h-24 w-24 text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h2 className="text-2xl font-semibold mb-2">还没有文章</h2>
                        <p className="text-zinc-400 mb-6">开始写你的第一篇文章吧！</p>
                        <Link
                            to="/blog/editor"
                            className="inline-block px-6 py-3 bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors font-semibold"
                        >
                            创建文章
                        </Link>
                    </div>
                ) : (
                    // 博客列表
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {blogs.map((blog) => (
                            <Link
                                key={blog.id}
                                to={`/blog/${blog.id}`}
                                className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-700 transition-colors block"
                            >
                                {/* 文章标题 */}
                                <h2 className="text-xl font-semibold mb-3 line-clamp-2">{blog.title}</h2>
                                
                                {/* 文章简介 */}
                                <p className="text-zinc-400 mb-4 line-clamp-3">{blog.description || '暂无简介'}</p>
                                
                                {/* 标签 */}
                                {blog.tags && blog.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {blog.tags.slice(0, 3).map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 bg-sky-500/20 text-sky-300 rounded text-xs"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                        {blog.tags.length > 3 && (
                                            <span className="px-2 py-1 text-zinc-500 text-xs">
                                                +{blog.tags.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                                
                                {/* 文章元信息 */}
                                <div className="flex justify-between items-center text-sm text-zinc-500">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>{blog.publishDate}</span>
                                    </div>
                                    {blog.readTime && (
                                        <span>{blog.readTime} 分钟</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Blog; 