export function saveAuthToken(token: string): void {
  localStorage.setItem("authToken", token);
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `authToken=${token}; path=/; SameSite=Lax${secure}`;
}

export function clearAuthToken(): void {
  localStorage.removeItem("authToken");
  document.cookie = "authToken=; path=/; max-age=0; SameSite=Lax";
}
