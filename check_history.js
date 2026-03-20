import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jwnncxvwusmomdozlysl.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bm5jeHZ3dXNtb21kb3pseXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY2Mjc2MCwiZXhwIjoyMDg1MjM4NzYwfQ.57uLNZ6q51A-Kpi9rjLeF-6IfwzO3Gm-Yu7OYxtFbaw';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkHistory() {
    console.log("Checking n8n_chat_histories table...");
    try {
        const { data, error } = await supabase.from('n8n_chat_histories').select('*').limit(3);

        if (error) {
            console.error("Error fetching history:", error.message);
        } else {
            console.log("Success! Sample data:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

checkHistory();
