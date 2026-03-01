-- Update reviews table to link with orders and add constraints
ALTER TABLE IF EXISTS public.reviews 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;

-- Ensure constraints and types
ALTER TABLE public.reviews
ALTER COLUMN rating SET NOT NULL,
ALTER COLUMN product_id SET NOT NULL,
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN order_id SET NOT NULL;

-- Add check constraint for rating
ALTER TABLE public.reviews
ADD CONSTRAINT reviews_rating_check 
CHECK (rating >= 1 AND rating <= 5);

-- Enable RLS if not enabled
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews" 
ON public.reviews FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" 
ON public.reviews FOR UPDATE 
USING (auth.uid() = user_id);
