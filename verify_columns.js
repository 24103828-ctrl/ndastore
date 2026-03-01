import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jwnncxvwusmomdozlysl.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bm5jeHZ3dXNtb21kb3pseXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY2Mjc2MCwiZXhwIjoyMDg1MjM4NzYwfQ.57uLNZ6q51A-Kpi9rjLeF-6IfwzO3Gm-Yu7OYxtFbaw';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function test() {
    console.log("Checking reviews table for order_id column...");
    const { data, error } = await supabase.from('reviews').select('id, order_id').limit(1);

    if (error) {
        console.log("Error or column missing:", error.message);
    } else {
        console.log("Success! order_id column EXISTS.");
    }

    console.log("Checking profiles table for username column...");
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id, username').limit(1);
    if (pError) {
        console.log("Error or column missing:", pError.message);
    } else {
        console.log("Success! username column EXISTS.");
    }
}

test();
