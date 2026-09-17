import { createFileRoute } from "@tanstack/react-router";
import { Eye, ImagePlus, MapPin, Plus, Shirt, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { getKit, saveKit, useKits, type KitSlot } from "../data/kits";
import { uploadTenue } from "../lib/tenue-upload";

const slotMeta: Record<
  KitSlot,
  { label: string; title: string; description: string; badge: string }
> = {
  home: {
    label: "Domicile",
    title: "Maillot Home",
    description: "La tenue officielle portée à Kelibia.",
    badge: "Officielle",
  },
  away: {
    label: "Extérieur",
    title: "Maillot Away",
    description: "La tenue officielle pour les déplacements.",
    badge: "Deuxième",
  },
  third: {
    label: "Troisième",
    title: "Maillot Third",
    description: "La troisième tenue officielle du club.",
    badge: "Troisième",
  },
};

function KitCard({
  slot,
  onView,
  onDelete,
}: {
  slot: KitSlot;
  onView: (slot: KitSlot) => void;
  onDelete: (slot: KitSlot) => void;
}) {
  const kit = useKits().find((item) => item.slot === slot) || getKit(slot);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const meta = slotMeta[slot];
  async function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return setError("Sélectionnez une image JPG, PNG ou WebP.");
    try {
      const result = await uploadTenue({
        data: {
          slot,
          file: {
            name: file.name,
            type: file.type,
            bytes: Array.from(new Uint8Array(await file.arrayBuffer())),
          },
        },
      });
      if (!result.path) throw new Error("Le visuel n’a pas été enregistré.");
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’enregistrer l’image.");
    }
  }
  return (
    <article className={`tenues-card tenues-card-${slot}`}>
      <header className="tenues-card-head">
        <div>
          <span>TENUE {meta.label.toUpperCase()}</span>
          <strong>SAISON 2026 / 2027</strong>
        </div>
        <b>
          {kit.status === "official" ? "✓ " : ""}
          {meta.badge}
        </b>
      </header>
      <div className="tenues-card-image">
        {kit.image ? (
          <img src={kit.image} alt={meta.title} />
        ) : (
          <Shirt size={128} strokeWidth={0.8} />
        )}
      </div>
      <div className="tenues-thumbs">
        <div>{kit.image ? <img src={kit.image} alt="Vue principale" /> : <Shirt size={28} />}</div>
        <div>
          {kit.image ? <img src={kit.image} alt="Détail de la tenue" /> : <ImagePlus size={24} />}
        </div>
        <div>
          <ImagePlus size={24} />
        </div>
      </div>
      <div className="tenues-card-actions">
        <button type="button" aria-label={`Voir ${meta.title}`} title="Voir" onClick={() => onView(slot)}>
          <Eye />
        </button>
        <button type="button" className="danger" aria-label={`Supprimer ${meta.title}`} title="Supprimer" onClick={() => onDelete(slot)}>
          <Trash2 />
        </button>
      </div>
      <button type="button" className="tenues-upload" onClick={() => inputRef.current?.click()}>
        <Upload /> {kit.image ? "Remplacer le visuel" : "Importer le visuel"}
        <small>PNG, JPG ou WEBP</small>
      </button>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => upload(event.target.files?.[0])}
      />
      {error && <small className="tenues-error">{error}</small>}
    </article>
  );
}

function KitPreviewDialog({ slot, onClose }: { slot: KitSlot; onClose: () => void }) {
  const kit = useKits().find((item) => item.slot === slot) || getKit(slot);
  const meta = slotMeta[slot];

  return (
    <div className="kit-preview-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`kit-preview-dialog kit-preview-${slot}`} role="dialog" aria-modal="true" aria-labelledby="kit-preview-title">
        <div className="kit-preview-glow" aria-hidden="true" />
        <button type="button" className="kit-preview-close" aria-label="Fermer la présentation" onClick={onClose}>
          <X />
        </button>
        <div className="kit-preview-intro">
          <span className="section-kicker">US KELIBIA · COLLECTION OFFICIELLE</span>
          <span className="kit-preview-index">0{slot === "home" ? 1 : slot === "away" ? 2 : 3} / 03</span>
        </div>
        <div className="kit-preview-stage">
          <span className="kit-preview-orbit kit-preview-orbit-one" aria-hidden="true" />
          <span className="kit-preview-orbit kit-preview-orbit-two" aria-hidden="true" />
          {kit.image ? <img src={kit.image} alt={`${meta.title}, saison 2026 / 2027`} /> : <Shirt aria-hidden="true" />}
        </div>
        <div className="kit-preview-details">
          <div>
            <span className="kit-preview-label">TENUE {meta.label.toUpperCase()}</span>
            <h2 id="kit-preview-title">{meta.title}</h2>
            <p>{meta.description}</p>
          </div>
          <div className="kit-preview-meta">
            <span><small>SAISON</small><strong>2026 / 2027</strong></span>
            <span><small>STATUT</small><strong>{kit.status === "official" ? "Officielle" : "Brouillon"}</strong></span>
          </div>
        </div>
        <div className="kit-preview-footer"><span>USK</span><i /><span>LE STYLE DE KELIBIA</span></div>
      </div>
    </div>
  );
}

