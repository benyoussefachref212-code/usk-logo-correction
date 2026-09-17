import { createFileRoute } from "@tanstack/react-router";
import {
  Eye,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { uploadAsset } from "../lib/asset-upload";
import "../usk.css";
import { TeamLogo } from "../components/TeamLogo";
import {
  generateVirtualKit,
  getVirtualKit,
  officialTeams,
  saveTeams,
  teamBadge,
  type Team,
  updateTeamLogo,
  useTeams,
} from "../data/teams";

const emptyTeam: Omit<Team, "id"> = {
  abbreviation: "",
  name: "",
  colors: "#b51f32",
  accent: "#10233f",
  stadium: "Stade municipal",
  city: "",
  competition: "Championnat",
  group: "Groupe 1",
  season: "2024 / 25",
};

function AdminTeamsPage() {
  const teams = useTeams();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Team | null>(null);
  const [viewing, setViewing] = useState<Team | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<Omit<Team, "id">>(emptyTeam);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const filtered = useMemo(
    () =>
      teams.filter((team) =>
        `${team.name} ${team.abbreviation} ${team.city}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [teams, query],
  );
  const open = (team?: Team) => {
    setEditing(team || null);
    setPendingLogoFile(null);
    setForm(team ? { ...team } : { ...emptyTeam });
    setEditorOpen(true);
  };
  const close = () => {
    setEditing(null);
    setPendingLogoFile(null);
    setEditorOpen(false);
  };
  const update = (key: keyof Omit<Team, "id">, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const save = async () => {
    setSaving(true);
    let uploadPath: string | null = null;
    try {
      const id = editing?.id || `team-${Date.now()}`;
      let logo = form.logo;
      if (pendingLogoFile) {
        uploadPath = `teams/${id}/logo-${Date.now()}-${pendingLogoFile.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
        logo = await uploadAsset({ data: { path: uploadPath, file: pendingLogoFile } });
      }
      const logoChanged = Boolean(editing && logo !== editing.logo);
      const next: Team = {
        id,
        ...form,
      };
      if (logo !== undefined) next.logo = logo;
      if (logoChanged) {
        const previousKit = editing ? getVirtualKit(editing) : null;
        next.virtualKit = {
          status: "pending",
          generatedAt: null,
          logo: logo || null,
          pattern: previousKit?.pattern || "crest",
          patternScale: previousKit?.patternScale || 18,
          patternAngle: previousKit?.patternAngle || 0,
        };
      } else if (editing?.virtualKit) {
        next.virtualKit = editing.virtualKit;
      }
      const nextTeams = editing
        ? teams.map((team) => (team.id === editing.id ? next : team))
        : [...teams, next];
      await saveTeams(nextTeams);
      close();
    } catch (error) {
      console.error("[team-logo] Save flow failed", {
        file: pendingLogoFile,
        bucket: "usk-assets",
        path: uploadPath,
        "upload error": error,
        "team id": editing?.id || "new",
        "database error": error,
        "public URL": form.logo || null,
      });
      const message = error instanceof Error ? error.message : "Erreur de stockage";
      window.alert(`L’équipe n’a pas pu être enregistrée : ${message}`);
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id: string) => {
    if (window.confirm("Supprimer cette équipe ?"))
      await saveTeams(teams.filter((team) => team.id !== id));
  };
  const reset = async () => {
    if (window.confirm("Restaurer les 14 équipes officielles ?")) await saveTeams(officialTeams);
  };
  const generateKit = async (teamId: string) => {
    setGeneratingId(teamId);
    try {
      await generateVirtualKit(teams, teamId);
    } finally {
      setGeneratingId(null);
    }
  };
  const uploadLogo = async (teamId: string, file: File) => {
    const path = `teams/${teamId}/logo-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
    try {
      const logoUrl = await uploadAsset({ data: { path, file } });
      await updateTeamLogo(teams, teamId, logoUrl);
    } catch (error) {
      console.error("[team-logo] Complete upload flow failed", {
        file,
        bucket: "usk-assets",
        path,
        "team id": teamId,
        "upload error": error,
        "public URL": null,
        "database error": error,
      });
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      window.alert(`L’enregistrement du logo a échoué : ${message}`);
    }
  };
  const teamLogo = (team: Team) => team.logo || getVirtualKit(team).logo;

  return (
    <div className="admin-teams-page">
      <div className="admin-teams-toolbar">
        <div>
          <span className="section-kicker">COMPÉTITION · GROUPE 1</span>
          <h2>Équipes</h2>
          <p>Gérez les clubs inscrits et leurs identités visuelles.</p>
        </div>
        <div className="admin-teams-actions">
          <button className="admin-secondary-button" onClick={reset}>
            <RotateCcw size={15} /> Réinitialiser
          </button>
          <button className="admin-primary-button" onClick={() => open()}>
            <Plus size={16} /> Ajouter une équipe
          </button>
        </div>
      </div>
      <div className="admin-teams-search">
        <Search size={16} />
        <input
          aria-label="Rechercher une équipe"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher par nom, ville ou abréviation..."
        />
        <span>{filtered.length} équipes</span>
      </div>
      <section className="admin-team-grid" aria-label="Équipes du groupe 1">
        {filtered.map((team, index) => {
          const kit = getVirtualKit(team);
          const loading = generatingId === team.id;
          const logo = teamLogo(team);
          const identity = team.identity || {
            primary: team.colors,
            secondary: team.accent,
            pattern: kit.pattern,
            scale: kit.patternScale,
            angle: kit.patternAngle,
          };
          return (
            <article
              className={`admin-team-card pattern-${identity.pattern}`}
              style={
                {
                  animationDelay: `${index * 35}ms`,
                  "--team-primary": identity.primary,
                  "--team-secondary": identity.secondary,
                  "--team-pattern-size": `${identity.scale}px`,
                  "--team-pattern-angle": `${identity.angle}deg`,
                  "--team-watermark": logo ? `url(${logo})` : "none",
                } as React.CSSProperties
              }
              key={team.id}
            >
              <div className="admin-team-card-top">
                <span className="admin-team-badge" style={teamBadge(team)}>
                  {logo ? (
                    <TeamLogo src={logo} name={team.name} abbreviation={team.abbreviation} alt={`Logo ${team.abbreviation}`} />
                  ) : (
                    <>
                      <Shield size={22} />
                      <b>{team.abbreviation}</b>
                    </>
                  )}
                </span>
                <span className="admin-team-index">
                  {String(teams.indexOf(team) + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="admin-team-card-copy">
                <div>
                  <span className="section-kicker">
                    {team.group} · {team.season}
                  </span>
                  <h3>{team.name}</h3>
                  <p>
                    {team.abbreviation} · {team.city || "Tunisie"}
                  </p>
                </div>
                <div
                  className="admin-team-kit"
                  style={
                    {
                      "--kit-primary": team.colors,
                      "--kit-accent": team.accent,
                    } as React.CSSProperties
                  }
                >
                  <div
                    className={`virtual-shirt-preview pattern-${kit.pattern}`}
                    style={
                      {
                        "--kit-scale": `${kit.patternScale}px`,
                        "--kit-angle": `${kit.patternAngle}deg`,
                      } as React.CSSProperties
                    }
                  >
                    {logo ? <TeamLogo src={logo} name={team.name} abbreviation={team.abbreviation} alt="" /> : <b>{team.abbreviation}</b>}
                  </div>
                  <span className={kit.status === "ready" ? "kit-status ready" : "kit-status"}>
                    {kit.status === "ready" ? "Tenue générée" : "Tenue à générer"}
                  </span>
                </div>
              </div>
              <div className="admin-team-meta">
                <span>{team.stadium}</span>
                <span>{team.competition}</span>
              </div>
              <div className="admin-team-card-actions">
                <button className="icon-button" onClick={() => open(team)}>
                  <Pencil size={15} /> Modifier
                </button>
                <button className="icon-button" onClick={() => setViewing(team)}>
                  <Eye size={15} /> Voir la tenue
                </button>
                <button
                  className="icon-button"
                  onClick={() => generateKit(team.id)}
                  disabled={loading}
                >
                  {loading ? <LoaderCircle size={15} className="spin" /> : <Sparkles size={15} />}
                  {loading ? "Génération..." : kit.status === "ready" ? "Régénérer" : "Générer"}
                </button>
                <button
                  className="icon-button danger"
                  onClick={() => remove(team.id)}
                  aria-label={`Supprimer ${team.abbreviation}`}
                >
                  <Trash2 size={15} />
                  <span>Supprimer</span>
                </button>
              </div>
              <label className="admin-logo-link">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadLogo(team.id, file);
                  }}
                />
                <span className="admin-logo-link-preview">
                  {logo ? (
                    <TeamLogo src={logo} name={team.name} abbreviation={team.abbreviation} alt={`Logo actuel de ${team.abbreviation}`} />
                  ) : (
                    <ImagePlus size={17} />
                  )}
                </span>
                <span className="admin-logo-link-copy">
                  <strong>{logo ? "Modifier le logo" : "Importer le logo"}</strong>
                  <small>PNG, JPG ou WEBP</small>
                </span>
              </label>
            </article>
          );
        })}
      </section>
      {viewing && (
        <div className="admin-modal-backdrop" onClick={() => setViewing(null)}>
          <div
            className="admin-modal admin-kit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kit-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <span className="section-kicker">IDENTITÉ VISUELLE</span>
                <h3 id="kit-title">Tenue {viewing.abbreviation}</h3>
              </div>
              <button className="icon-button" onClick={() => setViewing(null)} aria-label="Fermer">
                <X size={16} />
              </button>
            </div>
            <div className="kit-detail">
              <div className="kit-detail-logo">
                {teamLogo(viewing) ? (
                  <TeamLogo src={teamLogo(viewing)} name={viewing.name} abbreviation={viewing.abbreviation} alt={`Logo ${viewing.abbreviation}`} />
                ) : (
                  <b>{viewing.abbreviation}</b>
                )}
              </div>
              <div
                className={`virtual-shirt-preview large pattern-${getVirtualKit(viewing).pattern}`}
                style={
                  {
                    "--kit-primary": viewing.colors,
                    "--kit-accent": viewing.accent,
                    "--kit-scale": `${getVirtualKit(viewing).patternScale}px`,
                    "--kit-angle": `${getVirtualKit(viewing).patternAngle}deg`,
                  } as React.CSSProperties
                }
              >
                {teamLogo(viewing) ? (
                  <TeamLogo src={teamLogo(viewing)} name={viewing.name} abbreviation={viewing.abbreviation} alt="" />
                ) : (
                  <b>{viewing.abbreviation}</b>
                )}
              </div>
              <div>
                <strong>
                  {getVirtualKit(viewing).status === "ready" ? "Tenue générée" : "Tenue en attente"}
                </strong>
                <p>
                  {getVirtualKit(viewing).generatedAt
                    ? `Générée le ${new Date(getVirtualKit(viewing).generatedAt as string).toLocaleDateString("fr-FR")}`
                    : "Générez la tenue depuis la fiche équipe."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {editorOpen && (
        <div className="admin-modal-backdrop" onClick={close}>
          <div
            className="admin-modal admin-team-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <span className="section-kicker">IDENTITÉ DU CLUB</span>
                <h3>{editing ? "Modifier l’équipe" : "Ajouter une équipe"}</h3>
              </div>
              <button className="icon-button" onClick={close} aria-label="Fermer">
                <X size={16} />
              </button>
            </div>
            <div className="admin-team-form">
              <label>
                Nom arabe
                <input
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  dir="rtl"
                />
              </label>
              <label>
                Abréviation
                <input
                  value={form.abbreviation}
                  onChange={(event) => update("abbreviation", event.target.value.toUpperCase())}
                />
              </label>
              <label>
                Ville
                <input value={form.city} onChange={(event) => update("city", event.target.value)} />
              </label>
              <label>
                Stade
                <input
                  value={form.stadium}
                  onChange={(event) => update("stadium", event.target.value)}
                />
              </label>
              <label className="admin-logo-upload">
                Logo officiel
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setPendingLogoFile(file);
                    setForm((current) => {
                      const { virtualKit: _virtualKit, ...withoutKit } = current;
                      return withoutKit;
                    });
                  }}
                />
                {form.logo && <TeamLogo src={form.logo} name={form.name || "Équipe"} abbreviation={form.abbreviation} alt="Logo actuel" />}
                {pendingLogoFile && <small>Logo sélectionné : {pendingLogoFile.name}</small>}
              </label>
              <label>
                Couleur principale
                <input
                  type="color"
                  value={form.colors}
                  onChange={(event) => update("colors", event.target.value)}
                />
              </label>
              <label>
                Couleur secondaire
                <input
                  type="color"
                  value={form.accent}
                  onChange={(event) => update("accent", event.target.value)}
                />
              </label>
            </div>
            <div className="admin-editor-actions">
              <button className="admin-secondary-button" onClick={close}>
                Annuler
              </button>
              <button
                className="admin-primary-button"
                onClick={save}
                disabled={saving || !form.name.trim() || !form.abbreviation.trim()}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export const Route = createFileRoute("/admin/equipes")({
  component: AdminTeamsPage,
  head: () => ({ meta: [{ title: "Équipes — Administration USK" }] }),
});
