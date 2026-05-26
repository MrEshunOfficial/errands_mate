// types/google.d.ts
export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleInitConfig) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export interface GoogleInitConfig {
  client_id: string;
  callback: (response: { credential: string }) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  use_fedcm_for_prompt?: boolean;
}

export interface GoogleButtonConfig {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  type?: "standard" | "icon";
  width?: number;
  locale?: string;
}