
const db = require('./app/config/odbcConfig');

async function checkColumns() {
    try {
        await db.initialize();
        const result = await db.query("SELECT * FROM DSEDAC.MEDL1 FETCH FIRST 1 ROWS ONLY");
        if (result.length > 0) {
            console.log("Columns:", Object.keys(result[0]));
        } else {
            console.log("No data found");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await db.close();
    }
}
checkColumns();
