-- Update ideas status check constraint to include research-generated and research-imported
-- Drop the old constraint
ALTER TABLE ideas
DROP CONSTRAINT ideas_status_check;
-- Add the new constraint with additional allowed statuses
ALTER TABLE ideas
ADD CONSTRAINT ideas_status_check CHECK (
  status = ANY (ARRAY[
    'new'::text,
    'selected'::text,
    'researched'::text,
    'research-generated'::text,
    'research-imported'::text,
    'generated'::text,
    'published'::text,
    'archived'::text
  ])
);
