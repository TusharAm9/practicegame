const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(l => l.includes('=')).map(l => l.split('=').map(s => s.trim())));

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubjects() {
    const { data, error } = await supabase
        .from('ai_tests')
        .select('subject, title')
        .limit(100);

    if (error) {
        console.error(error);
        return;
    }

    const subjects = [...new Set(data.map(d => d.subject))];
    console.log('Unique Subjects found:', subjects);
    
    // Check for math-related titles in mislabeled subjects
    const potentialMath = data.filter(d => 
        (d.title.toLowerCase().includes('math') || d.title.toLowerCase().includes('quant')) && 
        d.subject !== 'Math'
    );
    
    if (potentialMath.length > 0) {
        console.log('Found potential mislabeled math tests:', potentialMath.map(p => p.title));
    }
}

checkSubjects();
