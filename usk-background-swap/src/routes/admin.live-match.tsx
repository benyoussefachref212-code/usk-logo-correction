import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CircleStop,
  Clock3,
  Flag,
  Minus,
  Pause,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Square,
  Trophy,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  formatElapsedSeconds,
  getElapsedSeconds,
  updateMatch,
  saveMatches,
  useMatches,
  type Match,
} from "../data/matches";
import {
  getLiveState,
  loadLiveState,
  saveLiveState,
  type LiveEvent,
  type LiveState,
} from "../data/live";
import { PublicShell } from "../components/PublicShell";
import "../usk.css";

export const Route = createFileRoute("/admin/live-match")({
  component: AdminLiveMatchPage,
  head: () => ({ meta: [{ title: "Live Match — Administration — USK" }] }),
});

const formatTime = (totalSeconds: number) =>
  `${Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0")}:${(totalSeconds % 60).toString().padStart(2, "0")}`;

function AdminLiveMatchPage() {
  const matches = useMatches();
  const [state, setState] = useState<LiveState>(() => getLiveState());
  const [eventText, setEventText] = useState("");
  const liveMatches = useMemo(() => matches.filter((m) => m.status === "live"), [matches]);

  // ✅ Sync mel database GHIR ki el match ID yetbadel
  useEffect(() => {
    const onLive = () => setState(getLiveState());
    window.addEventListener("usk-live-updated", onLive);
    void loadLiveState().then(setState);
    return () => window.removeEventListener("usk-live-updated", onLive);
  }, []);

  // ✅ Initialisation GHIR ki el match ID yetbadel — machi ki el score yetbadel
  useEffect(() => {
    const activeMatch = liveMatches.find((item) => item.id === state.matchId) || liveMatches[0];
    if (!activeMatch) return;
    if (activeMatch.id === state.matchId) return; // déjà synchronisé

    const next: LiveState = {
      ...state,
      matchId: activeMatch.id,
      minute: getElapsedSeconds(activeMatch),
      homeScore: activeMatch.scoreFor ?? 0,
      awayScore: activeMatch.scoreAgainst ?? 0,
    };
    setState(next);
    void saveLiveState(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMatches, state.matchId]);

  const match = liveMatches.find((m) => m.id === state.matchId) || liveMatches[0];
  const [clock, setClock] = useState(0);
  const [optimisticStartedAt, setOptimisticStartedAt] = useState<string>();

  useEffect(() => {
    if (!match) return;
    const startedAt =
      optimisticStartedAt && optimisticStartedAt !== match.startedAt
        ? optimisticStartedAt
        : match.startedAt;
    const refreshClock = () => {
      if (state.phase === "half-time") {
        setClock(45 * 60);
        return;
      }
      const clockMatch = startedAt ? { ...match, status: "live" as const, startedAt } : match;
      setClock(getElapsedSeconds(clockMatch));
    };

    refreshClock();
    const timer = window.setInterval(refreshClock, 1000);
    return () => window.clearInterval(timer);
  }, [match, optimisticStartedAt, state.phase]);

  const update = (next: LiveState) => {
    setState(next);
    void saveLiveState(next).catch((error) => console.error("[v0] Live state save failed:", error));
  };

  const persistMatch = async (patch: Partial<Match>) => {
    if (!match) return;
    try {
      await updateMatch(match.id, patch);
    } catch (error) {
      console.error("[v0] Match save failed:", error);
    }
  };

  const setScore = (side: "homeScore" | "awayScore", delta: number) => {
    const value = Math.max(0, state[side] + delta);
    update({ ...state, [side]: value });
    void persistMatch({ [side === "homeScore" ? "scoreFor" : "scoreAgainst"]: value });
  };

  const addEvent = (kind: LiveEvent["kind"]) => {
    if (!eventText.trim()) return;
    update({
      ...state,
      events: [
        {
          id: `e-${Date.now()}`,
          minute: Math.floor(state.minute / 60),
          kind,
          team: "USK",
          text: eventText.trim(),
        },
        ...state.events,
      ],
    });
    setEventText("");
  };

  const startMatch = async () => {
    if (!match) return;
    const now = new Date().toISOString();
    const next: LiveState = { ...state, phase: "first", matchId: match.id, minute: 0 };
    setOptimisticStartedAt(now);
    setState(next);
    try {
      await saveLiveState(next);
      await persistMatch({
        status: "live",
        scoreFor: next.homeScore,
        scoreAgainst: next.awayScore,
        startedAt: now,
        pausedAt: undefined,
      });
    } catch (error) {
      setOptimisticStartedAt(undefined);
      console.error("[v0] Match start failed:", error);
    }
  };

  const pauseMatch = async () => {
    if (!match) return;
    const elapsed = 45 * 60;
    const next: LiveState = { ...state, phase: "half-time", minute: elapsed };
    setState(next);
    await saveLiveState(next);
    await persistMatch({
      status: "live",
      pausedAt: new Date().toISOString(),
      elapsedSeconds: elapsed,
    });
  };

  const resumeMatch = async () => {
    if (!match) return;
    const now = new Date().toISOString();
    const elapsed = 45 * 60;
    const next: LiveState = { ...state, phase: "second", minute: elapsed };
    setState(next);
    await saveLiveState(next);
    await persistMatch({
      status: "live",
      startedAt: now,
      pausedAt: undefined,
      elapsedSeconds: clock,
    });
  };

  const finishMatch = async () => {
    if (!match) return;
    const elapsed = clock;
    const next: LiveState = { ...state, phase: "finished", minute: elapsed };
    setState(next);
    try {
      await saveLiveState(next);
      await saveMatches(
        matches.map((m) =>
          m.id === match.id
            ? {
                ...m,
                status: "finished",
                scoreFor: next.homeScore,
                scoreAgainst: next.awayScore,
                pausedAt: new Date().toISOString(),
                elapsedSeconds: elapsed,
              }
            : m,
        ),
      );
    } catch (error) {
      console.error("[v0] Match finish failed:", error);
    }
  };

  const resetMatch = () => {
    const next: LiveState = { ...state, phase: "first", minute: 0 };
    update(next);
    persistMatch({ startedAt: undefined, pausedAt: undefined, elapsedSeconds: 0 });
  };
  // ... el ba9i kima houwa
  if (!match)
    return (
      <div className="admin-effectif-page admin-dashboard-page">
        <header className="admin-effectif-header admin-dashboard-header">
          <div className="admin-effectif-brand">
            <Radio className="admin-live-header-icon" size={32} />
            <div>
              <span className="section-kicker">USK ADMIN · MATCH CENTER</span>
              <h1>Live Match</h1>
            </div>
          </div>
          <Link to="/admin" className="admin-return-button">
            <ArrowLeft size={17} /> Retour à l&apos;administration
          </Link>
        </header>
        <main className="admin-effectif-content admin-dashboard-content admin-live-empty">
          <div>
            <Radio size={32} />
            <h2>Aucun match sélectionné</h2>
            <p>Aucun match n&apos;est actuellement en cours</p>
          </div>
        </main>
      </div>
    );
  return (
    <div className="admin-effectif-page admin-dashboard-page">
      <header className="admin-effectif-header admin-dashboard-header">
        <div className="admin-effectif-brand">
          <Radio className="admin-live-header-icon" size={32} />
          <div>
            <span className="section-kicker">USK ADMIN · MATCH CENTER</span>
            <h1>Live Match</h1>
            <p>Pilotez la rencontre et publiez chaque événement en direct.</p>
          </div>
        </div>
        <Link to="/admin" className="admin-return-button">
          <ArrowLeft size={17} /> Retour à l&apos;administration
        </Link>
      </header>
      <main className="admin-effectif-content admin-dashboard-content">
        <div className="admin-live-toolbar">
          <div>
            <span className="section-kicker">CONTRÔLE EN DIRECT</span>
            <h2>{match ? `USK — ${match.opponent}` : "Aucun match sélectionné"}</h2>
          </div>
          <select
            value={state.matchId}
            onChange={(e) => update({ ...state, matchId: e.target.value })}
            disabled={!liveMatches.length}
            aria-label="Sélectionner un match en cours"
          >
            {liveMatches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.date} · USK — {m.opponent}
              </option>
            ))}
          </select>
        </div>
        <section className="admin-live-score panel-block">
          <div className="admin-live-status">
            <span className="live-badge">
              <span className="live-dot" />{" "}
              {state.phase === "finished"
                ? "TERMINÉ"
                : state.phase === "half-time"
                  ? "MI-TEMPS"
                  : "EN DIRECT"}
            </span>
            <strong>{formatElapsedSeconds(clock)}</strong>
          </div>
          {state.phase === "half-time" && (
            <div className="admin-live-halftime" role="status" aria-live="polite">
              <span className="admin-live-halftime-line" />
              <div>
                <strong>MI-TEMPS</strong>
                <span>Pause réglementaire · Reprise de la 2e mi-temps</span>
              </div>
              <span className="admin-live-halftime-line" />
            </div>
          )}
          <div className="admin-live-scoreboard">
            <div>
              <span>USK</span>
              <strong>{state.homeScore}</strong>
              <div className="admin-score-actions">
                <button onClick={() => setScore("homeScore", -1)} aria-label="Retirer un but à USK">
                  <Minus size={16} />
                </button>
                <button onClick={() => setScore("homeScore", 1)} aria-label="Ajouter un but à USK">
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <span className="admin-live-dash">—</span>
            <div>
              <span>{match?.opponent || "Adversaire"}</span>
              <strong>{state.awayScore}</strong>
              <div className="admin-score-actions">
                <button
                  onClick={() => setScore("awayScore", -1)}
                  aria-label="Retirer un but à l'adversaire"
                >
                  <Minus size={16} />
                </button>
                <button
                  onClick={() => setScore("awayScore", 1)}
                  aria-label="Ajouter un but à l'adversaire"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className="admin-live-actions">
            <button className="button button-blue" onClick={startMatch}>
              <Play size={16} /> Démarrer
            </button>
            {state.phase === "half-time" ? (
              <button className="button button-blue" onClick={() => void resumeMatch()}>
                <Play size={16} /> Reprendre 2e mi-temps
              </button>
            ) : (
              <button className="button button-gold" onClick={() => void pauseMatch()}>
                <Pause size={16} /> Mi-temps
              </button>
            )}
            <button className="button button-red" onClick={finishMatch}>
              <CircleStop size={16} /> Terminer
            </button>
            <button className="button" onClick={resetMatch}>
              <RotateCcw size={16} /> Réinitialiser
            </button>
          </div>
        </section>
        <section className="admin-live-grid">
          <div className="panel-block admin-live-event-form">
            <div className="admin-panel-title">
              <Flag size={18} />
              <h3>Ajouter un événement</h3>
            </div>
            <input
              value={eventText}
              onChange={(e) => setEventText(e.target.value)}
              placeholder="Nom du joueur ou description"
            />
            <div className="admin-event-buttons">
              <button onClick={() => addEvent("goal")}>
                <Trophy size={15} /> But
              </button>
              <button onClick={() => addEvent("yellow")}>
                <Square size={14} /> Carton jaune
              </button>
              <button onClick={() => addEvent("red")}>
                <Square size={14} /> Carton rouge
              </button>
              <button onClick={() => addEvent("sub")}>
                <UserRound size={15} /> Remplacement
              </button>
              <button onClick={() => addEvent("info")}>
                <Clock3 size={15} /> Note
              </button>
            </div>
          </div>
          <div className="panel-block admin-live-events">
            <div className="admin-panel-title">
              <Clock3 size={18} />
              <h3>Fil du match</h3>
              <button
                onClick={() => update({ ...state, events: [] })}
                className="icon-button"
                aria-label="Réinitialiser les événements"
              >
                <RotateCcw size={15} />
              </button>
            </div>
            {state.events.length ? (
              state.events.map((event) => (
                <div className="admin-live-event-row" key={event.id}>
                  <strong>{event.minute}&apos;</strong>
                  <span className={`event-dot event-${event.kind}`} />
                  <div>
                    <b>
                      {event.kind === "goal"
                        ? "But"
                        : event.kind === "yellow"
                          ? "Carton jaune"
                          : event.kind === "red"
                            ? "Carton rouge"
                            : event.kind === "sub"
                              ? "Remplacement"
                              : "Information"}
                    </b>
                    <small>
                      {event.team} · {event.text}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <p className="admin-empty-state">Aucun événement enregistré.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
export default AdminLiveMatchPage;

void Square;
void Flag;
void Pause;
void Play;
void CircleStop;
void UserRound;
void RotateCcw;
