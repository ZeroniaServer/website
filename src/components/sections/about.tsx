import { type Pool } from "../navbar";
import iconUrl from "../../assets/logo/icon.png";
import aboutData from "../../data/about/about.json";
import CustomMarkdown from "../custom-markdown";
import Section from "./section";
import "./about.css";

export const background = aboutData.background as Pool;

export default function About() {
  const body = aboutData.body as string[];
  return (
    <Section id="about" pool={background} className="about">
      <div className="about__header">
        <img className="about__icon" src={iconUrl} alt="" aria-hidden="true" />
        <h2 className="section__title about__title">
          <CustomMarkdown text={aboutData.title} inline />
        </h2>
      </div>
      {body.map((paragraph, i) => (
        <p className="about__paragraph" key={i}>
          <CustomMarkdown text={paragraph} inline />
        </p>
      ))}
    </Section>
  );
}
