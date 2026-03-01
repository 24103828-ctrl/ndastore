const { Client } = require('pg');

const connectionString = 'postgresql://postgres:q5Kwpw!ZpM33T+M@db.jwnncxvwusmomdozlysl.supabase.co:5432/postgres';

const sql = `
-- Thêm khóa ngoại giữa reviews.user_id và profiles.id
ALTER TABLE reviews 
ADD CONSTRAINT reviews_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- Làm mới bộ nhớ đệm PostgREST
NOTIFY pgrst, 'reload schema';
`;

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to database successfully.');
        await client.query(sql);
        console.log('SQL executed successfully! Foreign key added between reviews and profiles.');
    } catch (err) {
        console.error('Error executing SQL:', err);
        if (err.message.includes('already exists')) {
            console.log('Constraint already exists. Checking schema...');
        }
    } finally {
        await client.end();
    }
}

run();
