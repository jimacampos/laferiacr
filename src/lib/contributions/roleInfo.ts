import { ROLES, type Role } from "./rolesPolicy";

// Legend metadata for the Roles screen (BL-019): pairs each role with its i18n label and a
// description key explaining what it grants (copy lives in dictionaries.ts, sourced from the
// rbac.md capability matrix). Pure + client-safe so it can be unit-tested and imported by the
// RoleLegend component.

export interface RoleInfo {
  role: Role;
  labelKey: string;
  descriptionKey: string;
}

/** Ordered role legend entries, lowest → highest privilege (mirrors `ROLES`). */
export const ROLE_INFO: readonly RoleInfo[] = ROLES.map((role) => ({
  role,
  labelKey: `role.${role}`,
  descriptionKey: `role.${role}.desc`,
}));
