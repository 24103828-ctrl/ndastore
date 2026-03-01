-- Add username column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Refresh schema cache if possible (though push usually handled by PostgREST restart/reload)
NOTIFY pgrst, 'reload schema';
