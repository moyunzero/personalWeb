import { useParams, Link, Navigate } from 'react-router-dom';
import { useMemo } from 'react';
import BlogNavbar from '../components/blog/BlogNavbar';
import MarkdownContent from '../components/blog/MarkdownContent';
import { getPostBySlug, getAllPosts, getRelatedPosts, getAdjacentPosts } from '../blog';
import BlogPostNav from '../components/blog/BlogPostNav';
import ReadingProgressBar from '../components/blog/ReadingProgressBar';
import { getCategoryLabel } from '../blog/getCategories';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const BlogDetail = () => {
    const { id } = useParams();

    const blog = useMemo(() => getPostBySlug(id), [id]);

    const relatedSection = useMemo(() => {
        if (!blog) return { posts: [], heading: null, isRelated: false };
        return getRelatedPosts(blog, getAllPosts(), { limit: 3 });
    }, [blog]);

    const adjacentPosts = useMemo(() => {
        if (!blog) return { prev: null, next: null };
        return getAdjacentPosts(blog, getAllPosts());
    }, [blog]);

    useDocumentMeta({
        title: blog?.title,
        description: blog?.description,
    });

    if (!blog) {
        return <Navigate to="/blog" replace />;
    }

    return (
        <div className="relative z-10 min-h-screen bg-zinc-950 text-white">
            <BlogNavbar />
            <ReadingProgressBar />
            <div className="container mx-auto max-w-3xl px-4 pb-20 pt-28">
                <Link
                    to="/blog"
                    className="mb-10 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-sky-400"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    返回博客列表
                </Link>

                <article>
                    {blog.coverImage && (
                        <img
                            src={blog.coverImage}
                            alt=""
                            className="mb-10 max-h-[420px] w-full rounded-2xl object-cover ring-1 ring-zinc-800"
                            loading="eager"
                        />
                    )}

                    {blog.gallery?.length > 0 && (
                        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {blog.gallery.map((src) => (
                                <img
                                    key={src}
                                    src={src}
                                    alt=""
                                    className="h-28 w-full rounded-xl object-cover ring-1 ring-zinc-800"
                                    loading="lazy"
                                />
                            ))}
                        </div>
                    )}

                    <header className="mb-10">
                        <h1 className="text-3xl font-bold leading-snug tracking-tight text-white sm:text-4xl">
                            {blog.title}
                        </h1>

                        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-500">
                            <span className="text-zinc-400">{blog.author}</span>
                            {blog.publishDate && (
                                <>
                                    <span className="text-zinc-700" aria-hidden="true">
                                        |
                                    </span>
                                    <time dateTime={blog.publishDate}>{blog.publishDate}</time>
                                </>
                            )}
                            {blog.readTime && (
                                <>
                                    <span className="text-zinc-700" aria-hidden="true">
                                        |
                                    </span>
                                    <span>{blog.readTime} 分钟阅读</span>
                                </>
                            )}
                        </div>

                        {(blog.categories?.length > 0 || blog.tags?.length > 0) && (
                            <div className="mt-5 flex flex-wrap gap-2">
                                {blog.categories?.map((categoryId) => (
                                    <span
                                        key={categoryId}
                                        className="rounded-md bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300 ring-1 ring-violet-500/20"
                                    >
                                        {getCategoryLabel(categoryId)}
                                    </span>
                                ))}
                                {blog.tags?.map((tag) => (
                                    <Link
                                        key={tag}
                                        to={`/blog?tag=${encodeURIComponent(tag)}`}
                                        className="rounded-md bg-sky-500/10 px-2.5 py-1 text-xs text-sky-300 ring-1 ring-sky-500/20 transition-colors hover:bg-sky-500/20"
                                    >
                                        {tag}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {blog.description && (
                            <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                                {blog.description}
                            </p>
                        )}
                    </header>

                    <div className="border-t border-zinc-800/80 pt-10">
                        <MarkdownContent content={blog.content} />
                    </div>
                </article>

                <BlogPostNav prev={adjacentPosts.prev} next={adjacentPosts.next} />

                {relatedSection.heading && relatedSection.posts.length > 0 && (
                    <section className="mt-12 border-t border-zinc-800/80 pt-10">
                        <h2 className="mb-5 text-lg font-semibold text-zinc-300">
                            {relatedSection.heading}
                        </h2>
                        <ul className="space-y-3">
                            {relatedSection.posts.map((relatedBlog) => (
                                <li key={relatedBlog.id}>
                                    <Link
                                        to={`/blog/${relatedBlog.id}`}
                                        className="group block rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                                    >
                                        <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white">
                                            {relatedBlog.title}
                                        </h3>
                                        {relatedBlog.description && (
                                            <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                                                {relatedBlog.description}
                                            </p>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </div>
    );
};

export default BlogDetail;
