-- =====================================================
-- SCRIPT DE LIMPIEZA COMPLETA - USUARIO TEST_JAVIER
-- =====================================================
-- 
-- Propósito: Eliminar TODOS los datos de login, contraseña y 
--            actividad del usuario TEST_JAVIER para hacer una 
--            demo limpia para tu manager
--
-- IMPORTANTE: Este script NO elimina al cliente de la base de
--             datos principal (DSEDAC.CLI), solo limpia los
--             datos de seguridad y autenticación.
--
-- Fecha: 2025-12-17
-- =====================================================

-- =====================================================
-- PASO 1: Verificar que el usuario existe
-- =====================================================
SELECT 
    CUSTOMER_CODE,
    FULL_NAME,
    IS_LEGACY_PASSWORD,
    PASSWORD_ALGORITHM,
    ACCOUNT_STATUS,
    LAST_LOGIN_AT,
    FAILED_LOGIN_ATTEMPTS
FROM JAVIER.CUSTOMER_CREDENTIALS
WHERE CUSTOMER_CODE = 'TEST_JAVIER';

-- Debería mostrar algo como:
-- CUSTOMER_CODE | FULL_NAME | IS_LEGACY_PASSWORD | PASSWORD_ALGORITHM | ACCOUNT_STATUS | ...
-- TEST_JAVIER   | ...       | 0/1                | BCRYPT/LEGACY      | ACTIVE         | ...


-- =====================================================
-- PASO 2: Ver qué datos se van a eliminar (OPCIONAL)
-- =====================================================

-- Ver intentos de login
SELECT COUNT(*) AS TOTAL_LOGIN_ATTEMPTS
FROM JAVIER.LOGIN_ATTEMPTS
WHERE CUSTOMER_CODE = 'TEST_JAVIER' OR CUSTOMER_ID = (
    SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_CODE = 'TEST_JAVIER'
);

-- Ver tokens de refresh
SELECT COUNT(*) AS TOTAL_REFRESH_TOKENS
FROM JAVIER.REFRESH_TOKENS
WHERE CUSTOMER_ID = (
    SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_CODE = 'TEST_JAVIER'
);

-- Ver historial de contraseñas
SELECT COUNT(*) AS TOTAL_PASSWORD_HISTORY
FROM JAVIER.CUSTOMER_PASSWORDS
WHERE CUSTOMER_ID = (
    SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_CODE = 'TEST_JAVIER'
);

-- Ver auditoría de seguridad
SELECT COUNT(*) AS TOTAL_SECURITY_AUDIT
FROM JAVIER.SECURITY_AUDIT
WHERE CUSTOMER_ID = (
    SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_CODE = 'TEST_JAVIER'
);


-- =====================================================
-- PASO 3: LIMPIEZA COMPLETA DE DATOS
-- =====================================================
-- ⚠️ ADVERTENCIA: Esta acción NO se puede deshacer
-- =====================================================

-- 3.1 - Eliminar intentos de login
DELETE FROM JAVIER.LOGIN_ATTEMPTS
WHERE CUSTOMER_CODE = 'TEST_JAVIER' OR CUSTOMER_ID = (
    SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_CODE = 'TEST_JAVIER'
);

-- 3.2 - Eliminar refresh tokens (sesiones activas)
DELETE FROM JAVIER.REFRESH_TOKENS
WHERE CUSTOMER_ID = (
    SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_CODE = 'TEST_JAVIER'
);

-- 3.3 - Eliminar historial de contraseñas
DELETE FROM JAVIER.CUSTOMER_PASSWORDS
WHERE CUSTOMER_ID = (
    SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_CODE = 'TEST_JAVIER'
);

-- 3.4 - Eliminar auditoría de seguridad
DELETE FROM JAVIER.SECURITY_AUDIT
WHERE CUSTOMER_ID = (
    SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_CODE = 'TEST_JAVIER'
);

-- 3.5 - Resetear el registro de credenciales a estado LEGACY inicial
UPDATE JAVIER.CUSTOMER_CREDENTIALS
SET 
    PASSWORD_HASH = 'LEGACY_' || (SELECT NIF FROM DSEDAC.CLI WHERE TRIM(CODIGO) = 'TEST_JAVIER'),
    PASSWORD_ALGORITHM = 'LEGACY',
    IS_LEGACY_PASSWORD = '1',
    FAILED_LOGIN_ATTEMPTS = 0,
    ACCOUNT_STATUS = 'ACTIVE',
    ACCOUNT_LOCKED_UNTIL = NULL,
    LAST_PASSWORD_CHANGE = NULL,
    LAST_ALLOWED_PASSWORD_CHANGE = NULL,
    PASSWORD_CHANGE_COUNT = 0,
    LAST_LOGIN_AT = NULL,
    LAST_LOGIN_IP = NULL,
    LAST_LOGIN_USER_AGENT = NULL,
    LAST_FAILED_LOGIN = NULL,
    UPDATED_AT = CURRENT_TIMESTAMP
