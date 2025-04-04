import '@testing-library/jest-dom';

// Optional: Filtering specific console warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('React Router Future Flag Warning')) {
    return;
  }
  originalWarn.apply(console, args);
};
