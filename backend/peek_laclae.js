
const db = require('./app/config/odbcConfig');

async function peekLaclae() {
    try {
        await db.initialize();
        console.log("--- First Row of DSED.LACLAE ---");
        const rows = await db.query(`
            SELECT * FROM DSED.LACLAE FETCH FIRST 1 ROWS ONLY
        `);
        console.log(JSON.stringify(rows, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
peekLaclae();
