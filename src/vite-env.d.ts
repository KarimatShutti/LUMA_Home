/// <reference types="vite/client" />

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref?: string;
        callback: (response: { reference: string; status?: string; trans?: string }) => void | Promise<void>;
        onClose?: () => void;
      }) => { openIframe: () => void };
    };
  }
}

export {}
