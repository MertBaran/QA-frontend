// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: global.jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: global.jest.fn(), // deprecated
    removeListener: global.jest.fn(), // deprecated
    addEventListener: global.jest.fn(),
    removeEventListener: global.jest.fn(),
    dispatchEvent: global.jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};
