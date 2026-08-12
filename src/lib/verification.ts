import { supabase } from "@/integrations/supabase/client";

export const DOC_BUCKET = "verification-docs";
export const AVATAR_BUCKET = "avatars";

export type DocType =
  | "national_id"
  | "passport"
  | "selfie"
  | "driving_license"
  | "vehicle_registration"
  | "insurance"
  | "other";

export type DocStatus =
  | "not_submitted"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "expired";

export type DriverDocument = {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  doc_type: DocType;
  file_url: string;
  expires_on: string | null;
  status: DocStatus;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
};

export const DOC_LABELS: Record<DocType, string> = {
  national_id: "Carte nationale (CIN)",
  passport: "Passeport",
  selfie: "Selfie de contrôle",
  driving_license: "Permis de conduire",
  vehicle_registration: "Carte grise",
  insurance: "Assurance du véhicule",
  other: "Autre document",
};

export const STATUS_LABELS: Record<DocStatus, string> = {
  not_submitted: "Non soumis",
  pending: "En attente",
  under_review: "En cours d'examen",
  approved: "Approuvé",
  rejected: "Refusé",
  expired: "Expiré",
};

export const REJECTION_REASONS = [
  "Document expiré",
  "Image illisible",
  "Mauvais document",
  "Document incomplet",
  "Nom ne correspond pas",
  "Document invalide",
  "Suspicion de fraude",
] as const;

/** Documents required before a driver may publish a ride. */
export const DRIVER_REQUIRED_DOCS: DocType[] = [
  "national_id",
  "driving_license",
  "vehicle_registration",
  "insurance",
];

/** Document types that never expire (enforced in the database too). */
export const NO_EXPIRY_DOCS: DocType[] = ["selfie"];

export function hasExpiry(docType: DocType) {
  return !NO_EXPIRY_DOCS.includes(docType);
}

export type PublishRequirements = {
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  license_verified: boolean;
  vehicle_verified: boolean;
  insurance_verified: boolean;
  has_vehicle: boolean;
  has_verified_vehicle: boolean;
  account_active: boolean;
  expired_documents: string[];
};

export type RequirementItem = {
  key: keyof PublishRequirements | "expired";
  label: string;
  ok: boolean;
  hint?: string;
  /** Optional requirements are informational only and never block publication. */
  optional?: boolean;
};

export async function fetchPublishRequirements(userId: string): Promise<PublishRequirements> {
  const { data, error } = await supabase.rpc("driver_publish_requirements", { _user_id: userId });
  if (error) throw error;
  return data as unknown as PublishRequirements;
}

/** Per-vehicle verification status, straight from the database (never client-set). */
export type VehicleStatus = "not_submitted" | "pending" | "under_review" | "approved" | "rejected" | "expired";

export async function fetchVehicleStatuses(ownerId: string): Promise<Map<string, VehicleStatus>> {
  const { data, error } = await supabase.rpc("vehicle_verification_statuses", {
    _owner_id: ownerId,
  });
  if (error) throw error;
  const obj = (data ?? {}) as Record<string, VehicleStatus>;
  return new Map(Object.entries(obj));
}

/** Resend the Supabase Auth confirmation email for an unverified address. */
export async function resendVerificationEmail(email: string) {
  const { data: current } = await supabase.auth.getUser();
  if (current.user?.email_confirmed_at) {
    throw new Error("Cette adresse e-mail est déjà vérifiée.");
  }
  const target = current.user?.email ?? email;
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: target,
    options: { emailRedirectTo: `${window.location.origin}/verification` },
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (error.status === 429 || msg.includes("rate limit") || msg.includes("security purposes")) {
      throw new Error(
        "Trop de demandes. Patientez une minute avant de redemander un e-mail de vérification.",
      );
    }
    throw new Error(error.message);
  }
}

export function requirementList(r: PublishRequirements | null): RequirementItem[] {
  const req = r ?? ({} as Partial<PublishRequirements>);
  const expired = req.expired_documents ?? [];
  return [
    { key: "email_verified", label: "E-mail vérifié", ok: Boolean(req.email_verified) },
    { key: "phone_verified", label: "Téléphone vérifié", ok: Boolean(req.phone_verified) },
    { key: "identity_verified", label: "Identité vérifiée", ok: Boolean(req.identity_verified) },
    {
      key: "license_verified",
      label: "Permis de conduire vérifié",
      ok: Boolean(req.license_verified),
    },
    { key: "has_vehicle", label: "Véhicule enregistré", ok: Boolean(req.has_vehicle) },
    {
      key: "has_verified_vehicle",
      label: "Véhicule vérifié",
      ok: Boolean(req.has_verified_vehicle),
      ...(req.has_verified_vehicle
        ? {}
        : { hint: "carte grise du véhicule à valider par l'équipe" }),
    },
    { key: "vehicle_verified", label: "Carte grise vérifiée", ok: Boolean(req.vehicle_verified) },
    { key: "insurance_verified", label: "Assurance vérifiée", ok: Boolean(req.insurance_verified) },
    { key: "account_active", label: "Compte en règle", ok: Boolean(req.account_active) },
    {
      key: "expired",
      label: "Aucun document expiré",
      ok: expired.length === 0,
      ...(expired.length ? { hint: expired.map((d) => DOC_LABELS[d as DocType] ?? d).join(", ") } : {}),
    },
  ];
}

