import { useParams, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import BlogNavbar from '../components/blog/BlogNavbar';
import { getBlogById, getAllBlogs } from '../data/blogs';
import 'highlight.js/styles/github-dark.css'; // 代码高亮样式

/**
 * 从所有来源获取博客文章（包括 localStorage）
 */
const getBlogFromAllSources = (id) => {
    // 先从 localStorage 查找
    try {
        const publishedStr = localStorage.getItem('publishedBlogs');
        if (publishedStr) {
            const publishedBlogs = JSON.parse(publishedStr);
            const found = publishedBlogs.find(b => b.id === id);
            if (found) return found;
        }
    } catch (e) {
        console.error('读取 localStorage 失败:', e);
    }
    
    // 再从数据文件查找
    return getBlogById(id);
};

/**
 * 博客详情页面组件
 * 
 * 功能：
 * 1. 显示完整的博客文章内容
 * 2. 支持 Markdown 渲染（包括代码高亮）
 * 3. 显示文章元信息（作者、日期、标签等）
 * 4. 提供返回博客列表的链接
 */
const BlogDetail = () => {
    const { id } = useParams(); // 从路由参数获取文章 ID
    const [blog, setBlog] = useState(null);
    const [relatedBlogs, setRelatedBlogs] = useState([]);
    const [loading, setLoading] = useState(true); // 添加加载状态

    useEffect(() => {
        // 根据 ID 获取博客文章（从所有来源）
        const blogData = getBlogFromAllSources(id);
        setBlog(blogData);

        // 获取相关文章（排除当前文章，取前 3 篇）
        if (blogData) {
            // 合并所有来源的博客
            let allBlogs = getAllBlogs();
            try {
                const publishedStr = localStorage.getItem('publishedBlogs');
                if (publishedStr) {
                    const publishedBlogs = JSON.parse(publishedStr);
                    // 合并并去重
                    publishedBlogs.forEach(pb => {
                        if (!allBlogs.find(b => b.id === pb.id)) {
                            allBlogs.push(pb);
                        }
                    });
                }
            } catch (e) {
                console.error('读取相关文章失败:', e);
            }
            
            const related = allBlogs
                .filter(b => b.id !== id)
                .slice(0, 3);
            setRelatedBlogs(related);
        }
        
        setLoading(false); // 加载完成
    }, [id]);

    // 加载中显示加载状态
    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400"></div>
                    <p className="mt-4 text-zinc-400">加载中...</p>
                </div>
            </div>
        );
    }

    // 如果文章不存在，重定向到博客列表页
    if (!blog) {
        return <Navigate to="/blog" replace />;
    }

    return (
        <div className="min-h-screen bg-zinc-900 text-white">
            <BlogNavbar />
            <div className="container mx-auto px-4 py-20 max-w-4xl">
                {/* 返回按钮 */}
                <Link 
                    to="/blog" 
                    className="text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-2 mb-8"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    返回博客列表
                </Link>

                {/* 文章头部信息 */}
                <article className="bg-zinc-800 rounded-lg p-8 mb-8">
                    <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
                    
                    {/* 文章元信息 */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mb-6">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>{blog.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{blog.publishDate}</span>
                        </div>
                        {blog.readTime && (
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{blog.readTime} 分钟阅读</span>
                            </div>
                        )}
                    </div>

                    {/* 标签 */}
                    {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {blog.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-sky-500/20 text-sky-300 rounded-full text-sm"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* 文章描述 */}
                    {blog.description && (
                        <p className="text-zinc-300 text-lg mb-8">{blog.description}</p>
                    )}

                    {/* 文章内容 - Markdown 渲染 */}
                    <div className="prose prose-invert prose-lg max-w-none 
                        prose-headings:text-white 
                        prose-p:text-zinc-300 
                        prose-a:text-sky-400 
                        prose-strong:text-white 
                        prose-code:text-sky-300 
                        prose-pre:bg-zinc-900 
                        prose-pre:border 
                        prose-pre:border-zinc-700
                        prose-blockquote:text-zinc-400
                        prose-blockquote:border-l-sky-500
                        prose-ul:text-zinc-300
                        prose-ol:text-zinc-300
                        prose-li:text-zinc-300">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight, rehypeRaw]}
                        >
                            {blog.content}
                        </ReactMarkdown>
                    </div>
                </article>

                {/* 相关文章推荐 */}
                {relatedBlogs.length > 0 && (
                    <div className="bg-zinc-800 rounded-lg p-8">
                        <h2 className="text-2xl font-bold mb-6">相关文章</h2>
                        <div className="grid gap-4 md:grid-cols-3">
                            {relatedBlogs.map((relatedBlog) => (
                                <Link
                                    key={relatedBlog.id}
                                    to={`/blog/${relatedBlog.id}`}
                                    className="bg-zinc-700 rounded-lg p-4 hover:bg-zinc-600 transition-colors"
                                >
                                    <h3 className="text-lg font-semibold mb-2">{relatedBlog.title}</h3>
                                    <p className="text-sm text-zinc-400 line-clamp-2">{relatedBlog.description}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogDetail;
