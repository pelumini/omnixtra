const DEFAULT_APP_BASE_DOMAIN = "localhost";

export function appBaseDomain(): string {
  return process.env.NEXT_PUBLIC_APP_BASE_DOMAIN ?? DEFAULT_APP_BASE_DOMAIN;
}

export function tenantUrl(subdomain: string, path: string, location: Location): string {
  const baseDomain = appBaseDomain();
  const port = location.port ? `:${location.port}` : "";
  return `${location.protocol}//${subdomain}.${baseDomain}${port}${path}`;
}

export function tenantApiUrl(publicApiUrl: string, browserHost: string): string {
  const slug = tenantSlugFromHost(browserHost);
  if (slug === null) {
    return publicApiUrl;
  }
  const url = new URL(publicApiUrl);
  url.hostname = `${slug}.${appBaseDomain()}`;
  return url.origin;
}

export function tenantApiUrlForSlug(publicApiUrl: string, slug: string): string {
  const url = new URL(publicApiUrl);
  url.hostname = `${slug}.${appBaseDomain()}`;
  return url.origin;
}

export function tenantSlugFromHost(host: string, baseDomain = appBaseDomain()): string | null {
  const hostname = host.split(":", 1)[0]?.toLowerCase().replace(/\.$/, "") ?? "";
  const normalizedBaseDomain = baseDomain.toLowerCase().replace(/\.$/, "");
  if (hostname === normalizedBaseDomain) {
    return null;
  }
  const suffix = `.${normalizedBaseDomain}`;
  if (!hostname.endsWith(suffix)) {
    return null;
  }
  const candidate = hostname.slice(0, -suffix.length);
  return candidate.includes(".") || candidate.length === 0 ? null : candidate;
}