function AddKitDialog({ onClose }: { onClose: () => void }) {
  const [slot, setSlot] = useState<KitSlot>("home");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit() {
    if (!file) return setError("Importez le visuel de la tenue.");
    if (!file.type.startsWith("image/")) return setError("Sélectionnez une image JPG, PNG ou WebP.");
    setSaving(true);
    try {
      const result = await uploadTenue({
        data: {
          slot,
          file: {
            name: file.name,
            type: file.type,
            bytes: Array.from(new Uint8Array(await file.arrayBuffer())),
          },
        },
      });
      if (!result.path) throw new Error("Le visuel n’a pas été enregistré.");
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’enregistrer l’image.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="tenues-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="tenues-dialog" role="dialog" aria-modal="true" aria-labelledby="add-kit-title">
        <div className="tenues-dialog-head"><div><span className="section-kicker">NOUVELLE TENUE</span><h2 id="add-kit-title">Ajouter une tenue</h2></div><button type="button" aria-label="Fermer" onClick={onClose}>×</button></div>
        <label>Type de tenue<select value={slot} onChange={(event) => setSlot(event.target.value as KitSlot)}>{(Object.keys(slotMeta) as KitSlot[]).map((value) => <option key={value} value={value}>{slotMeta[value].label}</option>)}</select></label>
        <label className="tenues-file-picker">Visuel officiel<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} /><span><Upload size={18} />{file ? file.name : "Choisir une image"}</span><small>PNG, JPG ou WEBP</small></label>
        {error && <small className="tenues-error">{error}</small>}
        <div className="tenues-dialog-actions"><button type="button" className="admin-secondary-button" onClick={onClose}>Annuler</button><button type="button" className="admin-primary-button" disabled={saving} onClick={submit}>{saving ? "Enregistrement…" : "Ajouter la tenue"}</button></div>
      </div>
    </div>
  );
}

function AdminTenuesPage() {
  const [filter, setFilter] = useState<"all" | KitSlot>("all");
  const [notice, setNotice] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [previewSlot, setPreviewSlot] = useState<KitSlot | null>(null);
  const visible = (Object.keys(slotMeta) as KitSlot[]).filter(
    (slot) => filter === "all" || filter === slot,
  );
  function addKit() {
    setIsAddOpen(true);
  }
  async function removeKit(slot: KitSlot) {
    if (!window.confirm(`Supprimer ${slotMeta[slot].title} ?`)) return;
    await saveKit(slot, null);
    setNotice(`${slotMeta[slot].title} supprimé.`);
  }
  function viewKit(slot: KitSlot) {
    setPreviewSlot(slot);
  }
  return (
    <div className="admin-child-page tenues-page">
      <header className="tenues-hero">
        <div>
          <span className="section-kicker">ÉQUIPEMENT DU CLUB</span>
          <h1>
            <Shirt /> Tenues officielles
          </h1>
          <p>Découvrez et gérez nos tenues officielles pour la saison 2026 / 2027</p>
        </div>
        <button type="button" className="admin-primary-button" onClick={addKit}>
          <Plus /> Ajouter une tenue
        </button>
      </header>
      <nav className="tenues-tabs" aria-label="Filtrer les tenues">
        {(
          [
            ["all", "Toutes les tenues"],
            ["home", "Domicile"],
            ["away", "Extérieur"],
            ["third", "Troisième"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={filter === value ? "active" : ""}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </nav>
      {notice && (
        <div className="tenues-notice" role="status">
          {notice}
        </div>
      )}
      <section className="tenues-grid">
        {visible.map((slot) => (
          <KitCard key={slot} slot={slot} onView={viewKit} onDelete={removeKit} />
        ))}
      </section>
      <section className="tenues-kelibia-panel" aria-label="Identité USK Kelibia">
        <div className="tenues-kelibia-mark"><MapPin size={22} /><span>35°10′ N<br />11°06′ E</span></div>
        <div><span className="section-kicker">US KELIBIA · SAISON 2026 / 2027</span><h2>Le style de Kelibia, porté avec fierté.</h2><p>Une identité visuelle ancrée dans la ville, la mer et les couleurs de l’USK.</p></div>
        <div className="tenues-kelibia-lines" aria-hidden="true"><i /><i /><i /></div>
      </section>
      {isAddOpen && <AddKitDialog onClose={() => setIsAddOpen(false)} />}
      {previewSlot && <KitPreviewDialog slot={previewSlot} onClose={() => setPreviewSlot(null)} />}
    </div>
  );
}
export const Route = createFileRoute("/admin/tenues")({
  component: AdminTenuesPage,
  head: () => ({ meta: [{ title: "Tenues — Administration — USK" }] }),
});
