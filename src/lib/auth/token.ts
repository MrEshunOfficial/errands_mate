export function saveAuthToken(token: string): void {
  localStorage.setItem("authToken", token);
  const secure = location.protocol === "https:" ? "; Secure" : "";
  // 7-day persistent cookie so mobile browsers don't clear it between sessions
  document.cookie = `authToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`;
}

export function clearAuthToken(): void {
  localStorage.removeItem("authToken");
  // Must include "; Secure" on HTTPS to match how the cookie was set — mobile
  // browsers (iOS Safari) won't delete a Secure cookie without it.
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `authToken=; path=/; max-age=0; SameSite=Lax${secure}`;
}
