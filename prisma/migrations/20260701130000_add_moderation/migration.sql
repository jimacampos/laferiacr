-- Phase 4 migration: roles, permissions & moderation (ADR-0014, ADR-0015).
-- Adds the deferred moderation_actions audit table, user_bans (temp-bans), and app_config
-- (admin-configurable settings, e.g. threshold N), plus a reports index to drive the queue.
-- Authored manually to match the Phase 1/2/3 style; applied via `prisma migrate deploy`.
-- See docs/architecture/rbac.md, docs/architecture/moderation-trust.md,
-- docs/architecture/data-model.md, and the new ADR-0014 / ADR-0015.

-- CreateTable: moderation_actions (append-only audit of moderator/admin actions)
CREATE TABLE "moderation_actions" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "moderation_actions_target_type_target_id_idx" ON "moderation_actions"("target_type", "target_id");
CREATE INDEX "moderation_actions_actor_id_idx" ON "moderation_actions"("actor_id");
CREATE INDEX "moderation_actions_created_at_idx" ON "moderation_actions"("created_at");

-- CreateTable: user_bans (temporary or permanent bans; active bans block all writes)
CREATE TABLE "user_bans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reason" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "lifted_at" TIMESTAMP(3),
    "lifted_by" UUID,

    CONSTRAINT "user_bans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_bans_user_id_expires_at_idx" ON "user_bans"("user_id", "expires_at");

-- CreateTable: app_config (admin-configurable key/value settings, e.g. confirmation_threshold)
CREATE TABLE "app_config" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("key")
);

-- Index to drive the moderation queue's "open reports, newest first" listing.
CREATE INDEX "reports_status_created_at_idx" ON "reports"("status", "created_at");

-- Foreign keys (enforced in SQL; no Prisma relations, matching reports/change_history)
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_bans" ADD CONSTRAINT "user_bans_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_bans" ADD CONSTRAINT "user_bans_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_bans" ADD CONSTRAINT "user_bans_lifted_by_fkey"
    FOREIGN KEY ("lifted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "app_config" ADD CONSTRAINT "app_config_updated_by_fkey"
    FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the admin-configurable threshold N (idempotent; matches the Phase 3 default of 2).
INSERT INTO "app_config" ("key", "value") VALUES ('confirmation_threshold', '2')
    ON CONFLICT ("key") DO NOTHING;
