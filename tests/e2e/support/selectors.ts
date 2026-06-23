export const ids = {
  loginEmail: 'login-email',
  loginPassword: 'login-password',
  loginSubmit: 'login-submit',
  dashboardTitle: 'dashboard-title',
  sidebar: 'main-sidebar',
  logout: 'logout-button',
} as const;

export const heading = (name: string | RegExp) => ({ role: 'heading' as const, name });
