require('dotenv').config();
const odbcPool = require('../../app/config/odbcConfig');

async function clearTestUserEmail() {
    console.log(`Clearing email for customer 999999 (Force)...`);

    try {
        // Force update DSEDAC.CLIP to clear email
        // This is the source for authService.js 'cliente.EMAIL'
        try {
            const updateClip = "UPDATE DSEDAC.CLIP SET EMAILCONTACTO = '' WHERE TRIM(CODIGOCLIENTE) = '999999'";
            await odbcPool.query(updateClip);
            console.log('✅ DSEDAC.CLIP email cleared');
        } catch (e) {
            console.warn('Could not update DSEDAC.CLIP:', e.message);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

clearTestUserEmail();
