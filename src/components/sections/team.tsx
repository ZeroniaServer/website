import { type Pool } from "../navbar";
import teamData from "../../data/team/team.json";
import Section from "./section";
import "./team.css";

interface Member {
  name: string;
  note?: string;
}

interface Group {
  role: string;
  members: Member[];
}

export const background = teamData.background as Pool;

const COLUMNS: string[][] = [
  ["Founders", "Developers", "Trailer Directors"],
  ["Builders"],
  ["Translators", "Discord Moderators"],
];

const headUrl = (name: string) =>
  `https://mc-heads.net/avatar/${encodeURIComponent(name)}/96`;

function Card({ group }: { group: Group }) {
  return (
    <div className="team__card">
      <div className="team__card-head">
        <span className="team__role">{group.role}</span>
        <span className="team__count">{group.members.length}</span>
      </div>
      <div className="team__card-body">
        {group.members.map((member, i) => (
          <div className="team__member" key={`${member.name}-${i}`}>
            <img
              className="team__avatar"
              src={headUrl(member.name)}
              alt={member.name}
              loading="lazy"
              width={32}
              height={32}
            />
            <span className="team__name" title={member.name}>
              {member.name}
            </span>
            {member.note && <span className="team__note">{member.note}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Team() {
  const groups = teamData.groups as Group[];
  const byRole = new Map(groups.map((g) => [g.role, g]));
  const placed = new Set(COLUMNS.flat());
  const columns = COLUMNS.map((roles) =>
    roles.map((role) => byRole.get(role)).filter((g): g is Group => !!g),
  );
  columns[0].push(...groups.filter((g) => !placed.has(g.role)));

  return (
    <Section id="team" pool={background} title="Team" className="team">
      <div className="team__grid">
        {columns.map((column, i) => (
          <div className="team__column" key={i}>
            {column.map((group) => (
              <Card group={group} key={group.role} />
            ))}
          </div>
        ))}
      </div>
    </Section>
  );
}
