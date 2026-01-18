-- ============================================================================
-- File: 007_seed_data.sql
-- Purpose: Insert dummy data for testing database relations and functionality
-- ============================================================================

-- ============================================================================
-- INSERT USERS
-- ============================================================================

INSERT INTO users (id, username, email, password_hash, lvl, xp_points) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'alice_focus', 'alice@focusguard.com', '$2b$12$dummy.hash.for.alice', 5, 1250),
    ('b2222222-2222-2222-2222-222222222222', 'bob_study', 'bob@focusguard.com', '$2b$12$dummy.hash.for.bob', 3, 450),
    ('c3333333-3333-3333-3333-333333333333', 'charlie_dev', 'charlie@focusguard.com', '$2b$12$dummy.hash.for.charlie', 8, 3200),
    ('d4444444-4444-4444-4444-444444444444', 'diana_code', 'diana@focusguard.com', '$2b$12$dummy.hash.for.diana', 2, 180),
    ('e5555555-5555-5555-5555-555555555555', 'eve_learn', 'eve@focusguard.com', '$2b$12$dummy.hash.for.eve', 10, 5000);

-- ============================================================================
-- INSERT SESSIONS
-- ============================================================================

-- Alice's sessions
INSERT INTO sessions (id, user_id, completed, created_at) VALUES
    ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1111111-1111-1111-1111-111111111111', TRUE, NOW() - INTERVAL '5 days'),
    ('22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1111111-1111-1111-1111-111111111111', TRUE, NOW() - INTERVAL '4 days'),
    ('33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1111111-1111-1111-1111-111111111111', TRUE, NOW() - INTERVAL '3 days'),
    ('44444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1111111-1111-1111-1111-111111111111', FALSE, NOW() - INTERVAL '1 day');

-- Bob's sessions
INSERT INTO sessions (id, user_id, completed, created_at) VALUES
    ('11111111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b2222222-2222-2222-2222-222222222222', TRUE, NOW() - INTERVAL '3 days'),
    ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b2222222-2222-2222-2222-222222222222', TRUE, NOW() - INTERVAL '2 days');

-- Charlie's sessions
INSERT INTO sessions (id, user_id, completed, created_at) VALUES
    ('11111111-cccc-cccc-cccc-cccccccccccc', 'c3333333-3333-3333-3333-333333333333', TRUE, NOW() - INTERVAL '7 days'),
    ('22222222-cccc-cccc-cccc-cccccccccccc', 'c3333333-3333-3333-3333-333333333333', TRUE, NOW() - INTERVAL '6 days'),
    ('33333333-cccc-cccc-cccc-cccccccccccc', 'c3333333-3333-3333-3333-333333333333', TRUE, NOW() - INTERVAL '5 days'),
    ('44444444-cccc-cccc-cccc-cccccccccccc', 'c3333333-3333-3333-3333-333333333333', TRUE, NOW() - INTERVAL '4 days'),
    ('55555555-cccc-cccc-cccc-cccccccccccc', 'c3333333-3333-3333-3333-333333333333', TRUE, NOW() - INTERVAL '3 days');

-- Diana's sessions
INSERT INTO sessions (id, user_id, completed, created_at) VALUES
    ('11111111-dddd-dddd-dddd-dddddddddddd', 'd4444444-4444-4444-4444-444444444444', TRUE, NOW() - INTERVAL '1 day');

-- Eve's sessions
INSERT INTO sessions (id, user_id, completed, created_at) VALUES
    ('11111111-eeee-eeee-eeee-eeeeeeeeeeee', 'e5555555-5555-5555-5555-555555555555', TRUE, NOW() - INTERVAL '10 days'),
    ('22222222-eeee-eeee-eeee-eeeeeeeeeeee', 'e5555555-5555-5555-5555-555555555555', TRUE, NOW() - INTERVAL '9 days'),
    ('33333333-eeee-eeee-eeee-eeeeeeeeeeee', 'e5555555-5555-5555-5555-555555555555', TRUE, NOW() - INTERVAL '8 days'),
    ('44444444-eeee-eeee-eeee-eeeeeeeeeeee', 'e5555555-5555-5555-5555-555555555555', TRUE, NOW() - INTERVAL '7 days'),
    ('55555555-eeee-eeee-eeee-eeeeeeeeeeee', 'e5555555-5555-5555-5555-555555555555', TRUE, NOW() - INTERVAL '6 days'),
    ('66666666-eeee-eeee-eeee-eeeeeeeeeeee', 'e5555555-5555-5555-5555-555555555555', TRUE, NOW() - INTERVAL '5 days'),
    ('77777777-eeee-eeee-eeee-eeeeeeeeeeee', 'e5555555-5555-5555-5555-555555555555', TRUE, NOW() - INTERVAL '4 days');

