/**
 * React Integration Helper
 * Provides utilities for rendering React components in the Chrome extension
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Render a React component into a DOM element
 */
export function renderReactComponent(
  component: React.ReactElement,
  container: HTMLElement
): () => void {
  const root = createRoot(container);
  root.render(component);
  
  // Return cleanup function
  return () => {
    root.unmount();
  };
}

/**
 * Create a React component wrapper for easy integration
 */
export function createReactWrapper<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  props: T
): React.ReactElement {
  return React.createElement(Component, props);
}
