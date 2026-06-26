/// <reference types="vite/client" />

declare const chrome: {
  runtime: {
    getURL(path: string): string;
  };
  tabs: {
    create(input: { url: string }): void;
  };
};
