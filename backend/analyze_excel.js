
const XLSX = require('xlsx');
const path = require('path');

const excelPath = "C:\\Users\\Javier\\Desktop\\Repositorios\\MEDIOS GENERAL_260129.xlsx";

try {
    console.log(`Reading file: ${excelPath}`);
    const workbook = XLSX.readFile(excelPath);

    console.log("Sheet Names:", workbook.SheetNames);

    workbook.SheetNames.forEach((sheetName, index) => {
        if (index < 10) { // Check first 10 sheets
            console.log(`\n--- Sheet: ${sheetName} ---`);
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (data.length > 0) {
                console.log("Headers:", data[0]);
                if (data.length > 1) console.log("Row 1:", data[1]);
            } else {
                console.log("(Empty Sheet)");
            }
        }
    });

} catch (e) {
    console.error("Error reading Excel:", e.message);
}
