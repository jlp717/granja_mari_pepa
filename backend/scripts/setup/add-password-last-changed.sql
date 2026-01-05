-- =====================================================
-- ADD PASSWORD_LAST_CHANGED COLUMN
-- Tracks when password was last changed for 30-day cooldown
-- =====================================================

-- Add column to track last password change
ALTER TABLE JAVIER.CUSTOMER_CREDENTIALS 
ADD COLUMN PASSWORD_LAST_CHANGED TIMESTAMP DEFAULT NULL;

LABEL ON COLUMN JAVIER.CUSTOMER_CREDENTIALS.PASSWORD_LAST_CHANGED 
IS 'Timestamp of last password change (for 30-day cooldown)';

-- Verify the change
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM QSYS2.SYSCOLUMNS
WHERE TABLE_SCHEMA = 'JAVIER' 
  AND TABLE_NAME = 'CUSTOMER_CREDENTIALS'
  AND COLUMN_NAME = 'PASSWORD_LAST_CHANGED';

-- =====================================================
-- USAGE NOTES:
-- =====================================================
-- Updated automatically when password is changed
-- Used to enforce 30-day cooldown between password changes
-- NULL means password has never been changed (legacy users)
-- =====================================================
