import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getCategoryLabel } from '../../blog/getCategories';

const BlogFeaturedCard = ({ blog }) => (
    <Link
        to={`/blog/${blog.id}`}
        className="group block overflow-hidden rounded-xl border border-sky-500/30 bg-gradient-to-br from-zinc-800 to-zinc-900 transition-colors hover:border-sky-400/50"
    >
        <div className="grid gap-0 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="p-8 md:p-10">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-400">
                    精选
                </p>
                <h2 className="mb-4 text-3xl font-bold leading-tight group-hover:text-sky-100 transition-colors">
                    {blog.title}
                </h2>
                <p className="mb-6 text-zinc-300 line-clamp-3">{blog.description}</p>
                {blog.categories?.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {blog.categories.map((categoryId) => (
                            <span
                                key={categoryId}
                                className="rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-300"
                            >
                                {getCategoryLabel(categoryId)}
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <span>{blog.publishDate}</span>
                    {blog.readTime && <span>{blog.readTime} 分钟阅读</span>}
                </div>
            </div>
            {blog.coverImage ? (
                <img
                    src={blog.coverImage}
                    alt=""
                    className="h-48 w-full object-cover md:h-full md:min-h-[240px]"
                    loading="lazy"
                />
            ) : (
                <div className="hidden min-h-[240px] bg-zinc-800/80 md:block" aria-hidden="true" />
            )}
        </div>
    </Link>
);

BlogFeaturedCard.propTypes = {
    blog: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        categories: PropTypes.arrayOf(PropTypes.string),
        coverImage: PropTypes.string,
        publishDate: PropTypes.string,
        readTime: PropTypes.number,
    }).isRequired,
};

export default BlogFeaturedCard;
