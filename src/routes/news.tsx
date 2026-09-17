import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, ChevronRight, Newspaper } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PublicShell } from "../components/PublicShell";
import "../usk.css";
export const Route = createFileRoute("/news")({
  component: NewsPage,
  head: () => ({
    meta: [
      { title: "Actualités — USK" },
      { name: "description", content: "Toute l’actualité de l’Union Sportive de Kelibia." },
    ],
  }),
});
const articles = [
  {
    tag: "ÉQUIPE PREMIÈRE",
    title: "Une victoire qui compte double à Kelibia",
    date: "12 AVR. 2025",
    tone: "red",
    text: "Les sang et marine ont livré une prestation solide devant leur public et confortent leur place au classement.",
  },
  {
    tag: "CLUB",
    title: "Le stade se prépare pour un nouveau rendez-vous",
    date: "09 AVR. 2025",
    tone: "blue",
    text: "Tout le club se mobilise pour accueillir la prochaine journée de championnat dans les meilleures conditions.",
  },
  {
    tag: "ACADÉMIE",
    title: "Les jeunes sang et marine à l’honneur",
    date: "04 AVR. 2025",
    tone: "sand",
    text: "L’académie continue de former les talents de demain avec passion, exigence et esprit collectif.",
  },
];
function NewsPage() {
  return (
    <PublicShell
      kicker="LA VIE DU CLUB"
      title="Actualités"
      description="Les dernières nouvelles de l’équipe, du club et de notre académie."
      icon={Newspaper}
    >
      <div className="news-feed">
        {articles.map((article, index) => (
          <article className={`news-feature tone-${article.tone}`} key={article.title}>
            <div className="news-feature-art">
              <span>0{index + 1}</span>
              <ArrowUpRight size={22} />
            </div>
            <div className="news-feature-copy">
              <span className="news-tag">{article.tag}</span>
              <h2>{article.title}</h2>
              <p>{article.text}</p>
              <div className="news-meta">
                <time>{article.date}</time>
                <Link to="/news">
                  Lire l’article <ChevronRight size={15} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </PublicShell>
  );
}
export default NewsPage;
