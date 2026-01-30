
const db = require('./app/config/odbcConfig');
const logger = require('./app/utils/logger');

const CREATE_VIEW_SQL = `
CREATE OR REPLACE VIEW JAVIER.V_MEDIOS_GENERAL AS
SELECT 
    -- Información del Medio
    M.CODIGOMEDIO,
    M.CODIGOMODELOMEDIO,
    MOD.DESCRIPCIONMODELOMEDIO,
    M.DESCRIPCIONMEDIO,
    M.NUMEROSERIE,
    M.CODIGONFC,
    M.ESTADOMEDIO,
    
    -- Fechas construidas (DB2 Syntax)
    -- Asumiendo formato YYYY-MM-DD para compatibilidad Power BI
    CASE 
        WHEN M.ANOALTA > 0 AND M.MESALTA > 0 AND M.DIAALTA > 0 
        THEN DATE(RTRIM(CHAR(M.ANOALTA)) || '-' || RTRIM(CHAR(M.MESALTA)) || '-' || RTRIM(CHAR(M.DIAALTA)))
        ELSE NULL 
    END AS FECHA_ALTA,
    
    CASE 
        WHEN M.ANOBAJA > 0 AND M.MESBAJA > 0 AND M.DIABAJA > 0 
        THEN DATE(RTRIM(CHAR(M.ANOBAJA)) || '-' || RTRIM(CHAR(M.MESBAJA)) || '-' || RTRIM(CHAR(M.DIABAJA)))
        ELSE NULL 
    END AS FECHA_BAJA,

    CASE 
        WHEN M.ANIOPROXIMAREVISION > 0 AND M.MESPROXIMAREVISION > 0 AND M.DIAPROXIMAREVISION > 0 
        THEN DATE(RTRIM(CHAR(M.ANIOPROXIMAREVISION)) || '-' || RTRIM(CHAR(M.MESPROXIMAREVISION)) || '-' || RTRIM(CHAR(M.DIAPROXIMAREVISION)))
        ELSE NULL 
    END AS FECHA_PROXIMA_REVISION,

    -- Info Cliente
    M.CODIGOCLIENTE,
    C.LCNCL AS NOMBRE_CLIENTE,
    C.LCDOPO AS DIRECCION,
    C.LCPOBL AS POBLACION,
    C.LCPROV AS PROVINCIA,
    C.LCCPOS AS CODIGO_POSTAL,
    C.LCRUTA AS RUTA,
    
    -- Delegacion (Logica basada en Provincia/Poblacion si es necesario, o directamente el campo si existe)
    CASE 
        WHEN C.LCPROV LIKE '%ALMER%' THEN 'ALMERIA'
        WHEN C.LCPROV LIKE '%LUG%' THEN 'LUGO' 
        -- Ajustar segun delegaciones reales
        ELSE C.LCPROV 
    END AS DELEGACION

FROM DSEDAC.MEDL1 M
LEFT JOIN DSED.LACLAE C ON M.CODIGOCLIENTE = C.LCCL
LEFT JOIN DSEDAC.MMDL1 MOD ON M.CODIGOMODELOMEDIO = MOD.CODIGOMODELOMEDIO
WHERE 
    C.LCYEAB >= 2025
`;

async function createView() {
    try {
        console.log("Connecting to database...");
        await db.initialize();
        console.log("Creating View JAVIER.V_MEDIOS_GENERAL...");

        await db.query(CREATE_VIEW_SQL);

        console.log("✅ View created successfully!");

        // Verificacion rapida
        console.log("Verifying view...");
        const result = await db.query("SELECT * FROM JAVIER.V_MEDIOS_GENERAL LIMIT 5");
        console.log("Result sample:", JSON.stringify(result[0], null, 2));

    } catch (error) {
        console.error("❌ Error creating view:", error);
    } finally {
        await db.close();
    }
}

createView();
