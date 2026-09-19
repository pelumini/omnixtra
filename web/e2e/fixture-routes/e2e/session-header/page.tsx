import { notFound } from "next/navigation";

import { e2eFixturesEnabled } from "@/lib/e2e-fixtures";

export default function E2ESessionHeaderPage() {
  if (!e2eFixturesEnabled()) {
    notFound();
  }

  return (
    <main>
      <h1>Session Header Fixture</h1>
    </main>
  );
}
