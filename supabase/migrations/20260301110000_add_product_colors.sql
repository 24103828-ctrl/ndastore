-- Migration to add color support
-- Add colors array to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors jsonb DEFAULT '[]'::jsonb;

-- Add selected color to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color text;
