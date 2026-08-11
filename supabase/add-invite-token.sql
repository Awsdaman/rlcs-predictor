-- ============================================================================
-- Adds groups.invite_token — required by the invite-link join flow
--
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- The app has shipped the one-click invite feature (commit ba94b0e) but this
-- column was never added, so the whole flow is currently dead:
--   • My Group shows "Token not yet generated — run DB migration"
--   • Admin → Groups hides the "🔗 Link" button; "↻" fails silently
--   • Opening /join/{uuid} always reports "Invite link is invalid"
--
-- Safe to re-run: ADD COLUMN IF NOT EXISTS, and the UPDATE only fills NULLs.
-- ============================================================================

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS invite_token uuid UNIQUE DEFAULT gen_random_uuid();

-- Backfill any existing group that predates the column
UPDATE groups
   SET invite_token = gen_random_uuid()
 WHERE invite_token IS NULL;

-- ── Verify: every group should now have a token
SELECT id, name, is_private, invite_token
  FROM groups
 ORDER BY created_at;
