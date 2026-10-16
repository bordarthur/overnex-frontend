import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());

// jsdom não mede layout: os gráficos recebem uma largura fixa para desenhar.
class ResizeObserverFake {
  private readonly aviso: ResizeObserverCallback;
  constructor(aviso: ResizeObserverCallback) {
    this.aviso = aviso;
  }
  observe(alvo: Element) {
    this.aviso([{ target: alvo, contentRect: { width: 600 } } as unknown as ResizeObserverEntry], this);
  }
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverFake as unknown as typeof ResizeObserver;

window.matchMedia ??= ((consulta: string) => ({
  matches: false,
  media: consulta,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia;
