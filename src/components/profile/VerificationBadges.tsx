import { BadgeCheck, ShieldCheck, Car, FileCheck2, Mail, Phone } from "lucide-react";

export type BadgeFlags = {
  email_verified?: boolean;
  phone_verified?: boolean;
  identity_verified?: boolean;
  license_verified?: boolean;
  vehicle_verified?: boolean;
  insurance_verified?: boolean;
};

const ITEMS = [
  { key: "email_verified", label: "E-mail vérifié", icon: Mail },
  { key: "phone_verified", label: "Téléphone vérifié", icon: Phone },
  { key: "identity_verified", label: "Identité vérifiée", icon: ShieldCheck },
  { key: "license_verified", label: "Conducteur vérifié", icon: BadgeCheck },
  { key: "vehicle_verified", label: "Véhicule vérifié", icon: Car },
  { key: "insurance_verified", label: "Assurance vérifiée", icon: FileCheck2 },
] as const;

/** Badges are derived from approved verification records only — never set by hand. */
export function VerificationBadges({ flags }: { flags: BadgeFlags }) {
  const earned = ITEMS.filter((i) => flags[i.key]);
  if (earned.length === 0) {
    return <p className="text-xs font-semibold text-muted-foreground">Aucun badge pour le moment</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {earned.map((i) => (
        <li
          key={i.key}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-xs font-bold text-primary-dark"
        >
          <i.icon className="h-3.5 w-3.5" aria-hidden="true" />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
