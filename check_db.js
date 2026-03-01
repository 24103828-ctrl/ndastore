import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jwnncxvwusmomdozlysl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bm5jeHZ3dXNtb21kb3pseXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjI3NjAsImV4cCI6MjA4NTIzODc2MH0.f4TI7qr1Hn-kZOvC_T8MuVo-nusAnVjCi3ClNWPWs5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data: products } = await supabase.from('products').select('id, name, category_id, category:categories(id, name)');
    console.log("Products:", JSON.stringify(products, null, 2));
}

checkData();
