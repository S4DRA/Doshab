import { redirect } from "next/navigation";

// Keep saved theme links pointing to the appearance section.
export default function ProfileThemesPage() {
  redirect("/dashboard/profile#appearance");
}
