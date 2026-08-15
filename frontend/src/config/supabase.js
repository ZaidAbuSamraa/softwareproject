import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dycchslrqbnpgfpjdtgo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5Y2Noc2xycWJucGdmcGpkdGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTU5OTEsImV4cCI6MjEwMTk3MTk5MX0.dJnpAJSkEL1UVVw9Tt7da_YmmyZUFrQ_euxQRCm34bE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
