import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jwnncxvwusmomdozlysl.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bm5jeHZ3dXNtb21kb3pseXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY2Mjc2MCwiZXhwIjoyMDg1MjM4NzYwfQ.57uLNZ6q51A-Kpi9rjLeF-6IfwzO3Gm-Yu7OYxtFbaw';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function test() {
    console.log("Testing connection with service_role...");
    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Success! Data:", data);

        // Let's try to check for username column
        const { data: cols, error: colErr } = await supabase.from('profiles').select('username').limit(1);
        if (colErr) {
            console.log("Username column seems MISSING:", colErr.message);
        } else {
            console.log("Username column is PRESENT.");
        }
    }
}

test();
