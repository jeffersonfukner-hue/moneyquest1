
-- Add rotation columns to shop_items
ALTER TABLE shop_items 
ADD COLUMN IF NOT EXISTS rotation_week INTEGER CHECK (rotation_week >= 1 AND rotation_week <= 8),
ADD COLUMN IF NOT EXISTS is_limited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stock_total INTEGER,
ADD COLUMN IF NOT EXISTS stock_remaining INTEGER;

-- Create index for faster rotation queries
CREATE INDEX IF NOT EXISTS idx_shop_items_rotation_week ON shop_items(rotation_week);

COMMENT ON COLUMN shop_items.rotation_week IS 'Week 1-8 for rotation items, NULL for always available';
COMMENT ON COLUMN shop_items.is_limited IS 'Limited edition items that can sell out';
COMMENT ON COLUMN shop_items.stock_total IS 'Total stock for limited items';
COMMENT ON COLUMN shop_items.stock_remaining IS 'Remaining stock for limited items';
