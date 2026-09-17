import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ChevronDown,
  Eye,
  Filter,
  Flag,
  House,
  Info,
  List,
  MapPin,
  Pencil,
  Pause as PauseIcon,
  Play,
  Plus,
  Route as RouteIcon,
  Search,
  Shield,
  Siren,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createMatchId,
  formatElapsedSeconds,
  getElapsedSeconds,
  normalizeMatch,
  formatMatchDate,
  matchResult,
  saveMatches,
  updateMatchStatus,
  useMatches,
  type Match,
  type MatchStatus,
} from "../data/matches";
import { getTeamById, getTeamStadium, useTeams, type Team } from "../data/teams";
import "../usk.css";

export const Route = createFileRoute("/admin/matchs")({
  component: AdminMatchsPage,
  head: () => ({ meta: [{ title: "Gestion des matchs — USK" }] }),
});

const empty: Omit<Match, "id"> = {
  date: "",
  time: "16:00",
  homeTeamId: "usk",
  opponentTeamId: "",
  opponent: "",
  opponentShort: "",
  opponentLogo: "",
  competition: "Championnat",
  home: true,
  stadium: "Stade de Kelibia",
  status: "upcoming",
  referee: "",
  assistantReferee1: "",
  assistantReferee2: "",
  fourthReferee: "",
};

const tabs: { status: MatchStatus | "all"; label: string }[] = [
  { status: "all", label: "Tous" },
  { status: "upcoming", label: "À venir" },
  { status: "live", label: "En cours" },
  { status: "finished", label: "Terminés" },
  { status: "postponed", label: "Reportés" },
  { status: "cancelled", label: "Annulés" },
];

