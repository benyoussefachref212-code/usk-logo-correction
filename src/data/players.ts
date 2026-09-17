import keeperImg from "../assets/player-keeper.jpg";
import defenderImg from "../assets/player-defender.jpg";
import midfielderImg from "../assets/player-midfielder.jpg";
import strikerImg from "../assets/player-striker.jpg";

export type Player = {
  id: string;
  num: number;
  name: string;
  position: string;
  photo: string;
  age: number;
  height: string;
  foot: string;
  stats: { matches: number; goals: number; assists: number; yellow: number; red: number };
};
export type PlayerSection = { title: string; players: Player[] };

export const defaultPlayerSections: PlayerSection[] = [
  {
    title: "Gardiens",
    players: [
      {
        id: "1",
        num: 1,
        name: "Slim Ben Salah",
        position: "Gardien",
        photo: keeperImg,
        age: 29,
        height: "1,88 m",
        foot: "Droit",
        stats: { matches: 17, goals: 0, assists: 0, yellow: 1, red: 0 },
      },
      {
        id: "16",
        num: 16,
        name: "Rami Fkih",
        position: "Gardien",
        photo: keeperImg,
        age: 24,
        height: "1,85 m",
        foot: "Droit",
        stats: { matches: 3, goals: 0, assists: 0, yellow: 0, red: 0 },
      },
    ],
  },
  {
    title: "Défenseurs",
    players: [
      {
        id: "2",
        num: 2,
        name: "Yassine Hmidi",
        position: "Latéral droit",
        photo: defenderImg,
        age: 26,
        height: "1,79 m",
        foot: "Droit",
        stats: { matches: 16, goals: 1, assists: 2, yellow: 3, red: 0 },
      },
      {
        id: "3",
        num: 3,
        name: "Anis Gharbi",
        position: "Latéral gauche",
        photo: defenderImg,
        age: 25,
        height: "1,77 m",
        foot: "Gauche",
        stats: { matches: 14, goals: 0, assists: 3, yellow: 2, red: 0 },
      },
      {
        id: "4",
        num: 4,
        name: "Mehdi Trabelsi",
        position: "Défenseur central",
        photo: defenderImg,
        age: 30,
        height: "1,87 m",
        foot: "Droit",
        stats: { matches: 17, goals: 2, assists: 0, yellow: 4, red: 1 },
      },
      {
        id: "5",
        num: 5,
        name: "Karim Mansouri",
        position: "Défenseur central",
        photo: defenderImg,
        age: 27,
        height: "1,84 m",
        foot: "Droit",
        stats: { matches: 15, goals: 1, assists: 0, yellow: 2, red: 0 },
      },
      {
        id: "13",
        num: 13,
        name: "Bilel Sassi",
        position: "Défenseur central",
        photo: defenderImg,
        age: 22,
        height: "1,83 m",
        foot: "Gauche",
        stats: { matches: 8, goals: 0, assists: 0, yellow: 1, red: 0 },
      },
      {
        id: "21",
        num: 21,
        name: "Oussama Rekik",
        position: "Latéral droit",
        photo: defenderImg,
        age: 23,
        height: "1,80 m",
        foot: "Droit",
        stats: { matches: 9, goals: 0, assists: 1, yellow: 2, red: 0 },
      },
    ],
  },
  {
    title: "Milieux",
    players: [
      {
        id: "6",
        num: 6,
        name: "Nader Bouzid",
        position: "Milieu défensif",
        photo: midfielderImg,
        age: 28,
        height: "1,81 m",
        foot: "Droit",
        stats: { matches: 16, goals: 1, assists: 1, yellow: 5, red: 0 },
      },
      {
        id: "8",
        num: 8,
        name: "Fares Ayari",
        position: "Milieu central",
        photo: midfielderImg,
        age: 25,
        height: "1,76 m",
        foot: "Droit",
        stats: { matches: 17, goals: 3, assists: 4, yellow: 2, red: 0 },
      },
      {
        id: "10",
        num: 10,
        name: "Hatem Khelifi",
        position: "Milieu offensif · Capitaine",
        photo: midfielderImg,
        age: 31,
        height: "1,78 m",
        foot: "Gauche",
        stats: { matches: 15, goals: 5, assists: 6, yellow: 1, red: 0 },
      },
      {
        id: "14",
        num: 14,
        name: "Taher Ammar",
        position: "Milieu central",
        photo: midfielderImg,
        age: 24,
        height: "1,79 m",
        foot: "Droit",
        stats: { matches: 11, goals: 1, assists: 2, yellow: 2, red: 0 },
      },
      {
        id: "17",
        num: 17,
        name: "Chiheb Ben Ali",
        position: "Milieu offensif",
        photo: midfielderImg,
        age: 21,
        height: "1,74 m",
        foot: "Gauche",
        stats: { matches: 7, goals: 2, assists: 1, yellow: 0, red: 0 },
      },
      {
        id: "23",
        num: 23,
        name: "Aziz Hammami",
        position: "Milieu défensif",
        photo: midfielderImg,
        age: 26,
        height: "1,82 m",
        foot: "Droit",
        stats: { matches: 10, goals: 0, assists: 1, yellow: 3, red: 0 },
      },
    ],
  },
  {
    title: "Attaquants",
    players: [
      {
        id: "7",
        num: 7,
        name: "Iyed Mbarek",
        position: "Ailier droit",
        photo: strikerImg,
        age: 23,
        height: "1,75 m",
        foot: "Gauche",
        stats: { matches: 16, goals: 6, assists: 3, yellow: 2, red: 0 },
      },
      {
        id: "9",
        num: 9,
        name: "Omar Dridi",
        position: "Avant-centre",
        photo: strikerImg,
        age: 27,
        height: "1,85 m",
        foot: "Droit",
        stats: { matches: 17, goals: 11, assists: 2, yellow: 3, red: 0 },
      },
      {
        id: "11",
        num: 11,
        name: "Wajdi Jelassi",
        position: "Ailier gauche",
        photo: strikerImg,
        age: 25,
        height: "1,77 m",
        foot: "Droit",
        stats: { matches: 14, goals: 4, assists: 5, yellow: 1, red: 0 },
      },
      {
        id: "19",
        num: 19,
        name: "Malek Saidi",
        position: "Avant-centre",
        photo: strikerImg,
        age: 22,
        height: "1,83 m",
        foot: "Droit",
        stats: { matches: 9, goals: 3, assists: 0, yellow: 1, red: 0 },
      },
      {
        id: "27",
        num: 27,
        name: "Seif Ben Youssef",
        position: "Ailier droit",
        photo: strikerImg,
        age: 20,
        height: "1,76 m",
        foot: "Droit",
        stats: { matches: 5, goals: 1, assists: 1, yellow: 0, red: 0 },
      },
    ],
  },
];

