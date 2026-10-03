import { redirect } from "next/navigation";

// Preserve saved links while keeping VAL on its approved visual identity.
export default function ProfileThemesPage() {
  redirect("/dashboard/profile");
}
