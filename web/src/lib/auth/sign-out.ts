import { logout } from "@/lib/api/auth";

export async function signOutAndRedirect() {
  try {
    await logout();
  } catch {
    // The local signup handoff may only have a web-host access cookie.
  }
  await fetch("/auth/local-signout", { method: "POST" });
  window.location.assign("/login");
}
