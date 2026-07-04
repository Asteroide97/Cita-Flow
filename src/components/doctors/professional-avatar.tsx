import { getDoctorInitials } from "@/lib/doctors/presentation";
import { cn } from "@/lib/utils";

type ProfessionalAvatarProps = {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClassNames = {
  sm: "h-11 w-11 text-sm",
  md: "h-14 w-14 text-base",
  lg: "h-16 w-16 text-lg",
} satisfies Record<NonNullable<ProfessionalAvatarProps["size"]>, string>;

export function ProfessionalAvatar({
  name,
  photoUrl,
  size = "md",
  className,
}: ProfessionalAvatarProps) {
  const initials = getDoctorInitials(name);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-line/80 bg-surface-soft font-semibold tracking-[0.08em] text-brand-700 shadow-soft",
        sizeClassNames[size],
        className,
      )}
      style={
        photoUrl
          ? {
              backgroundImage: `url(${photoUrl})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : undefined
      }
      aria-label={photoUrl ? `Foto de ${name}` : `Iniciales de ${name}`}
      title={name}
    >
      {photoUrl ? (
        <span className="sr-only">{name}</span>
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </span>
  );
}
