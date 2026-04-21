import PropTypes from 'prop-types';

const levelClasses = {
    1: 'pulse-level-1',
    2: 'pulse-level-2',
    3: 'pulse-level-3'
};

const SkillCard = ({ imgSrc, label, desc, level = 1, classes }) => {
    return (
        <div className={`p-4 rounded-2xl bg-zinc-800 ring-1 ring-inset ring-zinc-50/5 transition-all duration-300 group hover:scale-[1.02] ${levelClasses[level]} ${classes}`}>
            <div className="relative z-10 flex items-center gap-4">
                <figure className="img-box w-11 h-11 rounded-lg grid place-items-center bg-zinc-900/60 group-hover:scale-110 transition-transform duration-300">
                    <img
                        src={imgSrc}
                        alt={label}
                        width={24}
                        height={24}
                    />
                </figure>
                <div>
                    <h3 className="title-1 mb-1">
                        {label}
                    </h3>
                    <p className="text-sm text-zinc-400">
                        {desc}
                    </p>
                </div>
            </div>
        </div>
    );
};

SkillCard.propTypes = {
    imgSrc: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    desc: PropTypes.string.isRequired,
    level: PropTypes.number,
    classes: PropTypes.string
};

export default SkillCard;