function AdminMatchsPage() {
  const teams = useTeams();
  const matches = useMatches();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<MatchStatus | "all">("all");
  const [editing, setEditing] = useState<Match | null>(null);
  const [detailsMatch, setDetailsMatch] = useState<Match | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<Omit<Match, "id">>(empty);
  const [saveMessage, setSaveMessage] = useState("");
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Match | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const remove = async (id: string) => {
    setDeleteSaving(true);
    try {
      await saveMatches(matches.filter((match) => match.id !== id));
      setSaveMessage("Match supprimé avec succès.");
      setPendingDelete(null);
      window.setTimeout(() => setSaveMessage(""), 3500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      console.error("[v0] Match delete failed:", error);
      setSaveMessage(`Impossible de supprimer le match : ${message}`);
    } finally {
      setDeleteSaving(false);
    }
  };

  const filtered = useMemo(
    () =>
      matches.filter((match) => {
        const matchesTab = activeTab === "all" || match.status === activeTab;
        const needle = query.trim().toLowerCase();
        return (
          matchesTab &&
          (!needle ||
            `${match.opponent} ${match.competition} ${match.stadium}`
              .toLowerCase()
              .includes(needle))
        );
      }),
    [matches, query, activeTab],
  );
  const counts = {
    all: matches.length,
    upcoming: matches.filter((match) => match.status === "upcoming").length,
    live: matches.filter((match) => match.status === "live").length,
    finished: matches.filter((match) => match.status === "finished").length,
    postponed: matches.filter((match) => match.status === "postponed").length,
    cancelled: matches.filter((match) => match.status === "cancelled").length,
  };
  const season = "2025 / 2026";

  const open = (match?: Match) => {
    setEditing(match || null);
    const homeTeam = getTeamById(teams, match?.homeTeamId || empty.homeTeamId);
    setForm(
      match
        ? { ...match, stadium: getTeamStadium(homeTeam) }
        : { ...empty, stadium: getTeamStadium(homeTeam) },
    );
    setEditorOpen(true);
  };
  const close = () => {
    setEditing(null);
    setEditorOpen(false);
  };
  const update = (patch: Partial<Omit<Match, "id">>) =>
    setForm((current) => ({ ...current, ...patch }));
  const save = async () => {
    if (
      !form.date ||
      !form.homeTeamId ||
      !form.opponentTeamId ||
      form.homeTeamId === form.opponentTeamId ||
      !form.competition.trim()
    )
      return;
    const homeTeam = getTeamById(teams, form.homeTeamId);
    const opponentTeam = getTeamById(teams, form.opponentTeamId);
    if (!homeTeam || !opponentTeam) {
      setSaveMessage("Sélectionnez deux équipes existantes dans la base des équipes.");
      return;
    }
    const homeStadium = getTeamStadium(homeTeam);
    if (!homeStadium) {
      setSaveMessage("Complétez le stade de l’équipe à domicile dans /admin/équipes.");
      return;
    }
    const clean = normalizeMatch({
      ...form,
      stadium: homeStadium,
      opponent: form.opponent.trim(),
      opponentShort:
        form.opponentShort.trim().toUpperCase() || form.opponent.trim().slice(0, 3).toUpperCase(),
    });
    const next = editing
      ? matches.map((match) => (match.id === editing.id ? { ...clean, id: editing.id } : match))
      : [{ ...clean, id: createMatchId() }, ...matches];
    try {
      await saveMatches(next);
      setSaveMessage("Match enregistré avec succès.");
      close();
      if (clean.status === "live") void navigate({ to: "/admin/live-match" });
      window.setTimeout(() => setSaveMessage(""), 3500);
    } catch (error) {
      const details = error as { message?: string; code?: string; details?: string; hint?: string };
      const diagnostic = [
        details.message,
        details.code && `code ${details.code}`,
        details.details,
        details.hint,
      ]
        .filter(Boolean)
        .join(" — ");
      setSaveMessage(
        `Impossible d’enregistrer le match : ${diagnostic || "Erreur Supabase inconnue"}`,
      );
    }
  };
  return (
    <main className="reference-matches-page">
      {saveMessage && (
        <div className="match-save-toast" role="status">
          {saveMessage}
        </div>
      )}
      <section className="reference-matches-hero">
        <div className="reference-matches-heading">
          <div className="reference-matches-icon">
            <CalendarDays size={38} />
          </div>
          <div>
            <div className="reference-breadcrumb">
              Accueil <span>›</span> <strong>Matchs</strong>
            </div>
            <h1>Gestion des matchs</h1>
            <p>Planifiez, modifiez et publiez les rencontres de l&apos;équipe.</p>
          </div>
        </div>
        <button className="reference-match-primary" onClick={() => open()}>
          <Plus size={19} /> Programmer un match
        </button>
      </section>
      <div className="reference-matches-toolbar">
        <div className="reference-matches-tabs" role="tablist" aria-label="Filtrer les matchs">
          {tabs.map((tab) => (
            <button
              key={tab.status}
              role="tab"
              aria-selected={activeTab === tab.status}
              className={activeTab === tab.status ? "active" : ""}
              onClick={() => setActiveTab(tab.status)}
            >
              {tab.label} ({counts[tab.status]})
            </button>
          ))}
        </div>
        <label className="reference-match-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un match..."
          />
        </label>
        <button className="reference-match-season">
          <CalendarDays size={17} /> Saison {season} <ChevronDown size={16} />
        </button>
        <button className="reference-match-filter">
          <Filter size={17} /> Filtrer
        </button>
      </div>
      <section className="reference-match-list">
        <div className="reference-list-title">
          <h2>Rencontres</h2>
          <span>
            Affichage de {filtered.length} sur {matches.length} matchs
          </span>
        </div>
        <div className="reference-match-cards">
          {filtered.length ? (
            filtered.map((match) => (
              <MatchRow
                key={match.id}
                match={match}
                teams={teams}
                onDetails={() => setDetailsMatch(match)}
                onEdit={() => open(match)}
                onRemove={() => setPendingDelete(match)}
                onStatusChange={async (status) => {
                  setStatusSavingId(match.id);
                  try {
                    await updateMatchStatus(match.id, status);
                    setSaveMessage("Statut du match mis à jour.");
                    setStatusMenuId(null);
                    if (status === "live") void navigate({ to: "/admin/live-match" });
                  } catch (error) {
                    const details = error as {
                      message?: string;
                      code?: string;
                      details?: string;
                      hint?: string;
                    };
                    setSaveMessage(
                      `Impossible de modifier le statut : ${[details.message, details.code && `code ${details.code}`, details.details, details.hint].filter(Boolean).join(" — ") || "Erreur Supabase inconnue"}`,
                    );
                  } finally {
                    setStatusSavingId(null);
                  }
                }}
                statusMenuOpen={statusMenuId === match.id}
                statusSaving={statusSavingId === match.id}
                onToggleStatus={() => setStatusMenuId(statusMenuId === match.id ? null : match.id)}
              />
            ))
          ) : (
            <div className="reference-empty-state">
              Aucun match ne correspond à votre recherche.
            </div>
          )}
        </div>
        <footer className="reference-match-pagination">
          <span>
            Affichage de {filtered.length} sur {matches.length} matchs
          </span>
          <div>
            <button>«</button>
            <button>‹</button>
            <button className="current">1</button>
            <button>2</button>
            <button>›</button>
            <button>»</button>
            <select aria-label="Matchs par page" defaultValue="6">
              <option value="6">6 / matchs</option>
            </select>
          </div>
        </footer>
      </section>
      {detailsMatch && (
        <MatchDetails
          match={matches.find((match) => match.id === detailsMatch.id) || detailsMatch}
          teams={teams}
          onClose={() => setDetailsMatch(null)}
        />
      )}
      {editorOpen && (
        <Editor
          editing={editing}
          form={form}
          teams={teams}
          update={update}
          save={save}
          close={close}
        />
      )}
      {pendingDelete && (
        <div className="match-delete-backdrop" role="presentation" onMouseDown={() => !deleteSaving && setPendingDelete(null)}>
          <section
            className="match-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="match-delete-title"
            aria-describedby="match-delete-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="match-delete-icon" aria-hidden="true"><Trash2 size={21} /></div>
            <h2 id="match-delete-title">Supprimer ce match ?</h2>
            <p id="match-delete-description">Cette action supprimera définitivement le match contre <strong>{pendingDelete.opponent}</strong>.</p>
            <div className="match-delete-actions">
              <button type="button" className="match-delete-cancel" disabled={deleteSaving} onClick={() => setPendingDelete(null)}>Annuler</button>
              <button type="button" className="match-delete-confirm" disabled={deleteSaving} onClick={() => void remove(pendingDelete.id)}>
                {deleteSaving ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Kpi({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <div className={`reference-match-kpi ${tone}`}>
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

function TeamLogo({ team, fallback }: { team?: Team; fallback: string }) {
  return team?.logo ? (
    <img className="reference-match-logo" src={team.logo} alt={`Logo ${team.name}`} />
  ) : (
    <span className="reference-match-logo-fallback">{fallback}</span>
  );
}

function MatchRow({
  match,
  teams,
  onDetails,
  onEdit,
  onRemove,
  onStatusChange,
  statusMenuOpen,
  statusSaving,
  onToggleStatus,
}: {
  match: Match;
  teams: Team[];
  onDetails: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onStatusChange: (status: MatchStatus) => Promise<void>;
  statusMenuOpen: boolean;
  statusSaving: boolean;
  onToggleStatus: () => void;
}) {
  const home = getTeamById(teams, match.homeTeamId) || getTeamById(teams, "usk");
  const away = getTeamById(teams, match.opponentTeamId);
  const statusOption = getMatchStatusOption(match.status);
  const statusLabel = statusOption.label;
  return (
    <article
      className={`reference-match-row status-${match.status}`}
      role="button"
      tabIndex={0}
      aria-label={`Voir les détails du match contre ${match.opponent}`}
      onClick={onDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onDetails();
        }
      }}
    >
      <div className="reference-match-date" data-status={statusLabel.toUpperCase()}>
        <b>
          {new Intl.DateTimeFormat("fr-FR", { weekday: "short" })
            .format(new Date(`${match.date}T12:00:00`))
            .toUpperCase()}
        </b>
        <strong>{new Date(`${match.date}T12:00:00`).getDate()}</strong>
        <b>
          {new Intl.DateTimeFormat("fr-FR", { month: "short" })
            .format(new Date(`${match.date}T12:00:00`))
            .toUpperCase()}
        </b>
        <small>{new Date(`${match.date}T12:00:00`).getFullYear()}</small>
      </div>
      <div className="reference-match-competition">
        <span>
          <ShieldIcon />
        </span>
        <div>
          <strong>{match.competition.split(" · ")[0]}</strong>
          <small>{match.competition.split(" · ")[1] || "Rencontre"}</small>
        </div>
      </div>
      <div className="reference-match-teams">
        <div>
          <strong>{home?.abbreviation || "USK"}</strong>
          <TeamLogo team={home} fallback="USK" />
          <small>{home?.name || "Union Sportive de Kelibia"}</small>
        </div>
        <b>
          <small>VS</small>
        </b>
        <div>
          <TeamLogo team={away} fallback={match.opponentShort} />
          <strong>{away?.abbreviation || match.opponentShort}</strong>
          <small>{match.opponent}</small>
        </div>
      </div>
      <div className={`reference-match-time${match.status === "finished" ? " reference-match-time-finished" : ""}`}>
        {match.status === "finished" ? (
          <strong aria-label="Score final">
            {match.scoreFor ?? 0} - {match.scoreAgainst ?? 0}
          </strong>
        ) : match.status === "live" ? (
          <>
            <MatchClock match={match} />
            <small>{match.scoreFor ?? 0} - {match.scoreAgainst ?? 0}</small>
          </>
        ) : (
          match.time || "--:--"
        )}
      </div>
      <div className="reference-match-venue">
        <MapPin size={17} />
        <span>
          {match.stadium}
          <small>{home?.city || "Tunisie"}</small>
        </span>
      </div>
      <div className="reference-match-referees">
        <span>
          <Info size={13} /> Arbitre : {match.referee || "--"}
        </span>
        <span>A1 : {match.assistantReferee1 || "--"}</span>
        <span>A2 : {match.assistantReferee2 || "--"}</span>
        <span>4ème : {match.fourthReferee || "--"}</span>
      </div>
      <div className="reference-match-status-wrap">
        <button
          type="button"
          className={`reference-match-status status-${match.status}`}
          aria-haspopup="menu"
          aria-expanded={statusMenuOpen}
          aria-label={`Modifier le statut : ${statusLabel}`}
          disabled={statusSaving}
          onClick={(event) => {
            event.stopPropagation();
            onToggleStatus();
          }}
        >
          <statusOption.icon size={14} />
          {statusSaving ? "Enregistrement…" : statusLabel}
          <ChevronDown size={13} />
        </button>
        {statusMenuOpen && (
          <div
            className="reference-match-status-menu"
            role="menu"
            aria-label="Nouveau statut"
            onClick={(event) => event.stopPropagation()}
          >
            {matchStatusOptions
              .filter((option) => option.value !== match.status)
              .map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    type="button"
                    role="menuitem"
                    key={option.value}
                    onClick={() => void onStatusChange(option.value)}
                  >
                    <Icon size={14} />
                    {option.label}
                  </button>
                );
              })}
          </div>
        )}
      </div>
      <div className="reference-match-actions">
        <button
          aria-label={`Voir ${match.opponent}`}
          onClick={(event) => {
            event.stopPropagation();
            onDetails();
          }}
        >
          <Eye size={17} />
        </button>
        <button
          aria-label={`Modifier ${match.opponent}`}
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
        >
          <Pencil size={17} />
        </button>
        <button
          type="button"
          className="reference-match-delete"
          aria-label={`Supprimer ${match.opponent}`}
          title={`Supprimer ${match.opponent}`}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 size={17} strokeWidth={2.2} />
        </button>
      </div>
    </article>
  );
}
function MatchClock({ match }: { match: Match }) {
  const [seconds, setSeconds] = useState(() => getElapsedSeconds(match));

  useEffect(() => {
    const refresh = () => setSeconds(getElapsedSeconds(match));
    refresh();
    if (match.status !== "live") return;
    const timer = window.setInterval(refresh, 1000);
    return () => window.clearInterval(timer);
  }, [match]);

  return (
    <span aria-label={`Temps de jeu : ${formatElapsedSeconds(seconds)}`}>
      {formatElapsedSeconds(seconds)}
    </span>
  );
}

function MatchDetails({
  match,
  teams,
  onClose,
}: {
  match: Match;
  teams: Team[];
  onClose: () => void;
}) {
  const home = getTeamById(teams, match.homeTeamId) || getTeamById(teams, "usk");
  const away = getTeamById(teams, match.opponentTeamId);
  const result = matchResult(match);
  const statusLabel =
    match.status === "live"
      ? "En cours"
      : match.status === "finished"
        ? "Terminé"
        : match.status === "postponed"
          ? "Reporté"
          : match.status === "cancelled"
            ? "Annulé"
            : "À venir";
  return (
    <div
      className="match-details-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="match-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-details-title"
      >
        <header className="match-details-header">
          <div>
            <span className="match-details-kicker">FICHE DE LA RENCONTRE</span>
            <h2 id="match-details-title">Détails du match</h2>
            <p>
              {formatMatchDate(match.date)} · {match.time || "Heure à confirmer"}
            </p>
          </div>
          <button
            type="button"
            className="match-details-close"
            aria-label="Fermer les détails"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="match-details-hero">
          <div className="match-details-competition">
            <Trophy size={16} /> {match.competition.replaceAll(" · ", " · ")}
          </div>
          <div className="match-details-scoreboard">
            <div>
              <TeamLogo team={home} fallback={home?.abbreviation || "USK"} />
              <strong>{home?.abbreviation || "USK"}</strong>
              <small>{home?.name || "Union Sportive de Kelibia"}</small>
            </div>
            <div className="match-details-score">
              <span>
                {match.status === "live" || match.status === "finished" ? (
                  <>
                    {match.scoreFor ?? 0} - {match.scoreAgainst ?? 0}
                    {match.status === "live" && <MatchClock match={match} />}
                  </>
                ) : (
                  "VS"
                )}
              </span>
              <b className={`match-details-status status-${match.status}`}>{statusLabel}</b>
            </div>
            <div>
              <TeamLogo team={away} fallback={match.opponentShort} />
              <strong>{away?.abbreviation || match.opponentShort}</strong>
              <small>{match.opponent}</small>
            </div>
          </div>
          {match.status === "finished" && (
            <div className={`match-details-result result-${result}`}>
              Résultat : {result === "V" ? "Victoire" : result === "N" ? "Match nul" : "Défaite"}
            </div>
          )}
        </div>
        <div className="match-details-grid">
          <div className="match-details-info">
            <MapPin />
            <span>
              <small>STADE</small>
              <strong>{match.stadium || "Non renseigné"}</strong>
              <em>{home?.city || "Tunisie"}</em>
            </span>
          </div>
          <div className="match-details-info">
            <CalendarClock />
            <span>
              <small>DATE & HEURE</small>
              <strong>{formatMatchDate(match.date)}</strong>
              <em>{match.time || "À confirmer"}</em>
            </span>
          </div>
          <div className="match-details-info">
            <Shield />
            <span>
              <small>SAISON</small>
              <strong>{match.competition.split(" · ")[1] || "2025 / 2026"}</strong>
              <em>{match.competition.split(" · ")[2] || "Compétition officielle"}</em>
            </span>
          </div>
        </div>
        <section className="match-details-officials">
          <h3>
            <Siren size={17} /> Corps arbitral
          </h3>
          <div>
            <span>
              Arbitre principal<strong>{match.referee || "Non désigné"}</strong>
            </span>
            <span>
              Assistant 1<strong>{match.assistantReferee1 || "Non désigné"}</strong>
            </span>
            <span>
              Assistant 2<strong>{match.assistantReferee2 || "Non désigné"}</strong>
            </span>
            <span>
              4ème arbitre<strong>{match.fourthReferee || "Non désigné"}</strong>
            </span>
          </div>
        </section>
        <footer className="match-details-footer">
          <span>
            <CheckCircle2 size={16} /> Informations officielles de la rencontre
          </span>
          <button type="button" className="button button-red" onClick={onClose}>
            Fermer
          </button>
        </footer>
      </section>
    </div>
  );
}

const matchStatusOptions: Array<{ value: MatchStatus; label: string; icon: React.ElementType }> = [
  { value: "upcoming", label: "À venir", icon: Clock3 },
  { value: "live", label: "En cours", icon: Play },
  { value: "finished", label: "Terminé", icon: CheckCircle2 },
  { value: "postponed", label: "Reporté", icon: PauseIcon },
];

function getMatchStatusOption(status: MatchStatus) {
  return matchStatusOptions.find((option) => option.value === status) || matchStatusOptions[0];
}

function ShieldIcon() {
  return <CheckCircle2 size={19} />;
}

function TeamEditorCard({
  tone,
  label,
  icon: Icon,
  team,
  onOpenPicker,
}: {
  tone: "home" | "away";
  label: string;
  icon: React.ElementType;
  team?: Team;
  onOpenPicker: () => void;
}) {
  return (
    <div className={`match-editor-team-card ${tone}`}>
      <label>
        <Icon aria-hidden="true" />
        {label}
      </label>
      <div className="match-editor-team-select">
        <TeamLogo team={team} fallback={team?.abbreviation || "USK"} />
        <div>
          <strong>{team?.abbreviation || "Sélectionner"}</strong>
          <small>{team?.name || "Choisir une équipe"}</small>
        </div>
        <button
          type="button"
          className="match-editor-picker-trigger"
          aria-label={`Sélectionner ${label}`}
          onClick={onOpenPicker}
        >
          <ChevronDown size={18} />
        </button>
      </div>
      <div className="match-editor-team-stadium">
        <Shield size={26} />
        <div>
          <strong>{getTeamStadium(team) || "Stade non renseigné"}</strong>
          <span>
            <CheckCircle2 size={14} />{" "}
            {getTeamStadium(team)
              ? "Stade assigné automatiquement"
              : "À compléter dans les données de l’équipe"}
          </span>
        </div>
      </div>
    </div>
  );
}

function TeamPickerModal({
  teams,
  selectedId,
  onSelect,
  onClose,
}: {
  teams: Team[];
  selectedId?: string;
  onSelect: (team: Team) => void;
  onClose: () => void;
}) {
  const [pendingId, setPendingId] = useState(selectedId || "");
  const selectedTeam = teams.find((team) => team.id === pendingId);
  return (
    <div className="team-picker-backdrop" role="presentation">
      <section
        className="team-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-picker-title"
      >
        <header className="team-picker-header">
          <div>
            <span className="section-kicker">ÉQUIPES DISPONIBLES</span>
            <h2 id="team-picker-title">Sélectionner une équipe</h2>
            <p>Choisissez l&apos;équipe à associer à cette rencontre.</p>
          </div>
          <button type="button" aria-label="Fermer" onClick={onClose}>
            <X size={24} />
          </button>
        </header>
        <div className="team-picker-list">
          {teams.map((team) => {
            const selected = team.id === pendingId;
            return (
              <button
                type="button"
                key={team.id}
                className={`team-picker-row ${selected ? "selected" : ""}`}
                onClick={() => setPendingId(team.id)}
              >
                <TeamLogo team={team} fallback={team.abbreviation} />
                <span className="team-picker-identity">
                  <strong>
                    {team.abbreviation} <em>{team.name}</em>
                  </strong>
                  <small>{team.name}</small>
                </span>
                <span className="team-picker-location">
                  <MapPin size={18} />
                  <span>
                    <strong>{team.city}</strong>
                    <small>{getTeamStadium(team)}</small>
                  </span>
                </span>
                <span className="team-picker-competition">{team.competition || "Ligue 1"}</span>
                <span className="team-picker-radio" aria-hidden="true">
                  {selected && <CheckCircle2 size={20} />}
                </span>
              </button>
            );
          })}
        </div>
        <footer className="team-picker-footer">
          <div>
            <Shield size={32} />
            <span>
              Le stade sera automatiquement
              <br />
              assigné selon l&apos;équipe sélectionnée.
            </span>
          </div>
          <div>
            <button type="button" className="outline-button" onClick={onClose}>
              Annuler
            </button>
            <button
              type="button"
              className="button button-blue"
              disabled={!selectedTeam}
              onClick={() => selectedTeam && onSelect(selectedTeam)}
            >
              <CheckCircle2 size={20} /> Sélectionner l&apos;équipe
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function IconField({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="match-editor-label">
        <Icon aria-hidden="true" />
        {label}
      </span>
      {children}
    </label>
  );
}

function Editor({
  editing,
  form,
  teams,
  update,
  save,
  close,
}: {
  editing: Match | null;
  form: Omit<Match, "id">;
  teams: Team[];
  update: (patch: Partial<Omit<Match, "id">>) => void;
  save: () => void;
  close: () => void;
}) {
  const [picker, setPicker] = useState<"home" | "away" | null>(null);
  const pickerTeams =
    picker === "away" ? teams.filter((team) => team.id !== form.homeTeamId) : teams;
  const parts = form.competition.split(" · ");
  const competition = parts[0] === "Coupe de Tunisie" ? "Coupe de Tunisie" : "Championnat";
  const isCup = competition === "Coupe de Tunisie";
  const season = isCup ? parts[1] || "2025 / 2026" : parts[1] || "2025 / 2026";
  const round = isCup ? parts[2] || "" : parts[2] || "Journée 1";
  const phase = parts[3] || "Phase aller";
  const composeCompetition = (
    nextCompetition: string,
    nextSeason: string,
    nextRound: string,
    nextPhase: string,
  ) =>
    nextCompetition === "Coupe de Tunisie"
      ? [nextCompetition, nextSeason.trim(), nextRound.trim()].filter(Boolean).join(" · ")
      : [nextCompetition, nextSeason, nextRound, nextPhase].filter(Boolean).join(" · ");
  const setCompetition = (next: string) => {
    if (next === competition) return;
    update({
      competition:
        next === "Coupe de Tunisie"
          ? composeCompetition(next, season, "", "")
          : composeCompetition(next, season, "Journée 1", "Phase aller"),
    });
  };
  const setCompetitionDetail = (patch: { season?: string; round?: string; phase?: string }) =>
    update({
      competition: composeCompetition(
        competition,
        patch.season ?? season,
        patch.round ?? round,
        patch.phase ?? phase,
      ),
    });
  const chooseTeam = (team: Team) => {
    if (picker === "home")
      update({ homeTeamId: team.id, home: true, stadium: getTeamStadium(team) });
    if (picker === "away")
      update({
        opponentTeamId: team.id,
        opponent: team.name,
        opponentShort: team.abbreviation,
        opponentLogo: team.logo || "",
      });
    setPicker(null);
  };
  const statuses = [
    ["upcoming", "À venir", Clock3],
    ["live", "En cours", Play],
    ["finished", "Terminé", Flag],
    ["postponed", "Reporté", CalendarDays],
  ] as const;

  return (
    <div className="admin-editor-backdrop">
      <section
        className="admin-editor reference-match-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-editor-title"
      >
        <header className="admin-editor-head">
          <div className="match-editor-title-row">
            <CalendarDays size={42} className="match-editor-title-icon" />
            <div>
              <span className="section-kicker">
                {editing ? "MODIFIER UN MATCH" : "NOUVEAU MATCH"}
              </span>
              <h2 id="match-editor-title">
                {editing ? "Modifier la rencontre" : "Programmer un match"}
              </h2>
              <p>Renseignez toutes les informations pour planifier une rencontre.</p>
            </div>
          </div>
          <button aria-label="Fermer" onClick={close}>
            <X size={22} />
          </button>
        </header>

        <EditorSection number="1" title="Équipes">
          <div className="match-editor-team-grid">
            <TeamEditorCard
              tone="home"
              label="Équipe à domicile"
              icon={House}
              team={teams.find((team) => team.id === form.homeTeamId)}
              onOpenPicker={() => setPicker("home")}
            />
            <div className="match-editor-vs">VS</div>
            <TeamEditorCard
              tone="away"
              label="Équipe à l'extérieur"
              icon={RouteIcon}
              team={teams.find((team) => team.id === form.opponentTeamId)}
              onOpenPicker={() => setPicker("away")}
            />
          </div>
        </EditorSection>

        <EditorSection number="2" title="Date et heure">
          <div className="match-editor-fields two-columns">
            <IconField icon={CalendarDays} label="Date du match">
              <input
                type="date"
                value={form.date}
                onChange={(event) => update({ date: event.target.value })}
              />
            </IconField>
            <IconField icon={Clock3} label="Heure du match">
              <input
                type="time"
                value={form.time}
                onChange={(event) => update({ time: event.target.value })}
              />
            </IconField>
          </div>
        </EditorSection>

        <EditorSection number="3" title="Compétition et journée">
          <div className={`match-editor-fields ${isCup ? "three-columns" : "four-columns"}`}>
            <label>
              <span className="match-editor-label">
                <Trophy aria-hidden="true" />
                Compétition
              </span>
              <select value={competition} onChange={(event) => setCompetition(event.target.value)}>
                <option value="Championnat">Championnat</option>
                <option value="Coupe de Tunisie">Coupe de Tunisie</option>
              </select>
            </label>
            <label>
              <span className="match-editor-label">
                <CalendarDays aria-hidden="true" />
                Saison
              </span>
              <input
                value={season}
                placeholder="2025 / 2026"
                onChange={(event) => setCompetitionDetail({ season: event.target.value })}
              />
            </label>
            {isCup ? (
              <label>
                <span className="match-editor-label">
                  <List aria-hidden="true" />
                  Tour
                </span>
                <input
                  value={round}
                  placeholder="Tour 1, 16es de finale..."
                  onChange={(event) => setCompetitionDetail({ round: event.target.value })}
                />
              </label>
            ) : (
              <>
                <label>
                  <span className="match-editor-label">
                    <List aria-hidden="true" />
                    Journée
                  </span>
                  <select
                    value={round}
                    onChange={(event) => setCompetitionDetail({ round: event.target.value })}
                  >
                    {Array.from({ length: 13 }, (_, index) => `Journée ${index + 1}`).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="match-editor-label">
                    <ArrowLeftRight aria-hidden="true" />
                    Phase
                  </span>
                  <select
                    value={phase}
                    onChange={(event) => setCompetitionDetail({ phase: event.target.value })}
                  >
                    <option value="Phase aller">Phase aller</option>
                    <option value="Phase retour">Phase retour</option>
                  </select>
                </label>
              </>
            )}
          </div>
        </EditorSection>

        <EditorSection number="4" title="Stade">
          <div className="match-editor-stadium-row">
            <div className="match-editor-readonly-field">
              <span className="match-editor-label">
                <Building2 aria-hidden="true" />
                Stade
              </span>
              <div>
                <Building2 size={21} />
                {form.stadium || "Stade non renseigné"}
                <em>
                  <MapPin size={16} />{" "}
                  {teams.find((team) => team.id === form.homeTeamId)?.city || "Kelibia"}
                </em>
              </div>
            </div>
            <div className="match-editor-info">
              <CheckCircle2 size={20} />
              <span>Le stade est automatiquement assigné selon l&apos;équipe à domicile.</span>
            </div>
          </div>
        </EditorSection>

        <EditorSection number="5" title="Arbitres">
          <div className="match-editor-fields three-columns">
            <IconField icon={Siren} label="Arbitre principal">
              <input
                value={form.referee || ""}
                onChange={(event) => update({ referee: event.target.value })}
                placeholder="Nom de l’arbitre principal"
              />
            </IconField>
            <IconField icon={Flag} label="Arbitre assistant 1">
              <input
                value={form.assistantReferee1 || ""}
                onChange={(event) => update({ assistantReferee1: event.target.value })}
                placeholder="Nom de l’arbitre assistant 1"
              />
            </IconField>
            <IconField icon={Flag} label="Arbitre assistant 2">
              <input
                value={form.assistantReferee2 || ""}
                onChange={(event) => update({ assistantReferee2: event.target.value })}
                placeholder="Nom de l’arbitre assistant 2"
              />
            </IconField>
            <IconField icon={Siren} label="4ème arbitre">
              <input
                value={form.fourthReferee || ""}
                onChange={(event) => update({ fourthReferee: event.target.value })}
                placeholder="Nom du 4ème arbitre"
              />
            </IconField>
          </div>
        </EditorSection>

        <EditorSection number="6" title="Statut et options">
          <fieldset className="match-editor-status-field">
            <legend>Statut du match</legend>
            {statuses.map(([value, label, Icon]) => (
              <button
                type="button"
                key={value}
                className={form.status === value ? "active" : ""}
                onClick={() => update({ status: value })}
              >
                <Icon size={21} />
                {label}
              </button>
            ))}
          </fieldset>
        </EditorSection>
        <footer className="admin-editor-footer">
          <button className="outline-button" onClick={close}>
            <X aria-hidden="true" />
            Annuler
          </button>
          <button className="button button-red" onClick={save}>
            <CalendarDays aria-hidden="true" /> <CheckCircle2 aria-hidden="true" />
            Enregistrer le match
          </button>
        </footer>
      </section>
      {picker && (
        <TeamPickerModal
          teams={pickerTeams}
          selectedId={picker === "home" ? form.homeTeamId : form.opponentTeamId}
          onSelect={chooseTeam}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}

function EditorSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="match-editor-section">
      <h3>
        <span>{number}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}
