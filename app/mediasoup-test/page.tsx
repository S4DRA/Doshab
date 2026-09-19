import { notFound } from "next/navigation";

import { MediasoupDiagnostic } from "./test-client";

export default function MediasoupTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <MediasoupDiagnostic />;
}
