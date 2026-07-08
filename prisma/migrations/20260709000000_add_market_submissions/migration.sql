-- Phase 5 migration: community-submitted new markets (ADR-0009).
-- Adds market_submissions (candidate new markets awaiting promotion) and
-- submission_confirmations (account-gated votes on a submission). Submissions are promoted into
-- real `markets` rows at N net confirmations, mirroring the Phase 3 proposal loop; submitting
-- requires sign-in. Authored manually to match the Phase 1/2/3/4 style; applied via
-- `prisma migrate deploy`. See docs/architecture/data-model.md, docs/decisions/0009-*.

-- CreateTable: market_submissions
CREATE TABLE "market_submissions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "location" geography(Point, 4326),
    "details" JSONB NOT NULL,
    "submitted_by" UUID NOT NULL,
    "submitter_ip_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confirm_count" INTEGER NOT NULL DEFAULT 0,
    "reject_count" INTEGER NOT NULL DEFAULT 0,
    "promoted_market_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_submissions_pkey" PRIMARY KEY ("id")
);

-- Index to drive the "pending submissions, newest first" queue.
CREATE INDEX "market_submissions_status_created_at_idx" ON "market_submissions"("status", "created_at");
-- Spatial index for proximity-based duplicate detection.
CREATE INDEX "market_submissions_location_idx" ON "market_submissions" USING GIST ("location");

-- CreateTable: submission_confirmations
CREATE TABLE "submission_confirmations" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "vote" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_confirmations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "submission_confirmations_submission_id_user_id_key" ON "submission_confirmations"("submission_id", "user_id");

-- Foreign keys. FKs to `users` are enforced in SQL (no Prisma relations), matching the
-- reports/change_history/feedback precedent; the submission->confirmation link cascades.
ALTER TABLE "market_submissions" ADD CONSTRAINT "market_submissions_submitted_by_fkey"
    FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "market_submissions" ADD CONSTRAINT "market_submissions_promoted_market_id_fkey"
    FOREIGN KEY ("promoted_market_id") REFERENCES "markets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "submission_confirmations" ADD CONSTRAINT "submission_confirmations_submission_id_fkey"
    FOREIGN KEY ("submission_id") REFERENCES "market_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "submission_confirmations" ADD CONSTRAINT "submission_confirmations_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
