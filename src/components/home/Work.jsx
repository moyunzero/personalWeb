/**
 * Components
 */
import ProjectCard from "./ProjectCard";
import { projects } from '../../data/projects';

const Work =()=>{
    return(
      <section
        id="work"
        className="section"
      >
        <div className="container">
            <h2 className="headline-2 mb-8 reveal-up">
                做过的项目
            </h2>
            <div className="grid gap-x-4 gap-y-5 grid-cols-[repeat(auto-fill,_minmax(280px,_1fr))]">
                {
                    projects.map(({imgSrc,title,projectLink,tags},key)=>(
                        <ProjectCard 
                            imgSrc={imgSrc}
                            title={title}
                            projectLink={projectLink}
                            tags={tags}
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

export default Work