import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getCategoryLabel } from '../../blog/getCategories';

const badgeClass =
    'inline-block max-w-[9rem] truncate rounded px-2 py-1 text-xs';

const BlogPostCard = ({ blog }) => (
    <Link
        to={`/blog/${blog.id}`}
        className="flex h-full flex-col overflow-hidden rounded-lg bg-zinc-800 transition-colors hover:bg-zinc-700"
    >
        {blog.coverImage && (
            <img
                src={blog.coverImage}
                alt=""
                className="h-40 w-full shrink-0 object-cover"
                loading="lazy"
            />
        )}
        <div className="flex flex-1 flex-col p-6">
            <h2 className="mb-3 line-clamp-2 h-14 text-xl font-semibold leading-7">
                {blog.title}
            </h2>

            <p className="mb-3 line-clamp-3 h-[4.5rem] text-sm leading-6 text-zinc-400">
                {blog.description || '暂无简介'}
            </p>

            <div className="mb-3 h-7 shrink-0 overflow-hidden">
                <div className="flex flex-wrap gap-2">
                    {blog.categories?.length > 0 ? (
                        blog.categories.map((categoryId) => (
                            <span
                                key={categoryId}
                                className={`${badgeClass} bg-violet-500/20 text-violet-300`}
                                title={getCategoryLabel(categoryId)}
                            >
                                {getCategoryLabel(categoryId)}
                            </span>
                        ))
                    ) : (
                        <span className="invisible px-2 py-1 text-xs" aria-hidden="true">
                            —
                        </span>
                    )}
                </div>
            </div>

            <div className="mb-4 h-7 shrink-0 overflow-hidden">
                <div className="flex flex-wrap gap-2">
                    {blog.tags?.length > 0 ? (
                        blog.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className={`${badgeClass} bg-sky-500/20 text-sky-300`}
                                title={tag}
                            >
                                {tag}
                            </span>
                        ))
                    ) : (
                        <span className="invisible px-2 py-1 text-xs" aria-hidden="true">
                            —
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-auto flex shrink-0 items-center justify-between text-sm text-zinc-500">
                <span className="truncate">{blog.publishDate || '—'}</span>
                {blog.readTime ? <span className="shrink-0 pl-2">{blog.readTime} 分钟</span> : null}
            </div>
        </div>
    </Link>
);

BlogPostCard.propTypes = {
    blog: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        categories: PropTypes.arrayOf(PropTypes.string),
        tags: PropTypes.arrayOf(PropTypes.string),
        coverImage: PropTypes.string,
        publishDate: PropTypes.string,
        readTime: PropTypes.number,
    }).isRequired,
};

export default BlogPostCard;
