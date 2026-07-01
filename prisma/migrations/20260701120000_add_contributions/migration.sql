-- Phase 3 migration: community contribution loop (propose -> confirm -> verify).
-- Adds proposals, confirmations, reports, change_history, user_roles (minimal, pulled
-- forward for break-glass admin), and a per-IP rate-limit log. Authored manually to match
-- the Phase 1/2 style; applied via `prisma migrate deploy`.
-- See docs/architecture/data-model.md, docs/architecture/moderation-trust.md,
-- docs/decisions/0007-*, 0008-*, and the new ADR-0012 / ADR-0013.

-- CreateTable: proposals
CREATE TABLE "proposals" (
    "id" UUID NOT NULL,
    "market_id" UUID NOT NULL,
    "field" TEXT NOT NULL,
    "proposed_value" JSONB NOT NULL,
    "submitted_by" UUID,
    "submitter_ip_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confirm_count" INTEGER NOT NULL DEFAULT 0,
    "reject_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "proposals_market_id_field_status_idx" ON "proposals"("market_id", "field", "status");
CREATE INDEX "proposals_submitted_by_idx" ON "proposals"("submitted_by");

-- CreateTable: confirmations
CREATE TABLE "confirmations" (
    "id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "vote" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "confirmations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "confirmations_proposal_id_user_id_key" ON "confirmations"("proposal_id", "user_id");

-- CreateTable: reports (polymorphic target: market | proposal)
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "reported_by" UUID,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reports_target_type_target_id_status_idx" ON "reports"("target_type", "target_id", "status");

-- CreateTable: change_history (append-only audit of promotions + break-glass actions)
CREATE TABLE "change_history" (
    "id" UUID NOT NULL,
    "market_id" UUID NOT NULL,
    "field" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "caused_by_proposal" UUID,
    "actor_id" UUID,
    "action" TEXT NOT NULL DEFAULT 'promote',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "change_history_market_id_field_idx" ON "change_history"("market_id", "field");

-- CreateTable: user_roles (minimal RBAC, pulled forward from Phase 4)
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "scope" TEXT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" UUID,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- Unique on (user, role, scope). NULL scopes are not deduplicated by a plain unique index,
-- so use a partial + expression pair to enforce one grant per role whether scope is set or not.
CREATE UNIQUE INDEX "user_roles_user_role_scope_key" ON "user_roles"("user_id", "role", "scope");
CREATE UNIQUE INDEX "user_roles_user_role_noscope_key" ON "user_roles"("user_id", "role") WHERE "scope" IS NULL;

-- CreateTable: contribution_attempts (durable per-IP rate-limit log)
CREATE TABLE "contribution_attempts" (
    "id" UUID NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contribution_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contribution_attempts_ip_hash_action_created_at_idx" ON "contribution_attempts"("ip_hash", "action", "created_at");

-- Foreign keys
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_market_id_fkey"
    FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_submitted_by_fkey"
    FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "confirmations" ADD CONSTRAINT "confirmations_proposal_id_fkey"
    FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "confirmations" ADD CONSTRAINT "confirmations_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_by_fkey"
    FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "change_history" ADD CONSTRAINT "change_history_market_id_fkey"
    FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "change_history" ADD CONSTRAINT "change_history_caused_by_proposal_fkey"
    FOREIGN KEY ("caused_by_proposal") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "change_history" ADD CONSTRAINT "change_history_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_fkey"
    FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
