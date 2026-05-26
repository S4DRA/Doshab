import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardSidebar />
      <div className="min-w-0 overflow-hidden pl-14 sm:pl-16">{children}</div>
    </>
  );
}
