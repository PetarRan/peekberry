// Demo configuration for testing
export const DEMO_CONFIG = {
  USER_ID: import.meta.env.VITE_DEMO_USER_ID,
  ENABLED: import.meta.env.VITE_DEMO_ENABLED === "true" || false,
};
