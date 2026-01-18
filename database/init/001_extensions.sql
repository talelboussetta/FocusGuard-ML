-- ============================================================================
-- File: 001_extensions.sql
-- Purpose: Enable PostgreSQL extensions required for the FocusGuard schema
-- ============================================================================

-- Enable pgcrypto extension for UUID generation (gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS pgcrypto;
