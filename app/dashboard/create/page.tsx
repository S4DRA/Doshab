import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import { MobileCreateSpace } from "@/components/mobile/mobile-create-space";

export default async function CreatePage() {
  if ((await getAuthState()).status !== "authenticated") redirect("/login");
  return <MobileCreateSpace />;
}
