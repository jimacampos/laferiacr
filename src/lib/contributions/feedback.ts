import { FEEDBACK_MAX_LENGTH } from "./config";
import { prisma } from "@/lib/prisma";

// Feedback channel (sign-in only). A signed-in user sends free-text feedback; it is stored
// for review in the /admin area. Pure validation lives here so it is unit-testable without a
// database; the DB helpers wrap prisma.

export type FeedbackValidation =
  | { ok: true; message: string; pageUrl: string | null }
  | { ok: false; error: "invalid_message" };

/** Page-url context is optional; keep it bounded so a bad client can't store a huge string. */
const PAGE_URL_MAX_LENGTH = 500;

/**
 * Validate + normalize a feedback submission. Pure. Trims the message, rejects empty or
 * over-long messages, and clamps the optional page url.
 */
export function validateFeedback(
  rawMessage: unknown,
  rawPageUrl?: unknown,
): FeedbackValidation {
  if (typeof rawMessage !== "string") {
    return { ok: false, error: "invalid_message" };
  }
  const message = rawMessage.trim();
  if (message.length === 0 || message.length > FEEDBACK_MAX_LENGTH) {
    return { ok: false, error: "invalid_message" };
  }
  const pageUrl =
    typeof rawPageUrl === "string" && rawPageUrl.trim().length > 0
      ? rawPageUrl.trim().slice(0, PAGE_URL_MAX_LENGTH)
      : null;
  return { ok: true, message, pageUrl };
}

/** Persist a validated feedback entry authored by a signed-in user. */
export async function createFeedback(input: {
  submittedBy: string;
  message: string;
  pageUrl: string | null;
}): Promise<{ id: string }> {
  const row = await prisma.feedback.create({
    data: {
      submittedBy: input.submittedBy,
      message: input.message,
      pageUrl: input.pageUrl,
    },
    select: { id: true },
  });
  return row;
}

export interface FeedbackItem {
  id: string;
  message: string;
  pageUrl: string | null;
  status: string;
  createdAt: Date;
  author: { displayName: string | null; email: string | null };
}

/** Newest feedback first, joined with the author's display name/email for triage. */
export async function getFeedbackQueue(
  limit = 100,
  offset = 0,
): Promise<FeedbackItem[]> {
  const rows = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    select: {
      id: true,
      message: true,
      pageUrl: true,
      status: true,
      createdAt: true,
      submittedBy: true,
    },
  });

  const authorIds = [...new Set(rows.map((r) => r.submittedBy))];
  const authors = authorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, displayName: true, email: true },
      })
    : [];
  const byId = new Map(authors.map((a) => [a.id, a]));

  return rows.map((r) => ({
    id: r.id,
    message: r.message,
    pageUrl: r.pageUrl,
    status: r.status,
    createdAt: r.createdAt,
    author: {
      displayName: byId.get(r.submittedBy)?.displayName ?? null,
      email: byId.get(r.submittedBy)?.email ?? null,
    },
  }));
}

/** Count of open (unreviewed) feedback — surfaced on the admin dashboard. */
export async function countOpenFeedback(): Promise<number> {
  return prisma.feedback.count({ where: { status: "open" } });
}

const FEEDBACK_STATUSES = ["open", "reviewed", "archived"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export function isFeedbackStatus(value: unknown): value is FeedbackStatus {
  return (
    typeof value === "string" &&
    (FEEDBACK_STATUSES as readonly string[]).includes(value)
  );
}

/** Update a feedback entry's review status. Returns false when the entry is missing. */
export async function setFeedbackStatus(
  id: string,
  status: FeedbackStatus,
): Promise<boolean> {
  const existing = await prisma.feedback.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return false;
  await prisma.feedback.update({ where: { id }, data: { status } });
  return true;
}
