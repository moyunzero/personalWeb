import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const NavLink = ({ post, direction }) => {
    if (!post) return null;

    const isPrev = direction === 'prev';

    return (
        <Link
            to={`/blog/${post.id}`}
            className={`group flex min-w-0 items-center gap-3 rounded-lg border border-zinc-700/80 bg-zinc-800/40 px-4 py-3 transition-colors hover:border-zinc-600 hover:bg-zinc-800 ${
                isPrev ? '' : 'sm:flex-row-reverse sm:text-right'
            }`}
        >
            <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700/80 text-zinc-400 transition-colors group-hover:bg-zinc-700 group-hover:text-sky-300"
                aria-hidden="true"
            >
                {isPrev ? '←' : '→'}
            </span>
            <span className="min-w-0 flex-1">
                <span className="mb-0.5 block text-xs text-zinc-500">
                    {isPrev ? '上一篇' : '下一篇'}
                </span>
                <span className="block truncate text-sm font-medium text-zinc-200 group-hover:text-white">
                    {post.title}
                </span>
            </span>
        </Link>
    );
};

NavLink.propTypes = {
    post: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
    }),
    direction: PropTypes.oneOf(['prev', 'next']).isRequired,
};

const BlogPostNav = ({ prev, next }) => {
    if (!prev && !next) return null;

    return (
        <nav aria-label="文章导航" className="grid gap-3 border-t border-zinc-700/80 pt-8 sm:grid-cols-2">
            {prev ? <NavLink post={prev} direction="prev" /> : <div aria-hidden="true" />}
            {next ? <NavLink post={next} direction="next" /> : <div aria-hidden="true" />}
        </nav>
    );
};

BlogPostNav.propTypes = {
    prev: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
    }),
    next: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
    }),
};

export default BlogPostNav;
