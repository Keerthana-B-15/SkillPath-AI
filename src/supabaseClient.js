import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uchrywxwbllkpwgcqeje.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjaHJ5d3h3Ymxsa3B3Z2NxZWplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwODk2NDcsImV4cCI6MjA4NDY2NTY0N30.8IH6FSB6aMQhF7o7HG9yPwNoiagg0askPaBZsdA7QeM'
);

export default supabase;