-- ============================================================================
-- INSERT GARDEN (1-to-1 relationship with sessions)
-- ============================================================================

-- Alice's gardens
INSERT INTO garden (user_id, session_id, plant_num, plant_type, growth_stage, total_plants) VALUES
    ('a1111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'Rose', 5, 1),
    ('a1111111-1111-1111-1111-111111111111', '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'Tulip', 5, 2),
    ('a1111111-1111-1111-1111-111111111111', '33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'Sunflower', 5, 3),
    ('a1111111-1111-1111-1111-111111111111', '44444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 'Daisy', 2, 4);

-- Bob's gardens
INSERT INTO garden (user_id, session_id, plant_num, plant_type, growth_stage, total_plants) VALUES
    ('b2222222-2222-2222-2222-222222222222', '11111111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 'Cactus', 5, 1),
    ('b2222222-2222-2222-2222-222222222222', '22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, 'Fern', 5, 2);

-- Charlie's gardens
INSERT INTO garden (user_id, session_id, plant_num, plant_type, growth_stage, total_plants) VALUES
    ('c3333333-3333-3333-3333-333333333333', '11111111-cccc-cccc-cccc-cccccccccccc', 1, 'Bamboo', 5, 1),
    ('c3333333-3333-3333-3333-333333333333', '22222222-cccc-cccc-cccc-cccccccccccc', 2, 'Orchid', 5, 2),
    ('c3333333-3333-3333-3333-333333333333', '33333333-cccc-cccc-cccc-cccccccccccc', 3, 'Lily', 5, 3),
    ('c3333333-3333-3333-3333-333333333333', '44444444-cccc-cccc-cccc-cccccccccccc', 4, 'Lavender', 5, 4),
    ('c3333333-3333-3333-3333-333333333333', '55555555-cccc-cccc-cccc-cccccccccccc', 5, 'Mint', 5, 5);

-- Diana's gardens
INSERT INTO garden (user_id, session_id, plant_num, plant_type, growth_stage, total_plants) VALUES
    ('d4444444-4444-4444-4444-444444444444', '11111111-dddd-dddd-dddd-dddddddddddd', 1, 'Basil', 5, 1);

-- Eve's gardens
INSERT INTO garden (user_id, session_id, plant_num, plant_type, growth_stage, total_plants) VALUES
    ('e5555555-5555-5555-5555-555555555555', '11111111-eeee-eeee-eeee-eeeeeeeeeeee', 1, 'Cherry Blossom', 5, 1),
    ('e5555555-5555-5555-5555-555555555555', '22222222-eeee-eeee-eeee-eeeeeeeeeeee', 2, 'Maple', 5, 2),
    ('e5555555-5555-5555-5555-555555555555', '33333333-eeee-eeee-eeee-eeeeeeeeeeee', 3, 'Oak', 5, 3),
    ('e5555555-5555-5555-5555-555555555555', '44444444-eeee-eeee-eeee-eeeeeeeeeeee', 4, 'Pine', 5, 4),
    ('e5555555-5555-5555-5555-555555555555', '55555555-eeee-eeee-eeee-eeeeeeeeeeee', 5, 'Willow', 5, 5),
    ('e5555555-5555-5555-5555-555555555555', '66666666-eeee-eeee-eeee-eeeeeeeeeeee', 6, 'Birch', 5, 6),
    ('e5555555-5555-5555-5555-555555555555', '77777777-eeee-eeee-eeee-eeeeeeeeeeee', 7, 'Elm', 5, 7);

-- ============================================================================
-- INSERT USER_STATS (1-to-1 relationship with users)
-- ============================================================================

INSERT INTO user_stats (user_id, total_focus_min, total_sessions, current_streak, best_streak) VALUES
    ('a1111111-1111-1111-1111-111111111111', 180, 3, 3, 5),
    ('b2222222-2222-2222-2222-222222222222', 120, 2, 2, 2),
    ('c3333333-3333-3333-3333-333333333333', 300, 5, 5, 7),
    ('d4444444-4444-4444-4444-444444444444', 60, 1, 1, 1),
    ('e5555555-5555-5555-5555-555555555555', 420, 7, 7, 10);

-- ============================================================================
-- VERIFICATION COMMENTS
-- ============================================================================

COMMENT ON TABLE sessions IS 'Stores focus sessions created by users - Now contains 17 dummy sessions';
COMMENT ON TABLE garden IS 'Stores virtual garden/plant data for each focus session - Now contains 17 dummy garden entries';
COMMENT ON TABLE user_stats IS 'Stores aggregated statistics for each user (1-to-1 with users table) - Now contains 5 user stat records';
COMMENT ON TABLE users IS 'Stores user authentication and profile information including gamification data - Now contains 5 dummy users';
