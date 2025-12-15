-- ====================================================================
-- SCRIPT: Actualizar Tabla CLI para almacenar Email
-- Fecha: 2025-11-13
-- Descripción: La tabla CLI de DSEDAC usa TELEFONO2 para email
--              Este script documenta el uso actual y opcionalmente
--              puede agregar validación
-- ====================================================================

-- NOTA: En el sistema actual, el campo TELEFONO2 de la tabla CLI
-- se usa para almacenar el email del cliente.
--
-- Estructura actual:
-- - TELEFONO1: Teléfono principal
-- - TELEFONO2: Email (VARCHAR 20) ⚠️ Longitud limitada
-- - NOMBREALTERNATIVO: Puede contener email adicional
--
-- Recomendación: Considerar agregar campo EMAIL dedicado en futuro

-- OPCIONAL: Si se desea agregar campo EMAIL dedicado (comentado por defecto)
/*
ALTER TABLE DSEDAC.CLI
ADD COLUMN EMAIL VARCHAR(100);

COMMENT ON COLUMN DSEDAC.CLI.EMAIL IS
  'Dirección de correo electrónico del cliente';

-- Migrar datos de TELEFONO2 a EMAIL (solo emails válidos)
UPDATE DSEDAC.CLI
SET EMAIL = TRIM(TELEFONO2)
WHERE TELEFONO2 LIKE '%@%'
  AND TELEFONO2 LIKE '%.%';

-- Crear índice para búsquedas
CREATE INDEX IDX_CLI_EMAIL
  ON DSEDAC.CLI(UPPER(TRIM(EMAIL)));
*/

-- ====================================================================
-- Por ahora, continuamos usando TELEFONO2 para email
-- El sistema valida formato de email en la aplicación
-- ====================================================================

-- Verificar clientes con email registrado
SELECT
  CODIGOCLIENTE,
  NOMBRECLIENTE,
  TELEFONO1,
  TELEFONO2 AS EMAIL,
  CASE
    WHEN TELEFONO2 LIKE '%@%.%' THEN 'Válido'
    ELSE 'Revisar'
  END AS VALIDACION_EMAIL
FROM DSEDAC.CLI
WHERE TELEFONO2 IS NOT NULL
  AND TRIM(TELEFONO2) <> ''
FETCH FIRST 10 ROWS ONLY;
