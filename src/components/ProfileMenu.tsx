"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, updateDisplayName, saveAvatarUrl } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";

export type MyProfile = {
  userId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[^a-zA-Z]+/).find((p) => p.length > 0) ?? "";
  return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : "";
}

export function shownName(p: MyProfile | null): string {
  if (!p) return "";
  return (p.displayName && p.displayName.trim()) || nameFromEmail(p.email);
}

// Crop to a centred square and shrink to 256px so uploads stay tiny
async function toSquareJpeg(file: File, size = 256): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const s = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - s) / 2;
  const sy = (bitmap.height - s) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(bitmap, sx, sy, s, s, 0, 0, size, size);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.85)
  );
}

export default function ProfileMenu({
  profile,
  fallbackInitial,
  onChange,
}: {
  profile: MyProfile | null;
  fallbackInitial: string;
  onChange: (p: MyProfile) => void;
}) {
  const [open, setOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const name = shownName(profile);
  const letter = (name.charAt(0) || fallbackInitial || "?").toUpperCase();
  const photo = profile?.avatarUrl ?? null;

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  function toggle() {
    if (!open) {
      setNameDraft(shownName(profile));
      setMsg("");
    }
    setOpen((o) => !o);
  }

  async function saveName() {
    if (!profile) return;
    setSaving(true);
    setMsg("");
    const clean = nameDraft.trim().slice(0, 40);
    const res = await updateDisplayName(clean);
    if (res.ok) {
      onChange({ ...profile, displayName: clean || null });
      setMsg("Name saved");
    } else {
      setMsg("Couldn't save the name. Has the profile SQL been run?");
    }
    setSaving(false);
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !profile) return;
    setUploading(true);
    setMsg("");
    try {
      const blob = await toSquareJpeg(file);
      const supabase = createClient();
      const path = `${profile.userId}/avatar.jpg`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      const res = await saveAvatarUrl(url);
      if (!res.ok) throw new Error("save");
      onChange({ ...profile, avatarUrl: url });
    } catch {
      setMsg("Couldn't upload the photo. Has the storage SQL been run?");
    }
    setUploading(false);
  }

  const nameChanged = nameDraft.trim() !== shownName(profile);

  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center" }}>
      <button
        type="button"
        className="avatar"
        aria-label="Open profile menu"
        onClick={toggle}
        style={{
          border: "none",
          cursor: "pointer",
          backgroundImage: photo ? `url(${photo})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: photo ? "transparent" : undefined,
        }}
      >
        {letter}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            top: 64,
            right: 12,
            width: "min(300px, calc(100vw - 24px))",
            boxSizing: "border-box",
            zIndex: 80,
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            padding: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              aria-label="Change photo"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                position: "relative",
                flex: "0 0 auto",
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: "1px solid #e5e7eb",
                background: photo ? `url(${photo}) center/cover` : "#eef2ff",
                color: "#4f46e5",
                fontSize: 26,
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
              }}
            >
              {!photo && letter}
              <span
                style={{
                  position: "absolute",
                  right: -2,
                  bottom: -2,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "white",
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                  lineHeight: "20px",
                }}
              >
                {uploading ? "…" : "📷"}
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} style={{ display: "none" }} />

            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>Your name</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  value={nameDraft}
                  maxLength={40}
                  onChange={(e) => setNameDraft(e.target.value)}
                  style={{
                    flex: "1 1 auto",
                    minWidth: 0,
                    boxSizing: "border-box",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    padding: "7px 8px",
                    fontSize: 16,
                  }}
                />
                <button
                  type="button"
                  onClick={saveName}
                  disabled={saving || !nameChanged}
                  style={{
                    flex: "0 0 auto",
                    background: "var(--accent, #6366f1)",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    padding: "0 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: saving || !nameChanged ? 0.5 : 1,
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {profile?.email && (
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile.email}
            </div>
          )}
          {msg && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>{msg}</div>}

          <div style={{ borderTop: "1px solid #f1f2f6", margin: "12px 0 10px" }} />

          <form action={signOut}>
            <button
              type="submit"
              style={{
                width: "100%",
                border: "1px solid #fca5a5",
                color: "#dc2626",
                background: "white",
                borderRadius: 10,
                padding: "10px 0",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}