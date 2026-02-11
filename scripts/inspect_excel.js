
const XLSX = require('xlsx');
const path = require('path');

const files = [
    'PruebaCalleja Ene2025.xlsx',
    'PruebaCalleja Feb2025.xlsx'
];

files.forEach(file => {
    console.log(`\n--- Inspecting ${file} ---`);
    try {
        const workbook = XLSX.readFile(path.join(process.cwd(), file));
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log('Headers:', Object.keys(data[0] || {}));
        console.log('Sample Data (First 2 rows):', JSON.stringify(data.slice(0, 2), null, 2));
    } catch (e) {
        console.error(`Error reading ${file}:`, e.message);
    }
});
