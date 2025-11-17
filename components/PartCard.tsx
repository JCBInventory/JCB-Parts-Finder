import React from 'react';
import type { Part } from '../types';
import { PlusIcon, SuccessIcon } from './Icons';

interface PartCardProps {
  part: Part;
  onAddToQuotation: (part: Part) => void;
  isPartInQuotation: boolean;
}

const formatCurrency = (value: string) => {
    const number = parseFloat(value.replace(/[^0-9.-]+/g,""));
    if (isNaN(number)) return value;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
};

const DetailRow: React.FC<{ label: string; value: string; isCurrency?: boolean; valueClassName?: string }> = ({ label, value, isCurrency = false, valueClassName = "text-white font-medium" }) => (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-700 last:border-b-0">
        <span className="text-gray-400 col-span-1">{label}</span>
        <span className={`col-span-2 ${valueClassName}`}>{isCurrency ? formatCurrency(value) : value}</span>
    </div>
);


const PartCard: React.FC<PartCardProps> = ({ part, onAddToQuotation, isPartInQuotation }) => {
  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-yellow-500/20 hover:scale-[1.02] flex flex-col">
      <div className="bg-yellow-500 p-3">
        <h3 className="text-lg font-bold text-black truncate">{part.itemDescription}</h3>
      </div>
      <div className="p-6 space-y-2 flex-grow">
        <div className="text-center mb-4">
            <p className="text-sm text-gray-400">Item No.</p>
            <p className="text-2xl font-bold text-yellow-400 tracking-wider">{part.itemNo}</p>
        </div>
        <div className="space-y-1">
            <DetailRow label="Description" value={part.itemDescription} />
            <DetailRow label="Item Group" value={part.itemGroup} />
            <DetailRow label="Model" value={part.model} />
            <DetailRow label="BHL/HLN Flag" value={part.bhlHlnFlag} />
            <DetailRow label="HSN Tax" value={`${part.hsnTax}%`} />
            <DetailRow label="Sale Rate" value={part.saleRate} isCurrency />
            <DetailRow label="MRP" value={part.mrp} isCurrency valueClassName="font-bold text-yellow-400" />
        </div>
      </div>
      <div className="p-4 bg-black/30 mt-auto">
        <button
            onClick={() => onAddToQuotation(part)}
            disabled={isPartInQuotation}
            className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold transition-all duration-300 enabled:hover:bg-yellow-400 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
            {isPartInQuotation ? (
                <>
                    <SuccessIcon className="w-5 h-5" />
                    <span>Added to Quotation</span>
                </>
            ) : (
                <>
                    <PlusIcon className="w-5 h-5" />
                    <span>Add to Quotation</span>
                </>
            )}
        </button>
      </div>
    </div>
  );
};

export default PartCard;