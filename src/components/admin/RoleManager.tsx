"use client";

import { useState } from "react";

import { useTranslation } from "@/i18n/I18nProvider";
import {
  banUser,
  changeRole,
  searchUsers,
  type UserSummary,
} from "@/lib/contributions/adminApi";
import { BAN_DURATIONS } from "@/lib/contributions/bansPolicy";
import { ROLES } from "@/lib/contributions/rolesPolicy";

// Roles a Super Admin can grant/revoke (everything except the implicit `member`).
const GRANTABLE_ROLES = ROLES.filter((r) => r !== "member");

function RoleBadges({ roles }: { roles: string[] }) {
  const { t } = useTranslation();
  if (roles.length === 0) {
    return <span className="text-xs italic text-stone-400">{t("roles.none")}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <span
          key={r}
          className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200"
        >
          {t(`role.${r}`)}
        </span>
      ))}
    </div>
  );
}

function UserCard({
  user,
  currentUserId,
  onChanged,
}: {
  user: UserSummary;
  currentUserId: string;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [banDuration, setBanDuration] = useState<string>("7d");
  const [reason, setReason] = useState("");

  const isSelf = user.id === currentUserId;

  async function run(
    fn: () => Promise<{ ok: boolean; error?: string }>,
    okKey: string,
  ) {
    setBusy(true);
    setMessage(null);
    const res = await fn();
    setBusy(false);
    if (!res.ok) {
      const key =
        res.error === "last_super_admin"
          ? "roles.lastSuperAdmin"
          : res.error === "cannot_ban_self"
            ? "ban.self"
            : "roles.error";
      setMessage(t(key));
      return;
    }
    setMessage(t(okKey));
    onChanged();
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-900">
            {user.displayName ?? user.email ?? user.externalId}
          </p>
          {user.email && (
            <p className="truncate text-xs text-stone-500">{user.email}</p>
          )}
        </div>
        <RoleBadges roles={user.roles} />
      </div>

      <div className="flex flex-col gap-2 border-t border-stone-100 pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
          {t("roles.current")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {GRANTABLE_ROLES.map((role) => {
            const has = user.roles.includes(role);
            return (
              <button
                key={role}
                type="button"
                disabled={busy}
                onClick={() =>
                  run(
                    () =>
                      changeRole(has ? "revoke" : "grant", user.id, role),
                    has ? "roles.revoked" : "roles.granted",
                  )
                }
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
                  has
                    ? "bg-stone-200 text-stone-700 hover:bg-stone-300"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {has ? t("roles.revoke") : t("roles.grant")} · {t(`role.${role}`)}
              </button>
            );
          })}
        </div>
      </div>

      {!isSelf && (
        <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-400">
            {t("ban.title")}
          </span>
          <select
            value={banDuration}
            onChange={(e) => setBanDuration(e.target.value)}
            className="rounded-lg border border-stone-300 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
          >
            {Object.keys(BAN_DURATIONS).map((d) => (
              <option key={d} value={d}>
                {t(`ban.duration.${d}`)}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("ban.reasonPlaceholder")}
            maxLength={280}
            className="min-w-0 flex-1 rounded-lg border border-stone-300 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(
                () => banUser(user.id, banDuration, reason.trim() || undefined),
                "ban.done",
              )
            }
            className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            {t("ban.submit")}
          </button>
        </div>
      )}

      {message && <p className="text-xs text-stone-600">{message}</p>}
    </li>
  );
}

/** Super-Admin role management: search accounts, grant/revoke roles, and issue temp-bans. */
export function RoleManager({ currentUserId }: { currentUserId: string }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    const res = await searchUsers(query.trim());
    setBusy(false);
    setSearched(true);
    setUsers(res.data?.users ?? []);
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-stone-900">{t("roles.title")}</h2>

      <form onSubmit={search} className="flex flex-wrap gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("roles.searchPlaceholder")}
          className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? t("roles.searching") : t("roles.search")}
        </button>
      </form>

      {searched && users.length === 0 ? (
        <p className="text-sm text-stone-500">{t("roles.noResults")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              currentUserId={currentUserId}
              onChanged={search}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
