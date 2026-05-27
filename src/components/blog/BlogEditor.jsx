import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../../blog/getCategories';
import {
    buildMarkdownFile,
    getRecommendedCoverPath,
    getRecommendedImageDir,
} from '../../blog/buildMarkdown';
import { normalizeMarkdown, findNotionHostedImages } from '../../blog/normalizeMarkdown';
import { resolveBlogAsset } from '../../blog/utils';
import MarkdownContent from './MarkdownContent';

const DRAFT_KEY = 'blogDraftMd';

const BlogEditor = () => {
    const categories = getCategories();

    const [formData, setFormData] = useState({
        slug: '',
        title: '',
        description: '',
        author: '墨韵',
        publishDate: new Date().toISOString().split('T')[0],
        categories: [],
        tags: '',
        cover: '',
        readTime: '',
        content: '',
    });

    const [previewMode, setPreviewMode] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');

    useEffect(() => {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (!draft) return;
        try {
            setFormData(JSON.parse(draft));
        } catch (e) {
            console.error('加载草稿失败:', e);
        }
    }, []);

    const generateSlug = (title) =>
        title
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80) || `post-${Date.now()}`;

    const slug = formData.slug || generateSlug(formData.title);

    const imageDir = useMemo(() => getRecommendedImageDir(slug), [slug]);
    const coverPath = useMemo(() => getRecommendedCoverPath(slug), [slug]);

    const notionImageUrls = useMemo(
        () => findNotionHostedImages(formData.content),
        [formData.content]
    );

    const normalizeContent = () => {
        setFormData((prev) => ({
            ...prev,
            content: normalizeMarkdown(prev.content),
        }));
        setSaveStatus('已整理 Markdown（Notion/HTML 教程类内容建议点此）');
        setTimeout(() => setSaveStatus(''), 4000);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === 'title' && !prev.slug) {
                updated.slug = generateSlug(value);
            }
            return updated;
        });
    };

    const toggleCategory = (categoryId) => {
        setFormData((prev) => {
            const exists = prev.categories.includes(categoryId);
            return {
                ...prev,
                categories: exists
                    ? prev.categories.filter((id) => id !== categoryId)
                    : [...prev.categories, categoryId],
            };
        });
    };

    const getPayload = () => ({
        ...formData,
        slug,
    });

    const validateForm = () => {
        if (!formData.title.trim()) {
            alert('请输入文章标题');
            return false;
        }
        if (!formData.content.trim()) {
            alert('请输入文章内容');
            return false;
        }
        if (formData.categories.length === 0) {
            alert('请至少选择一个分类');
            return false;
        }
        return true;
    };

    const saveDraft = () => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        setSaveStatus('草稿已保存到浏览器（仅本机可见）');
        setTimeout(() => setSaveStatus(''), 3000);
    };

    const downloadMarkdown = () => {
        if (!validateForm()) return;

        const markdown = buildMarkdownFile(getPayload());
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${slug}.md`;
        link.click();
        URL.revokeObjectURL(url);

        setSaveStatus(
            `已下载 ${slug}.md → 请放入 content/posts/，图片目录：${imageDir}`
        );
        setTimeout(() => setSaveStatus(''), 8000);
    };

    const copyMarkdown = async () => {
        if (!validateForm()) return;
        const markdown = buildMarkdownFile(getPayload());
        await navigator.clipboard.writeText(markdown);
        setSaveStatus('Markdown 已复制到剪贴板');
        setTimeout(() => setSaveStatus(''), 3000);
    };

    const copyText = async (text, message) => {
        await navigator.clipboard.writeText(text);
        setSaveStatus(message);
        setTimeout(() => setSaveStatus(''), 3000);
    };

    const insertImageSnippet = () => {
        const snippet = `\n\n![图片描述](${resolveBlogAsset(coverPath.replace('cover.jpg', 'photo.jpg'))})\n`;
        setFormData((prev) => ({
            ...prev,
            content: `${prev.content}${snippet}`,
        }));
    };

    return (
        <div className="min-h-screen bg-zinc-900 text-white pt-28 pb-8 px-4 md:px-8">
            <div className="container mx-auto max-w-6xl">
                <div className="sticky top-20 z-30 bg-zinc-900/95 backdrop-blur-sm py-4 mb-6 border-b border-zinc-700 -mx-4 md:-mx-8 px-4 md:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <Link to="/blog" className="text-sky-400 text-sm mb-2 inline-block hover:text-sky-300">
                                ← 返回博客
                            </Link>
                            <h1 className="text-2xl md:text-3xl font-bold">博客编辑器</h1>
                            <p className="text-zinc-400 text-sm mt-1">开发环境专用 · 导出 Markdown 后 git push 发布</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setPreviewMode(!previewMode)}
                                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm"
                            >
                                {previewMode ? '编辑' : '预览'}
                            </button>
                            <button type="button" onClick={saveDraft} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm">
                                存草稿
                            </button>
                            <button type="button" onClick={copyMarkdown} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded text-sm">
                                复制 MD
                            </button>
                            <button type="button" onClick={downloadMarkdown} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded text-sm font-semibold">
                                下载 .md
                            </button>
                            <button type="button" onClick={normalizeContent} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded text-sm">
                                整理粘贴内容
                            </button>
                        </div>
                    </div>
                </div>

                {saveStatus && (
                    <div className="mb-4 p-4 bg-sky-500/20 border border-sky-500 rounded text-sky-300 text-sm">
                        {saveStatus}
                    </div>
                )}

                {notionImageUrls.length > 0 && (
                    <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/50 rounded text-amber-200 text-sm">
                        检测到 {notionImageUrls.length} 张 Notion/S3 外链图，上线后可能无法显示。
                        请下载到 <code className="text-amber-100">{imageDir}</code> 并改为本地路径。
                    </div>
                )}

                <div className="mb-6 p-4 bg-zinc-800 rounded-lg text-sm text-zinc-300 space-y-2">
                    <p className="font-medium text-white">发布步骤</p>
                    <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                        <li>填写内容后点击「下载 .md」</li>
                        <li>将文件保存到 <code className="text-sky-300">content/posts/{slug}.md</code></li>
                        <li>图片放入 <code className="text-sky-300">{imageDir}</code></li>
                        <li>运行 <code className="text-sky-300">yarn blog:new</code> 可自动创建上述目录</li>
                        <li><code className="text-sky-300">git add && git commit && git push</code></li>
                    </ol>
                    <div className="flex flex-wrap gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => copyText(`content/posts/${slug}.md`, '已复制文章路径')}
                            className="px-3 py-1 bg-zinc-700 rounded text-xs"
                        >
                            复制文章路径
                        </button>
                        <button
                            type="button"
                            onClick={() => copyText(imageDir, '已复制图片目录')}
                            className="px-3 py-1 bg-zinc-700 rounded text-xs"
                        >
                            复制图片目录
                        </button>
                        <button
                            type="button"
                            onClick={() => copyText(coverPath, '已复制封面相对路径')}
                            className="px-3 py-1 bg-zinc-700 rounded text-xs"
                        >
                            复制封面路径
                        </button>
                        <button type="button" onClick={insertImageSnippet} className="px-3 py-1 bg-zinc-700 rounded text-xs">
                            插入图片模板
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {!previewMode && (
                        <div className="space-y-4">
                            <div className="bg-zinc-800 rounded-lg p-6 space-y-4">
                                <h2 className="text-xl font-semibold">基本信息</h2>

                                <div>
                                    <label className="block text-sm font-medium mb-2">标题 *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded focus:outline-none focus:border-sky-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Slug（URL）</label>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded focus:outline-none focus:border-sky-500"
                                        placeholder={generateSlug(formData.title) || 'my-post-slug'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">简介</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded focus:outline-none focus:border-sky-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">分类 *（在 content/categories.json 配置）</label>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map((category) => (
                                            <button
                                                key={category.id}
                                                type="button"
                                                onClick={() => toggleCategory(category.id)}
                                                className={`px-3 py-1 rounded-full text-sm ${
                                                    formData.categories.includes(category.id)
                                                        ? 'bg-sky-600 text-white'
                                                        : 'bg-zinc-700 text-zinc-300'
                                                }`}
                                            >
                                                {category.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">作者</label>
                                        <input
                                            type="text"
                                            name="author"
                                            value={formData.author}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">日期</label>
                                        <input
                                            type="date"
                                            name="publishDate"
                                            value={formData.publishDate}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded"
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
                                            className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">阅读时间（分钟）</label>
                                        <input
                                            type="number"
                                            name="readTime"
                                            value={formData.readTime}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">封面（相对路径）</label>
                                    <input
                                        type="text"
                                        name="cover"
                                        value={formData.cover}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded"
                                        placeholder={coverPath}
                                    />
                                </div>
                            </div>

                            <div className="bg-zinc-800 rounded-lg p-6">
                                <h2 className="text-xl font-semibold mb-2">正文 Markdown *</h2>
                                <p className="text-xs text-zinc-400 mb-4">
                                    从 Notion 粘贴后若预览错乱，请点击「整理粘贴内容」。HTML 教程文中大量
                                    {' '}
                                    <code className="text-zinc-300">&lt;tag&gt;</code>
                                    {' '}
                                    需转义处理。
                                </p>
                                <textarea
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    rows={20}
                                    className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded font-mono text-sm focus:outline-none focus:border-sky-500"
                                />
                            </div>
                        </div>
                    )}

                    <div className="bg-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">预览</h2>
                        <div className="border border-zinc-700 rounded p-4 min-h-[500px] max-h-[800px] overflow-y-auto">
                            {formData.title && (
                                <h1 className="text-3xl font-bold text-white mb-2">{formData.title}</h1>
                            )}
                            {formData.description && (
                                <p className="text-zinc-400 text-lg mb-6">{formData.description}</p>
                            )}
                            {formData.content ? (
                                <MarkdownContent content={formData.content} />
                            ) : (
                                <p className="text-zinc-500">开始输入内容…</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogEditor;
