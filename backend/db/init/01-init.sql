-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Set up proper permissions
ALTER USER elfai SET search_path TO public;

-- Optimize for Django
ALTER SYSTEM SET timezone TO 'UTC';

-- Set proper encoding for new databases
ALTER SYSTEM SET client_encoding TO 'UTF8';

-- Create extensions schema and grant usage
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO elfai;

-- Move extensions to extensions schema
ALTER EXTENSION pg_stat_statements SET SCHEMA extensions;

-- Grant necessary permissions to the application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO elfai;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO elfai;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO elfai;

-- Create event trigger to automatically grant permissions on new objects
CREATE OR REPLACE FUNCTION public.grant_elfai_access()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Grant rights on new tables
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO elfai;
    -- Grant rights on new sequences
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO elfai;
    -- Grant rights on new functions
    GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO elfai;
END;
$$;

CREATE EVENT TRIGGER grant_elfai_access_trigger
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE', 'CREATE SEQUENCE', 'CREATE FUNCTION')
EXECUTE FUNCTION public.grant_elfai_access(); 