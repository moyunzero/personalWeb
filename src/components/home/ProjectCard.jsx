import { memo } from 'react';
import PropTypes from 'prop-types';

// 抽取样式常量
const STYLES = {
    container: "relative p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700/50 active:bg-zinc-700/60 ring-1 ring-inset ring-zinc-50/5 transition-colors",
    image: "w-full h-full object-contain rounded-lg bg-zinc-900/50",
    imageBox: "aspect-[16/10] rounded-lg mb-4 overflow-hidden bg-zinc-900/30",
    title: "title-1 mb-3",
    tagContainer: "flex flex-wrap items-center gap-2",
    tag: "h-8 text-sm text-zinc-400 bg-zinc-50/5 grid items-center px-2 rounded-lg",
    arrow: "w-11 h-11 rounded-lg grid place-items-center bg-sky-400 text-zinc-950 shrink-0"
};

const ProjectCard = memo(({ imgSrc, title, tags, projectLink, classes }) => {
    const hasLink = projectLink && projectLink.trim() !== '';
    
    const handleImageError = (e) => {
        // 图片加载失败时使用占位符
        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="100%25" height="100%25" fill="%2371717a"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23a1a1aa" font-size="18"%3E图片加载失败%3C/text%3E%3C/svg%3E';
    };
    
    return (
        <div className={`${STYLES.container} ${classes || ''} ${!hasLink ? 'cursor-default' : ''}`}>
            <figure className={STYLES.imageBox}>
                <img
                    src={imgSrc}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    className={STYLES.image}
                    onError={handleImageError}
                />
            </figure>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className={STYLES.title}>
                        {title}
                    </h3>
                    <div className={STYLES.tagContainer}>
                        {tags.map((label, index) => (
                            <span 
                                className={STYLES.tag}
                                key={`${title}-tag-${index}`}
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
                {hasLink && (
                    <div className={STYLES.arrow + ' flex-shrink-0'}>
                        <span
                            className="material-symbols-rounded"
                            aria-hidden="true"
                        >
                            arrow_outward
                        </span>
                    </div>
                )}
            </div>
            {hasLink ? (
                <a
                    href={projectLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0"
                    aria-label={`查看项目: ${title}`}
                >
                    <span className="sr-only">查看项目: {title}</span>
                </a>
            ) : (
                <div className="absolute inset-0" aria-label={`项目: ${title}（暂无链接）`}>
                    <span className="sr-only">项目: {title}（暂无链接）</span>
                </div>
            )}
        </div>
    );
});

ProjectCard.displayName = 'ProjectCard';

ProjectCard.propTypes = {
    imgSrc: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string).isRequired,
    projectLink: PropTypes.string.isRequired,
    classes: PropTypes.string
};

export default ProjectCard; 