export const PLAYER_STORAGE_KEY = "usk-effectif-v1";
export const flattenPlayers = (sections: PlayerSection[]) =>
  sections.flatMap((section) => section.players);
export function readPlayerSections(): PlayerSection[] {
  if (typeof window === "undefined") return defaultPlayerSections;
  try {
    const saved = window.localStorage.getItem(PLAYER_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed?.some((section: PlayerSection) => section.players?.length)
      ? parsed
      : defaultPlayerSections;
  } catch {
    return defaultPlayerSections;
  }
}
export function savePlayerSections(sections: PlayerSection[]) {
  window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(sections));
  window.dispatchEvent(new Event("usk-effectif-updated"));
}
export function groupPlayers(players: Player[]): PlayerSection[] {
  return ["Gardiens", "Défenseurs", "Milieux", "Attaquants"].map((title) => ({
    title,
    players: players.filter((p) => {
      const position = (p.position ?? "").toLowerCase();
      return title === "Gardiens"
        ? position.includes("gardien")
        : title === "Défenseurs"
          ? position.includes("défenseur") || position.includes("latéral")
          : title === "Milieux"
            ? position.includes("milieu")
            : position.includes("ailier") || position.includes("avant");
    }),
  }));
}
export const photoOptions = [
  { label: "Gardien", value: keeperImg },
  { label: "Défenseur", value: defenderImg },
  { label: "Milieu", value: midfielderImg },
  { label: "Attaquant", value: strikerImg },
];
export const positionOptions = [
  "Gardien",
  "Défenseur central",
  "Latéral droit",
  "Latéral gauche",
  "Milieu défensif",
  "Milieu central",
  "Milieu offensif",
  "Ailier droit",
  "Ailier gauche",
  "Avant-centre",
];
export const emptyPlayer = (): Player => ({
  id: crypto.randomUUID(),
  num: 1,
  name: "",
  position: "Gardien",
  photo: keeperImg,
  age: 18,
  height: "1,80 m",
  foot: "Droit",
  stats: { matches: 0, goals: 0, assists: 0, yellow: 0, red: 0 },
});
export function photoForPosition(position: string) {
  const p = position.toLowerCase();
  return p.includes("gardien")
    ? keeperImg
    : p.includes("défenseur") || p.includes("latéral")
      ? defenderImg
      : p.includes("milieu")
        ? midfielderImg
        : strikerImg;
}
export function sectionForPosition(position: string) {
  const p = position.toLowerCase();
  return p.includes("gardien")
    ? "Gardiens"
    : p.includes("défenseur") || p.includes("latéral")
      ? "Défenseurs"
      : p.includes("milieu")
        ? "Milieux"
        : "Attaquants";
}
export function updatePlayerInSections(sections: PlayerSection[], player: Player) {
  return groupPlayers([
    ...flattenPlayers(sections).filter((item) => item.id !== player.id),
    player,
  ]);
}
export function removePlayerFromSections(sections: PlayerSection[], id: string) {
  return groupPlayers(flattenPlayers(sections).filter((player) => player.id !== id));
}
export function resetPlayerIds(sections: PlayerSection[]) {
  return sections.map((section) => ({
    ...section,
    players: section.players.map((player) => ({ ...player, id: player.id || String(player.num) })),
  }));
}

