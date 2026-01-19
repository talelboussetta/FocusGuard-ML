-- ============================================================================
-- File: 004_garden.sql
-- Purpose: Create garden table for virtual garden/plant management per session
-- ============================================================================

CREATE TABLE garden (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys
    user_id UUID NOT NULL,
    session_id UUID NOT NULL,
    
    -- Garden/plant data
    plant_num INTEGER NOT NULL,
    plant_type VARCHAR(50) NOT NULL,
    growth_stage INTEGER NOT NULL,
    total_plants INTEGER NOT NULL,
    
    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT garden_user_fk FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT garden_session_fk FOREIGN KEY (session_id) 
        REFERENCES sessions(id) ON DELETE CASCADE,
    
    -- Unique constraint to enforce 1-to-1 relationship with session
    CONSTRAINT garden_session_unique UNIQUE (session_id),
    
    -- Check constraints
    CONSTRAINT garden_plant_num_positive CHECK (plant_num >= 0),
    CONSTRAINT garden_growth_stage_positive CHECK (growth_stage >= 0),
    CONSTRAINT garden_total_plants_positive CHECK (total_plants >= 0)
);

-- Add comment for documentation
COMMENT ON TABLE garden IS 'Stores virtual garden/plant data for each focus session';
COMMENT ON COLUMN garden.id IS 'Unique garden entry identifier (UUID)';
COMMENT ON COLUMN garden.user_id IS 'Reference to the user who owns this garden entry';
COMMENT ON COLUMN garden.session_id IS 'Reference to the associated session (1-to-1 relationship)';
COMMENT ON COLUMN garden.plant_num IS 'Number identifier of the plant';
COMMENT ON COLUMN garden.plant_type IS 'Type/species of the plant';
COMMENT ON COLUMN garden.growth_stage IS 'Current growth stage of the plant';
COMMENT ON COLUMN garden.total_plants IS 'Total number of plants in this garden entry';
