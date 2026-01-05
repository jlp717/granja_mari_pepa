-- =====================================================
-- ADD PASSWORD_WARNING_DISMISSALS COLUMN
-- Tracks how many times user dismissed password change warning
-- After 2 dismissals, we stop showing the warning
-- =====================================================

-- Add column to track dismissals
ALTER TABLE JAVIER.CUSTOMER_CREDENTIALS 
ADD COLUMN PASSWORD_WARNING_DISMISSALS INTEGER DEFAULT 0;

LABEL ON COLUMN JAVIER.CUSTOMER_CREDENTIALS.PASSWORD_WARNING_DISMISSALS 
IS 'Number of times user dismissed legacy password warning (0-2)';

-- Create index for quick lookups
CREATE INDEX JAVIER.IDX_PWD_WARNING_DISMISSALS 
ON JAVIER.CUSTOMER_CREDENTIALS(PASSWORD_WARNING_DISMISSALS);

-- Verify the change
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM QSYS2.SYSCOLUMNS
WHERE TABLE_SCHEMA = 'JAVIER' 
  AND TABLE_NAME = 'CUSTOMER_CREDENTIALS'
  AND COLUMN_NAME = 'PASSWORD_WARNING_DISMISSALS';

-- =====================================================
-- USAGE NOTES:
-- =====================================================
-- When user dismisses warning: INCREMENT by 1
-- When user changes password: RESET to 0
-- Stop showing warning when: >= 2
-- =====================================================