export const playerData = defaultPlayerSections;

// Keep the public route's static import shape compatible while enabling browser updates.
export function getPlayerPhoto(position: string) {
  return photoForPosition(position);
}

// Ensure seeded records have stable IDs when read from older saved data.
export function normalizePlayerSections(sections: PlayerSection[]) {
  return resetPlayerIds(sections).map((section) => ({
    ...section,
    players: section.players.filter(Boolean).map((player) => ({
      ...player,
      position: player.position || "Gardien",
      name: player.name || "Joueur sans nom",
      stats: player.stats || { matches: 0, goals: 0, assists: 0, yellow: 0, red: 0 },
    })),
  }));
}

// Used by the admin form when selecting a position.
export function sectionTitleForPosition(position: string) {
  return sectionForPosition(position);
}

// Used by consumers that need a serializable initial value.
export const initialPlayerSections = defaultPlayerSections;

// Shared event name for public/admin synchronization.
export const PLAYER_UPDATE_EVENT = "usk-effectif-updated";

// Keep this module tree-shakeable for route consumers.
export type { Player as SquadPlayer };

// Explicitly expose the default seed for admin reset actions.
export const seedPlayerSections = defaultPlayerSections;

// Read-only alias for UI labels.
export const playerPositions = positionOptions;

// Stable helper for section labels.
export const squadSectionTitles = ["Gardiens", "Défenseurs", "Milieux", "Attaquants"] as const;

// Shared storage reset utility.
export function clearPlayerStorage() {
  window.localStorage.removeItem(PLAYER_STORAGE_KEY);
  window.dispatchEvent(new Event(PLAYER_UPDATE_EVENT));
}

// Keep runtime imports explicit for Vite asset URLs.
export const playerPhotoAssets = { keeperImg, defenderImg, midfielderImg, strikerImg };

// Shared update event helper.
export function emitPlayerUpdate() {
  window.dispatchEvent(new Event(PLAYER_UPDATE_EVENT));
}

// Public UI can safely call this to retrieve current data.
export const getStoredPlayerSections = readPlayerSections;

// Admin UI can safely call this to persist current data.
export const persistPlayerSections = savePlayerSections;

// Shared section grouping API.
export const regroupPlayers = groupPlayers;

// Shared player flattening API.
export const allPlayers = flattenPlayers;

// Storage key export for tests and tooling.
export const effectifStorageKey = PLAYER_STORAGE_KEY;

// Backwards-friendly default export.
export default defaultPlayerSections;
