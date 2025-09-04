const XLSX = require('xlsx');

const workbook = XLSX.readFile('Day1.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 'A' });

console.log('Всього рядків:', rows.length);

// Аналізуємо перші кілька рядків детально
console.log('\nДетальний аналіз перших 5 рядків:');
rows.slice(0, 5).forEach((row, i) => {
  console.log(`\nРядок ${i}:`);
  console.log('  A (назва):', row['A'] || 'ПОРОЖНІЙ');
  console.log('  B:', row['B'] || '');
  console.log('  C:', row['C'] || '');
  console.log('  D:', row['D'] || '');
  console.log('  E:', row['E'] || '');
  console.log('  F:', row['F'] || '');
  console.log('  G:', row['G'] || '');
  console.log('  H:', row['H'] || '');
  console.log('  I:', row['I'] || '');
  console.log('  J:', row['J'] || '');
  console.log('  K:', row['K'] || '');
  console.log('  L:', row['L'] || '');
  console.log('  M:', row['M'] || '');
  console.log('  N:', row['N'] || '');
  console.log('  O:', row['O'] || '');
  console.log('  P:', row['P'] || '');
  console.log('  Q:', row['Q'] || '');
});

// Знаходимо порожні рядки
const emptyRows = [];
rows.forEach((row, i) => {
  if (!row['A'] || row['A'].toString().trim() === '') {
    emptyRows.push(i);
  }
});
console.log('\nПорожні рядки:', emptyRows);

// Знаходимо всі рядки з даними
console.log('\nРядки з даними:');
rows.forEach((row, i) => {
  const name = row['A'] || '';
  const budget = parseFloat(row['F']) || 0;
  const impressions = parseFloat(row['M']) || 0;
  const conversions = parseFloat(row['I']) || 0;
  
  if ((budget > 0 || impressions > 0 || conversions > 0) && name && !/^всего|total|итого/i.test(name)) {
    console.log(`Рядок ${i}: '${name}' - бюджет: ${budget}, покази: ${impressions}, конверсії: ${conversions}`);
  }
});

// Перевіряємо структуру навколо порожніх рядків
console.log('\nСтруктура навколо порожніх рядків:');
emptyRows.forEach(emptyRow => {
  console.log(`\nПорожній рядок ${emptyRow}:`);
  if (emptyRow > 0) {
    console.log(`  Перед: '${rows[emptyRow - 1]['A'] || 'ПОРОЖНІЙ'}'`);
  }
  if (emptyRow < rows.length - 1) {
    console.log(`  Після: '${rows[emptyRow + 1]['A'] || 'ПОРОЖНІЙ'}'`);
  }
});

// Перевіряємо конкретні кампанії
console.log('\nДетальний аналіз кампаній:');
const testCampaigns = ['Африка_Инфо_Автолайн', 'Арабские_Автолайн', 'Anema-Клиент', 'Чехия_Автолайн'];
testCampaigns.forEach(campaignName => {
  const foundRow = rows.find(row => row['A'] && row['A'].includes(campaignName));
  if (foundRow) {
    console.log(`\n${campaignName}:`);
    console.log('  A:', foundRow['A']);
    console.log('  B:', foundRow['B']);
    console.log('  C:', foundRow['C']);
    console.log('  F:', foundRow['F']);
    console.log('  I:', foundRow['I']);
    console.log('  M:', foundRow['M']);
  }
});
