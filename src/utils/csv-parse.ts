import { parse } from 'csv-parse';

export const parseCSV = async (file) => {
  const buffer = file.data;
  const records = [];
  const parser = parse({
    delimiter: ',',
    columns: ['email'],
  });
  parser.on('readable', () => {
    let record;
    while ((record = parser.read()) !== null) {
      if (!record.email.includes('@')) {
        continue;
      }
      records.push(record.email);
    }
  });
  parser.on('error', function (err) {
    console.error(err.message);
  });
  parser.write(buffer);
  parser.end();
  return records;
};
