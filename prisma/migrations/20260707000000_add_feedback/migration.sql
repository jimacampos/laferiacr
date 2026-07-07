-- Pre-launch migration: user feedback channel.
-- Adds the `feedback` table for free-text feedback from signed-in users (sign-in required,
-- so `submitted_by` is NOT NULL). Reviewed in the /admin area. Authored manually to match
-- the Phase 1/2/3/4 style; applied via `prisma migrate deploy`.
-- See docs/architecture/data-model.md.

-- CreateTable: feedback (free-text feedback from a signed-in user)
CREATE TABLE "feedback" (
    "id" UUID NOT NULL,
    "submitted_by" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "page_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "feedback_status_created_at_idx" ON "feedback"("status", "created_at");
CREATE INDEX "feedback_submitted_by_idx" ON "feedback"("submitted_by");

-- Foreign key (enforced in SQL; no Prisma relation, matching reports/moderation_actions)
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_submitted_by_fkey"
    FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
