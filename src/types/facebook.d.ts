export {};

declare global {
  interface Window {
    FB?: {
      init: (params: FacebookInitConfig) => void;
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options?: { scope?: string; auth_type?: string },
      ) => void;
      getLoginStatus: (
        callback: (response: FacebookLoginResponse) => void,
      ) => void;
      logout: (callback: () => void) => void;
    };
    fbAsyncInit?: () => void;
  }
}

export interface FacebookInitConfig {
  appId: string;
  cookie?: boolean;
  xfbml?: boolean;
  version: string;
}

export interface FacebookLoginResponse {
  status: "connected" | "not_authorized" | "unknown";
  authResponse?: {
    accessToken: string;
    expiresIn: string;
    reauthorize_required_in: string;
    signedRequest: string;
    userID: string;
  };
}
