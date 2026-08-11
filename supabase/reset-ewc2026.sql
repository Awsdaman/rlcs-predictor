-- ============================================================================
-- EWC 2026 changeover — clear last tournament's data
--
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- KEEPS   players, groups, app_settings  (accounts, private groups, admin pw)
-- CLEARS  predictions, results, bonus_points, bracket_teams
--
-- Why: match IDs changed with the format switch. The old Paris Major rows
-- (ga1, gb3, p_lb1, p_ubqf1 …) no longer match any match in the app, so they
-- are dead weight that would only ever inflate prediction counts and the
-- admin "results set" stat. The new IDs are a_ubqf1 … b_lbr2m2 and
-- p_qf1 … p_gf.
--
-- None of these truncates touch players or groups: the FKs point *from*
-- predictions/bonus_points *to* players, so clearing the child tables leaves
-- every account intact.
-- ============================================================================

BEGIN;

TRUNCATE predictions;
TRUNCATE results;
TRUNCATE bonus_points;
TRUNCATE bracket_teams;

COMMIT;

-- ── Verify: predictions/results/bonus/bracket should be 0, players/groups unchanged
SELECT 'players'       AS table_name, count(*) FROM players
UNION ALL SELECT 'groups',        count(*) FROM groups
UNION ALL SELECT 'predictions',   count(*) FROM predictions
UNION ALL SELECT 'results',       count(*) FROM results
UNION ALL SELECT 'bonus_points',  count(*) FROM bonus_points
UNION ALL SELECT 'bracket_teams', count(*) FROM bracket_teams;
