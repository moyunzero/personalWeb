import { Link, useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import BlogNavbar from '../components/blog/BlogNavbar';
import BlogPostCard from '../components/blog/BlogPostCard';
import BlogFeaturedCard from '../components/blog/BlogFeaturedCard';
import {
    getAllPosts,
    filterPosts,
    collectTags,
    groupPostsByYear,
    getFeaturedPosts,
} from '../blog';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { getCategories } from '../blog/getCategories';

const Blog = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeCategory, setActiveCategory] = useState('all');
    const [query, setQuery] = useState('');

    const activeTag = searchParams.get('tag') || '';
    const categories = getCategories();
    const allPosts = useMemo(() => getAllPosts(), []);
    const popularTags = useMemo(() => collectTags(allPosts), [allPosts]);

    const filteredPosts = useMemo(
        () =>
            filterPosts(allPosts, {
                category: activeCategory,
                tag: activeTag,
                query,
            }),
        [allPosts, activeCategory, activeTag, query]
    );

    const hasActiveFilters =
        activeCategory !== 'all' || Boolean(activeTag) || Boolean(query.trim());

    const featuredPosts = useMemo(() => {
        if (hasActiveFilters) return [];
        return getFeaturedPosts(filteredPosts);
    }, [filteredPosts, hasActiveFilters]);

    const featuredIds = useMemo(
        () => new Set(featuredPosts.map((post) => post.id)),
        [featuredPosts]
    );

    const listPosts = useMemo(
        () => filteredPosts.filter((post) => !featuredIds.has(post.id)),
        [filteredPosts, featuredIds]
    );

    const yearSections = useMemo(() => {
        if (hasActiveFilters) return null;
        return groupPostsByYear(listPosts);
    }, [listPosts, hasActiveFilters]);

    useDocumentMeta({
        title: '博客',
        description: '日常、笔记与思考 — 技术文章、阅读笔记与开发实践。',
    });

    const setActiveTag = (tag) => {
        const next = new URLSearchParams(searchParams);
        if (tag && tag === activeTag) {
            next.delete('tag');
        } else if (tag) {
            next.set('tag', tag);
        } else {
            next.delete('tag');
        }
        setSearchParams(next, { replace: true });
    };

    return (
        <div className="relative z-10 bg-zinc-900 text-white">
            <BlogNavbar />
            <div className="container mx-auto px-4 pb-12 pt-28">
                <div className="flex flex-col gap-6 mb-8 md:flex-row md:items-end md:justify-between">
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
                        <h1 className="text-4xl font-bold">博客</h1>
                        <p className="text-zinc-400 mt-2">日常、笔记与思考</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {import.meta.env.DEV && (
                            <Link
                                to="/blog/editor"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors font-semibold w-fit"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                写文章
                            </Link>
                        )}
                    </div>
                </div>

                <div className="mb-6">
                    <label htmlFor="blog-search" className="sr-only">
                        搜索文章
                    </label>
                    <input
                        id="blog-search"
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="搜索标题、摘要或标签…"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        type="button"
                        onClick={() => setActiveCategory('all')}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${
                            activeCategory === 'all'
                                ? 'bg-sky-600 text-white'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                    >
                        全部
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => setActiveCategory(category.id)}
                            className={`px-4 py-2 rounded-full text-sm transition-colors ${
                                activeCategory === category.id
                                    ? 'bg-sky-600 text-white'
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>

                {popularTags.length > 0 && (
                    <div className="mb-6">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            标签
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {popularTags.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setActiveTag(tag)}
                                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                                        activeTag.toLowerCase() === tag.toLowerCase()
                                            ? 'bg-sky-500/30 text-sky-200 ring-1 ring-sky-500/50'
                                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
                    <span>
                        共 {filteredPosts.length} 篇
                        {hasActiveFilters ? ` / ${allPosts.length} 篇` : ''}
                    </span>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={() => {
                                setActiveCategory('all');
                                setQuery('');
                                setActiveTag('');
                            }}
                            className="text-sky-400 hover:text-sky-300"
                        >
                            清除筛选
                        </button>
                    )}
                </div>

                {filteredPosts.length === 0 ? (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-semibold mb-2">暂无文章</h2>
                        <p className="text-zinc-400">
                            {hasActiveFilters
                                ? '没有符合当前筛选条件的文章，试试调整搜索或标签。'
                                : '在 content/posts/ 添加 Markdown 文件后重新构建即可。'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {featuredPosts.length > 0 && (
                            <section className="space-y-4">
                                {featuredPosts.map((blog) => (
                                    <BlogFeaturedCard key={blog.id} blog={blog} />
                                ))}
                            </section>
                        )}

                        {yearSections ? (
                            yearSections.map(({ year, posts }) => (
                                <section key={year}>
                                    <h2 className="mb-6 text-2xl font-bold text-zinc-300">
                                        {year > 0 ? year : '未标注日期'}
                                    </h2>
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {posts.map((blog) => (
                                            <BlogPostCard key={blog.id} blog={blog} />
                                        ))}
                                    </div>
                                </section>
                            ))
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {listPosts.map((blog) => (
                                    <BlogPostCard key={blog.id} blog={blog} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Blog;
