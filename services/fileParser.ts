
import type { Part } from '../types';

// Declarations for CDN libraries
declare var Papa: any;
declare var XLSX: any;

const REQUIRED_HEADERS: (keyof Part)[] = [
  'itemNo',
  'itemDescription',
  'itemGroup',
  'model',
  'bhlHlnFlag',
  'hsnTax',
  'saleRate',
  'mrp',
];

const HEADER_MAPPING: { [key: string]: keyof Part } = {
  'item no': 'itemNo',
  'item no.': 'itemNo',
  'item description': 'itemDescription',
  'description': 'itemDescription',
  'item group': 'itemGroup',
  'model': 'model',
  'bhl/hln flag': 'bhlHlnFlag',
  'hsn tax %': 'hsnTax',
  'hsn tax': 'hsnTax',
  'sale rate': 'saleRate',
  'mrp': 'mrp',
};

const normalizeHeader = (header: string) => header.toLowerCase().trim();

const processRow = (row: any, headerMap: (keyof Part | null)[]): Part => {
  const part: any = {};
  headerMap.forEach((partKey, index) => {
    if (partKey) {
      const value = row[index] ?? '';
      part[partKey] = String(value);
    }
  });
  return part as Part;
};

const parseExcel = (file: File): Promise<Part[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (json.length < 2) {
          return reject(new Error('File is empty or contains only headers.'));
        }

        const headers = json[0].map(h => normalizeHeader(String(h)));
        const headerMap = headers.map(h => HEADER_MAPPING[h] || null);

        const foundHeaders = headerMap.filter(h => h !== null) as (keyof Part)[];
        const missingHeaders = REQUIRED_HEADERS.filter(rh => !foundHeaders.includes(rh));

        if (missingHeaders.length > 0) {
          return reject(new Error(`Missing required columns: ${missingHeaders.join(', ')}`));
        }

        const partsData = json.slice(1).map(row => processRow(row, headerMap));
        resolve(partsData);
      } catch (error) {
        reject(new Error('Failed to parse Excel file.'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsArrayBuffer(file);
  });
};

const parseCsvTsv = (file: File): Promise<Part[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => normalizeHeader(header),
      complete: (results: any) => {
        if (results.errors.length > 0) {
          return reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
        }
        
        const headers = results.meta.fields.map(normalizeHeader);
        const headerMapValues = headers.map((h: string) => HEADER_MAPPING[h]);

        const foundHeaders = headerMapValues.filter(h => h !== undefined) as (keyof Part)[];
        const missingHeaders = REQUIRED_HEADERS.filter(rh => !foundHeaders.includes(rh));

        if (missingHeaders.length > 0) {
          return reject(new Error(`Missing required columns: ${missingHeaders.join(', ')}`));
        }

        const partsData: Part[] = results.data.map((row: any) => {
            const part: any = {};
            for (const rawHeader of headers) {
                const partKey = HEADER_MAPPING[rawHeader];
                if (partKey) {
                    part[partKey] = String(row[rawHeader] ?? '');
                }
            }
            return part;
        });

        resolve(partsData);
      },
      error: (error: Error) => {
        reject(new Error(`Failed to parse file: ${error.message}`));
      },
    });
  });
};


export const parsePartsFile = (file: File): Promise<Part[]> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'xlsx') {
    return parseExcel(file);
  } else if (extension === 'csv' || extension === 'tsv') {
    return parseCsvTsv(file);
  } else {
    return Promise.reject(new Error('File format not supported. Please upload CSV, TSV, or Excel.'));
  }
};
