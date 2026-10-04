import { ValLoadingScreen } from "@/components/brand/ValLoadingScreen";
import { DelayedMobileLoading } from "@/components/mobile/mobile-page-loading";

type BrandLoaderProps = {
  label?: string;
  size?: "sm" | "lg";
};

export function BrandLoader({ label = "Loading", size = "lg" }: BrandLoaderProps) {
  return <ValLoadingScreen label={label} size={size} />;
}

export function AppLoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <main className="loading-canvas grid min-h-[100dvh] place-items-center px-4 text-[color:var(--text-high)]">
      <BrandLoader label={label} />
    </main>
  );
}

export function DashboardLoadingShell() {
  return (
    <DelayedMobileLoading label="Opening your space"><main className="loading-canvas val-dashboard-loading" aria-busy="true">
      <BrandLoader label="Opening your space" />
    </main></DelayedMobileLoading>
  );
}

export function VoiceRoomLoading() {
  return (
    <div className="loading-canvas grid min-h-0 flex-1 place-items-center px-5 py-8">
      <BrandLoader label="Opening voice room" size="sm" />
    </div>
  );
}
