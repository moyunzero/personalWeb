import { aboutItems } from '../../data/about';

const logoSrc = `${import.meta.env.BASE_URL}images/logo.svg`;

const About = () => {
    return(
        <section
            id="about"
            className="section"
        >
            <div className="container">
                <div className="bg-zinc-800/50 p-7 rounded-2xl md:p-12 reveal-up">
                    <p className="text-zinc-300 mb-4 md:mb-8 md:text-xl md:max-w-[60ch] leading-relaxed">
                        没有废话，只有折腾过的一些东西。
                        <br />
                        每个项目都是一次“我试试看”。
                        <br />
                        <span className="text-zinc-500">——什么都会一点，正在把“一点”变成“很多”</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-4 md:gap-7">
                        {
                            aboutItems.map(({label,number},key)=>(
                                <div key={key}>
                                    <div className="flex items-center md:mb-2">
                                        <span className="text-2xl font-semibold md:text-4xl">{number}</span>
                                        <span className="text-sky-400 font-semibold md:text-3xl">+</span>
                                    </div>
                                    <p className="text-sm text-zinc-400">{label}</p>
                                </div>
                            ))
                        }
                        <img
                            src={logoSrc}
                            alt="Logo"
                            width={30}
                            height={30}
                            className="ml-auto md:w-[40px] md:h-[40px]"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default About