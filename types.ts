
export interface Part {
  itemNo: string;
  itemDescription: string;
  itemGroup: string;
  model: string;
  bhlHlnFlag: string;
  hsnTax: string;
  saleRate: string;
  mrp: string;
}

export interface QuotationPart extends Part {
  quantity: number;
}
