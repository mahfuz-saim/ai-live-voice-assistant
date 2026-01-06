/**
 * @jest-environment jsdom
 */

describe('Frontend Environment', () => {
  test('should provide a browser-like environment', () => {
    const element = document.createElement('div');
    element.innerHTML = 'Hello World';
    expect(element.textContent).toBe('Hello World');
    expect(window).toBeDefined();
  });

  test('basic math should work', () => {
    expect(1 + 1).toBe(2);
  });
});
