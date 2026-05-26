import { getInitials } from "@/lib/utils";

type AvatarInitialsProps = {
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  value: string;
};

const sizeClasses = {
  sm: "size-9 text-xs",
  md: "size-10 text-sm",
  lg: "size-20 text-xl",
};

export function AvatarInitials({
  imageUrl,
  size = "md",
  value,
}: AvatarInitialsProps) {
  const className = `${sizeClasses[size]} grid shrink-0 place-items-center overflow-hidden rounded-md bg-[#445242]/20 font-bold text-[#FF5F25]`;

  if (imageUrl) {
    return (
      <span className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="size-full object-cover"
          referrerPolicy="no-referrer"
          src={imageUrl}
        />
      </span>
    );
  }

  return (
    <span className={className}>
      {getInitials(value)}
    </span>
  );
}
