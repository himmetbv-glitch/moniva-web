export type LoginFormState = {
  ok: boolean;
  fieldErrors?: Record<string, string[]>;
  formError?: string;
};

export const ADMIN_DASHBOARD_PATH = "/admin/dashboard";
export const ADMIN_LOGIN_PATH = "/admin/login";
