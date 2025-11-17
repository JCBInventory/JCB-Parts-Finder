import React, { useMemo } from 'react';
import type { QuotationPart } from '../types';
import { CloseIcon, TrashIcon, QuoteIcon } from './Icons';

interface QuotationSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    parts: QuotationPart[];
    onRemove: (itemNo: string) => void;
    onClear: () => void;
    discount: number;
    onDiscountChange: (discount: number) => void;
    onUpdateQuantity: (itemNo: string, quantity: number) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

const parseCurrency = (value: string): number => {
    const number = parseFloat(value.replace(/[^0-9.-]+/g,""));
    return isNaN(number) ? 0 : number;
};

const QuotationSidebar: React.FC<QuotationSidebarProps> = ({
    isOpen,
    onClose,
    parts,
    onRemove,
    onClear,
    discount,
    onDiscountChange,
    onUpdateQuantity
}) => {
    const { subtotal, discountAmount, total } = useMemo(() => {
        const subtotal = parts.reduce((acc, part) => acc + (parseCurrency(part.mrp) * part.quantity), 0);
        const discountAmount = subtotal * (discount / 100);
        const total = subtotal - discountAmount;
        return { subtotal, discountAmount, total };
    }, [parts, discount]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            
            {/* Sidebar */}
            <div className="fixed top-0 right-0 h-full w-full max-w-md bg-black/80 border-l-2 border-yellow-600 shadow-2xl flex flex-col text-white">
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <QuoteIcon className="w-7 h-7 text-yellow-400" />
                        <h2 className="text-xl font-bold text-yellow-400">Quotation</h2>
                    </div>
                    <button onClick={onClose} aria-label="Close quotation" className="text-gray-400 hover:text-white transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                
                {parts.length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
                        <QuoteIcon className="w-16 h-16 text-gray-600 mb-4" />
                        <p className="text-lg text-gray-400">Your quotation is empty.</p>
                        <p className="text-sm text-gray-500">Add parts from the search results to get started.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-grow overflow-y-auto p-4 space-y-3">
                            {parts.map(part => (
                                <div key={part.itemNo} className="bg-gray-800/50 p-3 rounded-lg flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-grow overflow-hidden pr-2">
                                            <p className="font-semibold truncate">{part.itemDescription}</p>
                                            <p className="text-sm text-gray-400">{part.itemNo}</p>
                                            <p className="text-xs text-yellow-400/80 mt-1">MRP: {formatCurrency(parseCurrency(part.mrp))}</p>
                                        </div>
                                        <button onClick={() => onRemove(part.itemNo)} aria-label={`Remove ${part.itemDescription}`} className="text-red-400 hover:text-red-300 flex-shrink-0">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => onUpdateQuantity(part.itemNo, part.quantity - 1)} 
                                                className="bg-gray-700 w-8 h-8 rounded-md font-bold hover:bg-gray-600 transition-colors">-</button>
                                            <input 
                                                type="number"
                                                value={part.quantity}
                                                onChange={(e) => onUpdateQuantity(part.itemNo, parseInt(e.target.value, 10) || 1)}
                                                className="w-16 bg-gray-900 border border-gray-600 rounded-md py-1 px-2 text-center focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                                min="1"
                                                aria-label={`Quantity for ${part.itemDescription}`}
                                            />
                                            <button 
                                                onClick={() => onUpdateQuantity(part.itemNo, part.quantity + 1)} 
                                                className="bg-gray-700 w-8 h-8 rounded-md font-bold hover:bg-gray-600 transition-colors">+</button>
                                        </div>
                                        <span className="font-mono text-yellow-400 text-lg">
                                            {formatCurrency(parseCurrency(part.mrp) * part.quantity)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <footer className="p-4 border-t border-gray-700 bg-black/50 space-y-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Subtotal ({parts.length} items)</span>
                                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label htmlFor="discount" className="text-gray-400">Discount (%)</label>
                                    <input
                                        type="number"
                                        id="discount"
                                        value={discount}
                                        onChange={(e) => {
                                            const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                                            onDiscountChange(val);
                                        }}
                                        className="w-20 bg-gray-900 border border-gray-600 rounded-md py-1 px-2 text-right focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        placeholder="0"
                                    />
                                </div>
                                {discount > 0 && (
                                     <div className="flex justify-between text-red-400">
                                        <span>Discount Amount</span>
                                        <span>- {formatCurrency(discountAmount)}</span>
                                     </div>
                                )}
                                <div className="flex justify-between text-lg font-bold border-t border-gray-600 pt-2 mt-2 text-yellow-300">
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>
                            <button onClick={onClear} className="w-full bg-red-600/80 text-white py-2 rounded-lg font-semibold hover:bg-red-500 transition-colors">
                                Clear Quotation
                            </button>
                        </footer>
                    </>
                )}
            </div>
        </div>
    );
};

export default QuotationSidebar;