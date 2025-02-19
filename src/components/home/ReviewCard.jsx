import PropTypes from 'prop-types';

const ReviewCard = ({ content, name, imgSrc, company }) => {
    return (
        <div className="min-w-[300px] max-w-[400px] p-4 rounded-2xl bg-zinc-800 ring-1 ring-inset ring-zinc-50/5">
            <p className="text-zinc-300 mb-6">
                {content}
            </p>
            <div className="flex items-center gap-3">
                <figure className="img-box w-11 h-11 rounded-full overflow-hidden">
                    <img
                        src={imgSrc}
                        alt={name}
                        width={44}
                        height={44}
                        className="img-cover"
                    />
                </figure>
                <div>
                    <h3 className="text-base font-medium mb-1">
                        {name}
                    </h3>
                    <p className="text-sm text-zinc-400">
                        {company}
                    </p>
                </div>
            </div>
        </div>
    );
};

ReviewCard.propTypes = {
    content: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    imgSrc: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired
};

export default ReviewCard; 