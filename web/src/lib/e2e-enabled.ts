export const E2E_FIXTURES_ENABLED = process.env.NEXT_PUBLIC_OMNIXTRA_E2E_FIXTURES === "1";

export function e2eFixturesEnabled() {
  return E2E_FIXTURES_ENABLED;
}
