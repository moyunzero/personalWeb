import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { getAllBlogs } from '../../data/blogs';
import 'highlight.js/styles/github-dark.css';

/**
 * 博客编辑器组件
 * 
 * 功能：
 * 1. 在线编辑博客文章（Markdown 格式）
 * 2. 实时预览效果
 * 3. 保存文章到本地存储（localStorage）
 * 4. 导出文章为 JSON 格式（便于手动添加到 blogs.js）
 * 5. 一键发布功能
 * 
 * 注意：由于这是纯前端项目，文章会保存到 localStorage。
 * 如果需要持久化存储，需要：
 * - 集成后端 API
 * - 或使用文件系统 API（需要用户手动保存文件）
 */
const BlogEditor = () => {
    const navigate = useNavigate();
    
    // 表单状态
    const [formData, setFormData] = useState({
        id: '',
        title: '',
        description: '',
        author: '墨韵',
        publishDate: new Date().toISOString().split('T')[0], // 默认今天
        tags: '',
        readTime: '',
        content: ''
    });

    // 预览模式（true: 预览，false: 编辑）
    const [previewMode, setPreviewMode] = useState(false);
    
    // 保存状态提示
    const [saveStatus, setSaveStatus] = useState('');

    // 从 localStorage 加载草稿
    useEffect(() => {
        const draft = localStorage.getItem('blogDraft');
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                setFormData(parsed);
            } catch (e) {
                console.error('加载草稿失败:', e);
            }
        }
    }, []);

    // 生成文章 ID（基于标题）
    const generateId = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // 处理输入变化
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            // 如果标题改变，自动生成 ID
            if (name === 'title' && !prev.id) {
                updated.id = generateId(value);
            }
            return updated;
        });
    };

    // 保存草稿到 localStorage
    const saveDraft = () => {
        try {
            localStorage.setItem('blogDraft', JSON.stringify(formData));
            setSaveStatus('草稿已保存！');
            setTimeout(() => setSaveStatus(''), 3000);
        } catch (e) {
            setSaveStatus('保存失败：' + e.message);
        }
    };

    // 验证表单
    const validateForm = () => {
        if (!formData.title.trim()) {
            alert('请输入文章标题');
            return false;
        }
        if (!formData.content.trim()) {
            alert('请输入文章内容');
            return false;
        }
        if (!formData.id.trim()) {
            formData.id = generateId(formData.title);
        }
        return true;
    };

    // 导出为 JSON（用于手动添加到 blogs.js）
    const exportAsJSON = () => {
        if (!validateForm()) return;

        const blogPost = {
            id: formData.id || generateId(formData.title),
            title: formData.title,
            description: formData.description,
            author: formData.author,
            publishDate: formData.publishDate,
            tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
            readTime: formData.readTime ? parseInt(formData.readTime) : undefined,
            content: formData.content
        };

        // 创建下载链接
        const dataStr = JSON.stringify(blogPost, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `blog-${blogPost.id}.json`;
        link.click();
        URL.revokeObjectURL(url);

        setSaveStatus('JSON 文件已导出！请手动添加到 src/data/blogs.js');
        setTimeout(() => setSaveStatus(''), 5000);
    };

    // 一键发布（保存到 localStorage，并提示用户）
    const publish = () => {
        if (!validateForm()) return;

        try {
            // 保存到 localStorage（作为已发布的文章）
            const blogPost = {
                id: formData.id || generateId(formData.title),
                title: formData.title,
                description: formData.description,
                author: formData.author,
                publishDate: formData.publishDate,
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
                readTime: formData.readTime ? parseInt(formData.readTime) : undefined,
                content: formData.content
            };

            // 获取已发布的文章列表
            const published = JSON.parse(localStorage.getItem('publishedBlogs') || '[]');
            
            // 检查是否已存在（更新模式）
            const existingIndex = published.findIndex(b => b.id === blogPost.id);
            if (existingIndex >= 0) {
                published[existingIndex] = blogPost;
            } else {
                published.push(blogPost);
            }

            localStorage.setItem('publishedBlogs', JSON.stringify(published));
            
            // 清除草稿
            localStorage.removeItem('blogDraft');
            
            setSaveStatus('文章已发布！注意：这是临时存储，需要手动添加到 src/data/blogs.js 才能永久保存。');
            setTimeout(() => {
                setSaveStatus('');
                navigate('/blog');
            }, 3000);
        } catch (e) {
            setSaveStatus('发布失败：' + e.message);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-900 text-white pt-28 pb-8 px-4 md:px-8">
            <div className="container mx-auto max-w-6xl">
                {/* 头部操作栏 - 固定在顶部，避免被导航栏遮挡 */}
                <div className="sticky top-20 z-30 bg-zinc-900/95 backdrop-blur-sm py-4 mb-6 border-b border-zinc-700 -mx-4 md:-mx-8 px-4 md:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h1 className="text-2xl md:text-3xl font-bold">博客编辑器</h1>
                        <div className="flex flex-wrap gap-2 md:gap-4 w-full md:w-auto">
                            <button
                                onClick={() => setPreviewMode(!previewMode)}
                                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors text-sm md:text-base"
                            >
                                {previewMode ? '编辑模式' : '预览模式'}
                            </button>
                            <button
                                onClick={saveDraft}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-sm md:text-base"
                            >
                                保存草稿
                            </button>
                            <button
                                onClick={exportAsJSON}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors text-sm md:text-base"
                            >
                                导出 JSON
                            </button>
                            <button
                                onClick={publish}
                                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded transition-colors font-semibold text-sm md:text-base"
                            >
                                一键发布
                            </button>
                        </div>
                    </div>
                </div>

                {/* 保存状态提示 */}
                {saveStatus && (
                    <div className="mb-4 p-4 bg-sky-500/20 border border-sky-500 rounded text-sky-300">
                        {saveStatus}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 左侧：编辑表单 */}
                    {!previewMode && (
                        <div className="space-y-4">
                            {/* 基本信息 */}
                            <div className="bg-zinc-800 rounded-lg p-6 space-y-4">
                                <h2 className="text-xl font-semibold mb-4">基本信息</h2>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-2">文章标题 *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded focus:outline-none focus:border-sky-500"
                                        placeholder="输入文章标题"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">文章 ID</label>
                                    <input
                                        type="text"
                                        name="id"
                                        value={formData.id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded focus:outline-none focus:border-sky-500"
                                        placeholder="自动生成（基于标题）"
                                    />
                                    <p className="text-xs text-zinc-400 mt-1">用于 URL 路径，建议使用英文和连字符</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">文章简介</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded focus:outline-none focus:border-sky-500"
                                        placeholder="简短描述，显示在列表页"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">作者</label>
                                        <input
                                            type="text"
                                            name="author"
                                            value={formData.author}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded focus:outline-none focus:border-sky-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">发布日期</label>
                                        <input
                                            type="date"
                                            name="publishDate"
                                            value={formData.publishDate}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded focus:outline-none focus:border-sky-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">标签（逗号分隔）</label>
                                        <input
                                            type="text"
                                            name="tags"
                                            value={formData.tags}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded focus:outline-none focus:border-sky-500"
                                            placeholder="React, 前端, 教程"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">阅读时间（分钟）</label>
                                        <input
                                            type="number"
                                            name="readTime"
                                            value={formData.readTime}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded focus:outline-none focus:border-sky-500"
                                            placeholder="5"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 内容编辑 */}
                            <div className="bg-zinc-800 rounded-lg p-6">
                                <h2 className="text-xl font-semibold mb-4">文章内容（Markdown）*</h2>
                                <textarea
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    rows="20"
                                    className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded focus:outline-none focus:border-sky-500 font-mono text-sm"
                                    placeholder="在这里输入 Markdown 格式的文章内容..."
                                />
                                <p className="text-xs text-zinc-400 mt-2">
                                    支持 Markdown 语法：标题、列表、代码块、链接等
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 右侧：预览 */}
                    <div className="bg-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">预览效果</h2>
                        <div className="border border-zinc-700 rounded p-4 min-h-[500px] max-h-[800px] overflow-y-auto">
                            {formData.content || formData.title ? (
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
                                    {formData.title && (
                                        <h1 className="text-3xl font-bold mb-4">{formData.title}</h1>
                                    )}
                                    {formData.description && (
                                        <p className="text-zinc-400 mb-4 text-lg">{formData.description}</p>
                                    )}
                                    {formData.content ? (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeHighlight, rehypeRaw]}
                                        >
                                            {formData.content}
                                        </ReactMarkdown>
                                    ) : (
                                        <p className="text-zinc-500">开始输入 Markdown 内容...</p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-zinc-500 text-center py-20">
                                    输入内容后，预览将显示在这里
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogEditor;
