/**
 * Components
 */
import SkillCard from "./SkillCard";
import { skills } from '../../data/skills';

const Skill = () => {
    return (
        <section
            id="skill"
            className="section"
        >
            <div className="container">
                <h2 className="headline-2 reveal-up">
                    技能树
                </h2>
                <p className="text-zinc-400 mt-3 mb-8 max-w-[50ch] reveal-up">
                    从 CRUD 到 AI，持续探索中 🚀
                </p>
                <div className="grid gap-3 grid-cols-[repeat(auto-fill,_minmax(250px,_1fr))]">
                    {
                        skills.map(({imgSrc,label,desc},key)=>(
                            <SkillCard 
                                imgSrc={imgSrc}
                                label={label}
                                desc={desc}
                                key={key}
                                classes="reveal-up"
                            />
                        ))
                    }
                </div>
            </div>
        </section>
    )
}
export default Skill