WHERE CUSTOMER_CODE = 'TEST_JAVIER';


-- =====================================================
-- PASO 4: Verificar que la limpieza fue exitosa
-- =====================================================

-- Verificar que no quedan registros
SELECT 
    'LOGIN_ATTEMPTS' AS TABLA,
    COUNT(*) AS REGISTROS_RESTANTES
FROM JAVIER.LOGIN_ATTEMPTS
WHERE CUSTOMER_CODE = 'TEST_JAVIER' OR CUSTOMER_ID = (
    SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_CODE = 'TEST_JAVIER'
)

UNION ALL

SELECT 
    'REFRESH_TOKENS' AS TABLA,
    COUNT(*) AS REGISTROS_RESTANTES
FROM JAVIER.REFRESH_TOKENS
WHERE CUSTOMER_ID = (
    SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_CODE = 'TEST_JAVIER'
)

UNION ALL

SELECT 
    'CUSTOMER_PASSWORDS' AS TABLA,
    COUNT(*) AS REGISTROS_RESTANTES
FROM JAVIER.CUSTOMER_PASSWORDS
WHERE CUSTOMER_ID = (
    SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_CODE = 'TEST_JAVIER'
)

UNION ALL

SELECT 
    'SECURITY_AUDIT' AS TABLA,
    COUNT(*) AS REGISTROS_RESTANTES
FROM JAVIER.SECURITY_AUDIT
WHERE CUSTOMER_ID = (
    SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_CODE = 'TEST_JAVIER'
);

-- Todas las tablas deberían mostrar 0 registros restantes


-- Verificar el estado de las credenciales
SELECT 
    CUSTOMER_CODE,
    PASSWORD_ALGORITHM,
    IS_LEGACY_PASSWORD,
    FAILED_LOGIN_ATTEMPTS,
    ACCOUNT_STATUS,
    LAST_LOGIN_AT,
    PASSWORD_CHANGE_COUNT
FROM JAVIER.CUSTOMER_CREDENTIALS
WHERE CUSTOMER_CODE = 'TEST_JAVIER';

-- Debería mostrar:
-- CUSTOMER_CODE | PASSWORD_ALGORITHM | IS_LEGACY_PASSWORD | FAILED_LOGIN_ATTEMPTS | ACCOUNT_STATUS | LAST_LOGIN_AT | PASSWORD_CHANGE_COUNT
-- TEST_JAVIER   | LEGACY             | 1                  | 0                     | ACTIVE         | NULL          | 0


-- =====================================================
-- PASO 5: Registrar la limpieza en auditoría
-- =====================================================
INSERT INTO JAVIER.SECURITY_AUDIT (
    CUSTOMER_ID,
    EVENT_TYPE,
    EVENT_CATEGORY,
    SEVERITY,
    EVENT_DESCRIPTION,
    IP_ADDRESS,
    USER_AGENT,
    RESULT
) VALUES (
    (SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_CODE = 'TEST_JAVIER'),
    'DATA_CLEANUP',
    'ADMINISTRATION',
    'INFO',
    'Complete data cleanup performed for demo purposes. User reset to legacy state.',
    NULL,
    'SQL Script - cleanup-test-javier.sql',
    'SUCCESS'
);


-- =====================================================
-- RESUMEN DE LO QUE HACE ESTE SCRIPT
-- =====================================================
-- 
-- ✅ Elimina TODOS los intentos de login (exitosos y fallidos)
-- ✅ Elimina TODOS los refresh tokens (sesiones)
-- ✅ Elimina TODO el historial de contraseñas
-- ✅ Elimina TODA la auditoría de seguridad previa
-- ✅ Resetea la contraseña a estado LEGACY (NIF)
-- ✅ Resetea el contador de intentos fallidos a 0
-- ✅ Resetea el contador de cambios de contraseña a 0
-- ✅ Limpia las fechas de último login
-- ✅ Desbloquea la cuenta si estaba bloqueada
-- 
-- RESULTADO: El usuario TEST_JAVIER queda como si fuera la
--            PRIMERA VEZ que va a hacer login, con contraseña
--            NIF, sin historial, listo para tu demo.
-- 
-- =====================================================
-- INSTRUCCIONES PARA TU DEMO
-- =====================================================
-- 
-- Después de ejecutar este script:
-- 
-- 1. Ve a la aplicación web
-- 2. Haz login con TEST_JAVIER usando su NIF como contraseña
-- 3. Verás el modal "Tu cuenta necesita protección"
-- 4. Puedes demostrar:
--    - El flujo completo de cambio de contraseña
--    - La advertencia de seguridad
--    - El modal de éxito con crack time
--    - Que todo funciona desde cero
-- 
-- =====================================================