export function canPublish(r: PublishRequirements | null) {
  return requirementList(r).every((i) => i.ok);
}

/** ---------- Documents ---------- */

export async function listMyDocuments(userId: string): Promise<DriverDocument[]> {
  const { data, error } = await supabase
    .from("driver_documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DriverDocument[];
}

/** Latest document per type (documents are append-only for auditability). */
export function latestByType(docs: DriverDocument[]) {
  const map = new Map<DocType, DriverDocument>();
  for (const d of docs) if (!map.has(d.doc_type)) map.set(d.doc_type, d);
  return map;
}

export function effectiveStatus(doc: DriverDocument | undefined): DocStatus {
  if (!doc) return "not_submitted";
  // Selfies (and any other no-expiry type) never expire.
  if (!hasExpiry(doc.doc_type)) return doc.status === "expired" ? "pending" : doc.status;
  if (doc.status === "approved" && doc.expires_on && doc.expires_on < new Date().toISOString().slice(0, 10))
    return "expired";
  return doc.status;
}

/** Latest vehicle-registration document for a given vehicle. */
export function vehicleRegistrationDoc(docs: DriverDocument[], vehicleId: string) {
  return docs.find((d) => d.doc_type === "vehicle_registration" && d.vehicle_id === vehicleId);
}


export async function uploadDocument(opts: {
  userId: string;
  docType: DocType;
  file: File;
  expiresOn?: string | null;
  vehicleId?: string | null;
}) {
  const ext = opts.file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${opts.userId}/${opts.docType}/${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage.from(DOC_BUCKET).upload(path, opts.file, {
    upsert: false,
    ...(opts.file.type ? { contentType: opts.file.type } : {}),
  });
  if (upErr) throw upErr;


  const { data, error } = await supabase
    .from("driver_documents")
    .insert({
      user_id: opts.userId,
      doc_type: opts.docType,
      file_url: path,
      status: "pending",
      expires_on: hasExpiry(opts.docType) ? opts.expiresOn || null : null,
      vehicle_id: opts.vehicleId || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as DriverDocument;
}

/** Private bucket: never a public URL. */
export async function signedDocumentUrl(path: string, expiresIn = 300) {
  const { data, error } = await supabase.storage.from(DOC_BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

/** ---------- Admin review ---------- */

export type AdminDocFilters = {
  status?: DocStatus | "all";
  docType?: DocType | "all";
  search?: string;
  from?: string;
  to?: string;
};

export async function adminListDocuments(f: AdminDocFilters = {}) {
  let q = supabase
    .from("driver_documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (f.status && f.status !== "all") q = q.eq("status", f.status);
  if (f.docType && f.docType !== "all") q = q.eq("doc_type", f.docType);
  if (f.from) q = q.gte("created_at", f.from);
  if (f.to) q = q.lte("created_at", `${f.to}T23:59:59`);

  const { data, error } = await q;
  if (error) throw error;
  const docs = (data ?? []) as DriverDocument[];
  if (docs.length === 0) return { docs, owners: new Map<string, OwnerLite>() };

  const ids = [...new Set(docs.map((d) => d.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, city, phone, account_status")
    .in("id", ids);

  const owners = new Map<string, OwnerLite>((profiles ?? []).map((p) => [p.id, p as OwnerLite]));
  const needle = f.search?.trim().toLowerCase();
  const filtered = needle
    ? docs.filter((d) => {
        const o = owners.get(d.user_id);
        const hay = `${o?.first_name ?? ""} ${o?.last_name ?? ""} ${d.user_id}`.toLowerCase();
        return hay.includes(needle);
      })
    : docs;
  return { docs: filtered, owners };
}

export type OwnerLite = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  city: string | null;
  phone: string | null;
  account_status: string;
};

export async function reviewDocument(opts: {
  id: string;
  status: Extract<DocStatus, "under_review" | "approved" | "rejected" | "expired">;
  reason?: string | null;
  reviewerId: string;
}) {
  if (opts.status === "rejected" && !opts.reason?.trim()) {
    throw new Error("Un motif de refus est obligatoire.");
  }
  const { error } = await supabase
    .from("driver_documents")
    .update({
      status: opts.status,
      review_note: opts.reason?.trim() || null,
      reviewed_by: opts.reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", opts.id);
  if (error) throw error;
}

/** Days until a document expires, or null. */
export function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = new Date(`${dateStr}T00:00:00`).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}
