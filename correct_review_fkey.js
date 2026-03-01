const { Client } = require('pg');

const connectionString = 'postgresql://postgres:q5Kwpw!ZpM33T+M@db.jwnncxvwusmomdozlysl.supabase.co:5432/postgres';

const sql = `
-- 1. Xóa khóa ngoại cũ (đang trỏ vào auth.users)
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

-- 2. Thêm khóa ngoại mới (trỏ vào public.profiles)
ALTER TABLE reviews 
ADD CONSTRAINT reviews_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- 3. Làm mới bộ nhớ đệm
NOTIFY pgrst, 'reload schema';
`;

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to database successfully.');
        await client.query(sql);
        console.log('SQL executed successfully! Reviews successfully linked to Profiles.');
    } catch (err) {
        console.error('Error executing SQL:', err);
    } finally {
        await client.end();
    }
}

run();
