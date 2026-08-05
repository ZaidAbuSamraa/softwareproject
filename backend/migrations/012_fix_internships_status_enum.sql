-- Fix Internships.status / work_mode enum mismatches
--
-- status: table was created with ENUM('active','inactive','closed') DEFAULT 'active',
-- but the application (routes/internship.js, models/Internship.js, matching.js,
-- frontend dashboards) reads/writes 'open' | 'closed' | 'pending'.
--
-- work_mode: table only allowed ENUM('on-site','remote','hybrid'), but the
-- Company dashboard's "Work Mode" select also sends 'online'.
--
-- Both mismatches caused "Data truncated for column '...'" errors (MySQL
-- strict mode) when creating an internship.

-- 1. Temporarily widen status so old and new values coexist
ALTER TABLE Internships
MODIFY COLUMN status ENUM('active','inactive','closed','open','pending') DEFAULT 'open';

-- 2. Migrate existing data to the values the app actually uses
UPDATE Internships SET status = 'open' WHERE status = 'active';
UPDATE Internships SET status = 'closed' WHERE status = 'inactive';

-- 3. Narrow status to the final set
ALTER TABLE Internships
MODIFY COLUMN status ENUM('open','closed','pending') DEFAULT 'open';

-- 4. Add the missing 'online' work mode (no data migration needed, additive only)
ALTER TABLE Internships
MODIFY COLUMN work_mode ENUM('on-site','remote','hybrid','online') DEFAULT 'on-site';

-- Verify
SELECT 'Internships.status column:' as '';
SHOW COLUMNS FROM Internships LIKE 'status';
SELECT status, COUNT(*) AS count FROM Internships GROUP BY status;

SELECT 'Internships.work_mode column:' as '';
SHOW COLUMNS FROM Internships LIKE 'work_mode';
SELECT work_mode, COUNT(*) AS count FROM Internships GROUP BY work_mode;
