const helperEnvKeys = [
  "GOMDOL_REMOTE_MEDIA_HELPER_URL",
  "GOMDOL_REMOTE_HELPER_URL",
  "GOMDOL_HELPER_URL",
  "YOUTUBE_HELPER_URL",
];

export function getRemoteMediaHelperUrl() {
  for (const key of helperEnvKeys) {
    const value = process.env[key]?.trim();
    if (value) return value.replace(/\/+$/, "");
  }
  return "";
}

export async function fetchRemoteMediaHelperDownload(url: string, format: string) {
  const helperUrl = getRemoteMediaHelperUrl();
  if (!helperUrl) return null;

  const response = await fetch(`${helperUrl}/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, format }),
    signal: AbortSignal.timeout(30 * 60 * 1000),
  });

  if (!response.ok || !response.body) {
    const payload = await response.text().catch(() => "");
    throw new Error(payload || `remote helper failed: ${response.status}`);
  }

  const headers = new Headers({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Gomdol-Download-Source": "remote-helper",
  });

  for (const key of ["Content-Type", "Content-Length", "Content-Disposition"]) {
    const value = response.headers.get(key);
    if (value) headers.set(key, value);
  }

  return new Response(response.body, { headers });
}
