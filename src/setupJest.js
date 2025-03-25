// Global setup for Jest tests
const originalWarn = console.warn;
console.warn = (...args) => {
  // Filter out React Router warnings
  if (args[0] && typeof args[0] === 'string' && args[0].includes('React Router Future Flag Warning')) {
    return;
  }
  originalWarn.apply(console, args);
};