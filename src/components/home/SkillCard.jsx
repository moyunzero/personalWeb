import PropTypes from 'prop-types';

const levelStyles = {
    1: 'before:bg-gradient-to-r before:from-zinc-500 before:to-zinc-600', // 入门-灰色
    2: 'before:bg-gradient-to-r before:from-sky-400 before:to-cyan-400',    // 熟悉-天蓝
    3: 'before:bg-gradient-to-r before:from-white before:to-sky-200'         // 精通-亮白
};

const SkillCard = ({ imgSrc, label, desc, level = 1, classes }) => {
    return (
        <div className={
            "p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700/50 active:bg-zinc-700/60 ring-1 ring-inset ring-zinc-50/5 transition-colors relative overflow-hidden group " + classes
        }>
            {/* 光效扫过 */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${levelStyles[level]}`}
                 style={{ clipPath: 'inset(0 100% 0 0)' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />
            </div>
            
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