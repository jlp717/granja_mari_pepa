-- ====================================================================
-- SCRIPT: Agregar Columnas para Reset de Contraseña
-- Fecha: 2025-11-13
-- Descripción: Agrega columnas necesarias para el sistema de
--              recuperación de contraseña en la tabla CLI_AUTH
-- ====================================================================

-- Verificar si la tabla CLI_AUTH existe
-- Si no existe, crearla primero

-- Agregar columna para código de reset
ALTER TABLE DSEDAC.CLI_AUTH
ADD COLUMN RESET_CODE VARCHAR(10);

-- Agregar columna para fecha de expiración del código
ALTER TABLE DSEDAC.CLI_AUTH
ADD COLUMN RESET_CODE_EXPIRES TIMESTAMP;

-- Agregar columna para contador de intentos fallidos
ALTER TABLE DSEDAC.CLI_AUTH
ADD COLUMN RESET_ATTEMPTS INTEGER DEFAULT 0;

-- Agregar columna para marcar si el código ya fue usado
ALTER TABLE DSEDAC.CLI_AUTH
ADD COLUMN RESET_CODE_USED CHAR(1) DEFAULT 'N';

-- Agregar columna para fecha del último cambio de contraseña
ALTER TABLE DSEDAC.CLI_AUTH
ADD COLUMN LAST_PASSWORD_CHANGE TIMESTAMP;

-- Comentarios en las columnas
COMMENT ON COLUMN DSEDAC.CLI_AUTH.RESET_CODE IS
  'Código de verificación de 6 dígitos para reset de contraseña';

COMMENT ON COLUMN DSEDAC.CLI_AUTH.RESET_CODE_EXPIRES IS
  'Fecha y hora de expiración del código (15 minutos)';

COMMENT ON COLUMN DSEDAC.CLI_AUTH.RESET_ATTEMPTS IS
  'Contador de intentos fallidos de verificación (máx 3)';

COMMENT ON COLUMN DSEDAC.CLI_AUTH.RESET_CODE_USED IS
  'Indica si el código ya fue utilizado (Y/N)';

COMMENT ON COLUMN DSEDAC.CLI_AUTH.LAST_PASSWORD_CHANGE IS
  'Fecha y hora del último cambio de contraseña';

-- ====================================================================
-- OPCIONAL: Crear índice para mejorar performance de limpieza
-- ====================================================================
CREATE INDEX IDX_CLI_AUTH_RESET_EXPIRES
  ON DSEDAC.CLI_AUTH(RESET_CODE_EXPIRES)
  WHERE RESET_CODE IS NOT NULL;

-- ====================================================================
-- Script completado
-- ====================================================================
