const { Client } = require('pg');

const connectionString = 'postgresql://postgres:q5Kwpw!ZpM33T+M@db.jwnncxvwusmomdozlysl.supabase.co:5432/postgres';

const sql = `
-- Cấp quyền realtime cho bảng reviews
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'reviews'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
    END IF;
END $$;

-- Đảm bảo có thể nhận diện thay đổi đầy đủ (hữu ích cho UPDATE/DELETE)
ALTER TABLE reviews REPLICA IDENTITY FULL;

-- Làm mới bộ nhớ đệm
NOTIFY pgrst, 'reload schema';
`;

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to database successfully.');
        await client.query(sql);
        console.log('SQL executed successfully! Realtime enabled for reviews table.');
    } catch (err) {
        console.error('Error executing SQL:', err);
    } finally {
        await client.end();
    }
}

run();
