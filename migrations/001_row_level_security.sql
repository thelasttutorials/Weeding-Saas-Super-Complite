-- ============================================================================
-- WedSaaS — Row Level Security Migration
-- Applied: 2026-03-09
--
-- Mechanism: PostgreSQL custom setting app.current_user_id (transaction-local)
-- Set by: server/db.ts#withUserContext() via SET LOCAL inside each request's tx
-- Used by: server/routes.ts — all authenticated routes use withUserContext()
--
-- Tables with FORCE RLS (9):
--   invitations, invitation_couples, invitation_events, invitation_content,
--   invitation_gallery, rsvps, guest_messages, gift_accounts, gift_confirmations
--
-- Tables without RLS (2):
--   users   — accessed by auth (login/register) before user context exists
--   session — managed by connect-pg-simple, must not be touched
-- ============================================================================

-- ── Helper functions ────────────────────────────────────────────────────────

-- Bypasses RLS to safely increment view counter (called from public route)
CREATE OR REPLACE FUNCTION increment_invitation_views(p_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE invitations SET views = views + 1 WHERE id = p_id;
END;
$$;

-- Checks ownership without being subject to the invitations RLS itself
CREATE OR REPLACE FUNCTION current_user_owns_invitation(p_invitation_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM invitations
    WHERE id = p_invitation_id
      AND user_id::text = current_setting('app.current_user_id', true)
      AND current_setting('app.current_user_id', true) <> ''
  );
$$;

-- Checks published status without being subject to invitations RLS
CREATE OR REPLACE FUNCTION invitation_is_published(p_invitation_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM invitations
    WHERE id = p_invitation_id AND status = 'published'
  );
$$;

-- ── invitations ─────────────────────────────────────────────────────────────
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inv_select_own       ON invitations;
DROP POLICY IF EXISTS inv_select_published ON invitations;
DROP POLICY IF EXISTS inv_insert           ON invitations;
DROP POLICY IF EXISTS inv_update           ON invitations;
DROP POLICY IF EXISTS inv_delete           ON invitations;

CREATE POLICY inv_select_own ON invitations
  FOR SELECT USING (
    user_id::text = current_setting('app.current_user_id', true)
    AND current_setting('app.current_user_id', true) <> ''
  );
CREATE POLICY inv_select_published ON invitations
  FOR SELECT USING (status = 'published');
CREATE POLICY inv_insert ON invitations
  FOR INSERT WITH CHECK (
    user_id::text = current_setting('app.current_user_id', true)
    AND current_setting('app.current_user_id', true) <> ''
  );
CREATE POLICY inv_update ON invitations
  FOR UPDATE USING (
    user_id::text = current_setting('app.current_user_id', true)
    AND current_setting('app.current_user_id', true) <> ''
  );
CREATE POLICY inv_delete ON invitations
  FOR DELETE USING (
    user_id::text = current_setting('app.current_user_id', true)
    AND current_setting('app.current_user_id', true) <> ''
  );

-- ── invitation_couples ──────────────────────────────────────────────────────
ALTER TABLE invitation_couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_couples FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS couples_select ON invitation_couples;
DROP POLICY IF EXISTS couples_insert ON invitation_couples;
DROP POLICY IF EXISTS couples_update ON invitation_couples;
DROP POLICY IF EXISTS couples_delete ON invitation_couples;
CREATE POLICY couples_select ON invitation_couples FOR SELECT USING (current_user_owns_invitation(invitation_id) OR invitation_is_published(invitation_id));
CREATE POLICY couples_insert ON invitation_couples FOR INSERT WITH CHECK (current_user_owns_invitation(invitation_id));
CREATE POLICY couples_update ON invitation_couples FOR UPDATE USING (current_user_owns_invitation(invitation_id));
CREATE POLICY couples_delete ON invitation_couples FOR DELETE USING (current_user_owns_invitation(invitation_id));

-- ── invitation_events ───────────────────────────────────────────────────────
ALTER TABLE invitation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS events_select ON invitation_events;
DROP POLICY IF EXISTS events_insert ON invitation_events;
DROP POLICY IF EXISTS events_update ON invitation_events;
DROP POLICY IF EXISTS events_delete ON invitation_events;
CREATE POLICY events_select ON invitation_events FOR SELECT USING (current_user_owns_invitation(invitation_id) OR invitation_is_published(invitation_id));
CREATE POLICY events_insert ON invitation_events FOR INSERT WITH CHECK (current_user_owns_invitation(invitation_id));
CREATE POLICY events_update ON invitation_events FOR UPDATE USING (current_user_owns_invitation(invitation_id));
CREATE POLICY events_delete ON invitation_events FOR DELETE USING (current_user_owns_invitation(invitation_id));

-- ── invitation_content ──────────────────────────────────────────────────────
ALTER TABLE invitation_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_content FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_select ON invitation_content;
DROP POLICY IF EXISTS content_insert ON invitation_content;
DROP POLICY IF EXISTS content_update ON invitation_content;
DROP POLICY IF EXISTS content_delete ON invitation_content;
CREATE POLICY content_select ON invitation_content FOR SELECT USING (current_user_owns_invitation(invitation_id) OR invitation_is_published(invitation_id));
CREATE POLICY content_insert ON invitation_content FOR INSERT WITH CHECK (current_user_owns_invitation(invitation_id));
CREATE POLICY content_update ON invitation_content FOR UPDATE USING (current_user_owns_invitation(invitation_id));
CREATE POLICY content_delete ON invitation_content FOR DELETE USING (current_user_owns_invitation(invitation_id));

-- ── invitation_gallery ──────────────────────────────────────────────────────
ALTER TABLE invitation_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_gallery FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gallery_select ON invitation_gallery;
DROP POLICY IF EXISTS gallery_insert ON invitation_gallery;
DROP POLICY IF EXISTS gallery_update ON invitation_gallery;
DROP POLICY IF EXISTS gallery_delete ON invitation_gallery;
CREATE POLICY gallery_select ON invitation_gallery FOR SELECT USING (current_user_owns_invitation(invitation_id) OR invitation_is_published(invitation_id));
CREATE POLICY gallery_insert ON invitation_gallery FOR INSERT WITH CHECK (current_user_owns_invitation(invitation_id));
CREATE POLICY gallery_update ON invitation_gallery FOR UPDATE USING (current_user_owns_invitation(invitation_id));
CREATE POLICY gallery_delete ON invitation_gallery FOR DELETE USING (current_user_owns_invitation(invitation_id));

-- ── rsvps ───────────────────────────────────────────────────────────────────
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rsvps_owner_select  ON rsvps;
DROP POLICY IF EXISTS rsvps_public_insert ON rsvps;
CREATE POLICY rsvps_owner_select  ON rsvps FOR SELECT USING (current_user_owns_invitation(invitation_id));
CREATE POLICY rsvps_public_insert ON rsvps FOR INSERT WITH CHECK (invitation_is_published(invitation_id));

-- ── guest_messages ──────────────────────────────────────────────────────────
ALTER TABLE guest_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_messages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messages_owner_select  ON guest_messages;
DROP POLICY IF EXISTS messages_public_select ON guest_messages;
DROP POLICY IF EXISTS messages_public_insert ON guest_messages;
DROP POLICY IF EXISTS messages_owner_update  ON guest_messages;
CREATE POLICY messages_owner_select  ON guest_messages FOR SELECT USING (current_user_owns_invitation(invitation_id));
CREATE POLICY messages_public_select ON guest_messages FOR SELECT USING (is_visible = true AND invitation_is_published(invitation_id));
CREATE POLICY messages_public_insert ON guest_messages FOR INSERT WITH CHECK (invitation_is_published(invitation_id));
CREATE POLICY messages_owner_update  ON guest_messages FOR UPDATE USING (current_user_owns_invitation(invitation_id));

-- ── gift_accounts ───────────────────────────────────────────────────────────
ALTER TABLE gift_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_accounts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gifts_owner        ON gift_accounts;
DROP POLICY IF EXISTS gifts_public_select ON gift_accounts;
CREATE POLICY gifts_owner         ON gift_accounts FOR ALL    USING (current_user_owns_invitation(invitation_id));
CREATE POLICY gifts_public_select ON gift_accounts FOR SELECT USING (invitation_is_published(invitation_id));

-- ── gift_confirmations ──────────────────────────────────────────────────────
ALTER TABLE gift_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_confirmations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gift_confs_owner_select  ON gift_confirmations;
DROP POLICY IF EXISTS gift_confs_public_insert ON gift_confirmations;
CREATE POLICY gift_confs_owner_select  ON gift_confirmations FOR SELECT USING (current_user_owns_invitation(invitation_id));
CREATE POLICY gift_confs_public_insert ON gift_confirmations FOR INSERT WITH CHECK (invitation_is_published(invitation_id));
