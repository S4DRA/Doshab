import { ValLoadingScreen } from "@/components/brand/ValLoadingScreen";

type BrandLoaderProps = {
  label?: string;
  size?: "sm" | "lg";
};

export function BrandLoader({ label = "Loading", size = "lg" }: BrandLoaderProps) {
  return <ValLoadingScreen label={label} size={size} />;
}

export function AppLoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <main className="loading-canvas grid min-h-[100dvh] place-items-center px-4 text-white">
      <BrandLoader label={label} />
    </main>
  );
}

export function DashboardLoadingShell() {
  return (
    <main className="loading-canvas app-page-scroll text-white" aria-busy="true">
      <div className="app-page-container grid gap-5 py-4">
        <section className="grid justify-items-center py-2">
          <BrandLoader label="Loading dashboard" size="sm" />
        </section>

        <section className="app-page-header">
          <div className="app-skeleton h-3 w-20 rounded-full" />
          <div className="app-skeleton mt-3 h-8 w-48 rounded-full" />
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="app-card p-4" key={index}>
              <div className="app-skeleton h-4 w-24 rounded-full" />
              <div className="app-skeleton mt-4 h-7 w-32 rounded-full" />
              <div className="app-skeleton mt-4 h-3 w-full rounded-full" />
              <div className="app-skeleton mt-2 h-3 w-4/5 rounded-full" />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

export function VoiceRoomLoading() {
  return (
    <div className="grid min-h-0 flex-1 place-items-center px-5 py-8">
      <section className="app-panel grid w-full max-w-2xl justify-items-center p-6 text-center">
        <BrandLoader label="Opening voice room" size="sm" />
        <div className="mt-6 grid w-full gap-2">
          <div className="app-skeleton mx-auto h-3 w-44 rounded-full" />
          <div className="app-skeleton mx-auto h-3 w-32 rounded-full" />
        </div>
      </section>
    </div>
  );
}
