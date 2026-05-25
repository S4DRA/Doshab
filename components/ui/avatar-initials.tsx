import { getInitials } from "@/lib/utils";

type AvatarInitialsProps = {
  value: string;
};

export function AvatarInitials({ value }: AvatarInitialsProps) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-indigo-500/20 text-sm font-bold text-indigo-200">
      {getInitials(value)}
    </span>
  );
}
