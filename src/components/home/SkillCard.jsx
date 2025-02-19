import PropTypes from 'prop-types';

const SkillCard = ({ imgSrc, label, desc, classes }) => {
    return (
        <div className={"p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700/50 active:bg-zinc-700/60 ring-1 ring-inset ring-zinc-50/5 transition-colors " + classes}>
            <div className="flex items-center gap-4">
                <figure className="img-box w-11 h-11 rounded-lg grid place-items-center">
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
    classes: PropTypes.string
};

export default SkillCard; 