import { memo } from 'react';
import PropTypes from 'prop-types';

// 抽取样式常量
const STYLES = {
    container: "relative p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700/50 active:bg-zinc-700/60 ring-1 ring-inset ring-zinc-50/5 transition-colors",
    image: "w-full h-full object-cover rounded-lg",
    imageBox: "aspect-square rounded-lg mb-4 overflow-hidden",
    title: "title-1 mb-3",
    tagContainer: "flex flex-wrap items-center gap-2",
    tag: "h-8 text-sm text-zinc-400 bg-zinc-50/5 grid items-center px-2 rounded-lg",
    arrow: "w-11 h-11 rounded-lg grid place-items-center bg-sky-400 text-zinc-950 shrink-0"
};

const ProjectCard = memo(({ imgSrc, title, tags, projectLink, classes }) => {
    return (
        <div className={`${STYLES.container} ${classes || ''}`}>
            <figure className={STYLES.imageBox}>
                <img
                    src={imgSrc}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    className={STYLES.image}
                />
            </figure>
            <div className="flex items-center justify-between gap-4">
                <div>
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
                <div className={STYLES.arrow}>
                    <span
                        className="material-symbols-rounded"
                        aria-hidden="true"
                    >
                        arrow_outward
                    </span>
                </div>
            </div>
            <a
                href={projectLink}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0"
                aria-label={`查看项目: ${title}`}
            >
                <span className="sr-only">查看项目: {title}</span>
            </a>
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