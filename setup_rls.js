const { Client } = require('pg');

const connectionString = 'postgresql://postgres:q5Kwpw!ZpM33T+M@db.jwnncxvwusmomdozlysl.supabase.co:5432/postgres';

const sql = `
-- 1. Cấp quyền xem cho mọi người trên bảng reviews
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Reviews are viewable by everyone') THEN
        CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
    END IF;
END $$;

-- 2. Cho phép người dùng đã đăng nhập có thể gửi đánh giá
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can insert their own reviews') THEN
        CREATE POLICY "Users can insert their own reviews" ON reviews FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 3. Cấp quyền xem bảng profiles (để hiển thị tên người đánh giá)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone') THEN
        CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
    END IF;
END $$;

-- 4. Đảm bảo bảng reviews có trong realtime publication (đã làm ở bước trước, làm lại cho chắc)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'reviews'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
`;

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to database successfully.');
        await client.query(sql);
        console.log('SQL executed successfully! RLS Policies established.');
    } catch (err) {
        console.error('Error executing SQL:', err);
    } finally {
        await client.end();
    }
}

run();
