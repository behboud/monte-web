const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");

export function sitePath(path: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return encodeURI(`${BASE_PATH}${normalized.replaceAll("%20", " ")}`) || "/";
}

export function isExternalPath(path: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(path);
}
