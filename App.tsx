import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Part, QuotationPart } from './types';
import { parsePartsFile } from './services/fileParser';
import PartCard from './components/PartCard';
import QuotationSidebar from './components/QuotationSidebar';
import { UploadIcon, SearchIcon, ClearIcon, SuccessIcon, ErrorIcon, CloseIcon, QuoteIcon } from './components/Icons';

// Declarations for CDN libraries
declare var Fuse: any;

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

const MAX_PARTS_LIMIT = 65000;

const App: React.FC = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [searchResults, setSearchResults] = useState<Part[] | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(true); // Open by default on first load
  const [quotationParts, setQuotationParts] = useState<QuotationPart[]>([]);
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const fuseRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to initialize the search index whenever the parts data changes.
  useEffect(() => {
    if (parts.length > 0) {
      fuseRef.current = new Fuse(parts, {
        keys: ['itemNo', 'itemDescription'],
        includeScore: true,
        threshold: 0.4,
        minMatchCharLength: 2,
        isCaseSensitive: false,
      });
    }
  }, [parts]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus('loading');
    setUploadMessage('Parsing your file...');
    setSearchResults(null);
    setSearchQuery('');
    
    try {
      const parsedData = await parsePartsFile(file);
      
      if (parsedData.length > MAX_PARTS_LIMIT) {
        throw new Error(`File contains ${parsedData.length} items, exceeding the limit of ${MAX_PARTS_LIMIT}.`);
      }

      setParts(parsedData);
      setQuotationParts([]);
      setDiscountPercentage(0);
      setUploadStatus('success');
      setUploadMessage(`✔️ ${parsedData.length} parts uploaded successfully.`);
      setTimeout(() => {
        setIsUploadModalOpen(false);
      }, 2000);
    } catch (error: any) {
      setUploadStatus('error');
      setUploadMessage(`⚠️ ${error.message}`);
      setParts([]);
      setQuotationParts([]);
      setDiscountPercentage(0);
    } finally {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };

  const handleSearch = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setSearchResults(null); // Clear results if search is empty
      return;
    }
    if (fuseRef.current) {
      const resultsWithScore = fuseRef.current.search(trimmedQuery);
      
      const exactMatch = resultsWithScore.find(
        (result: any) => result.item.itemNo.toLowerCase() === trimmedQuery.toLowerCase()
      );

      if (exactMatch) {
        setSearchResults([exactMatch.item]);
      } else {
        const allFuzzyItems = resultsWithScore.map((result: any) => result.item);
        setSearchResults(allFuzzyItems);
      }
    }
  }, [searchQuery, parts]);


  const handleClear = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleAddToQuotation = (partToAdd: Part) => {
    if (!quotationParts.some(p => p.itemNo === partToAdd.itemNo)) {
        setQuotationParts(prevParts => [...prevParts, { ...partToAdd, quantity: 1 }]);
    }
  };

  const handleRemoveFromQuotation = (itemNoToRemove: string) => {
    setQuotationParts(prevParts => prevParts.filter(p => p.itemNo !== itemNoToRemove));
  };

  const handleUpdateQuotationQuantity = (itemNoToUpdate: string, newQuantity: number) => {
    const quantity = Math.max(0, newQuantity); // Ensure quantity is not negative
    if (quantity === 0) {
        handleRemoveFromQuotation(itemNoToUpdate);
    } else {
        setQuotationParts(prevParts =>
            prevParts.map(p =>
                p.itemNo === itemNoToUpdate ? { ...p, quantity } : p
            )
        );
    }
  };

  const handleClearQuotation = () => {
      setQuotationParts([]);
      setDiscountPercentage(0);
  };
  
  const isPartInQuotation = (itemNo: string): boolean => {
    return quotationParts.some(p => p.itemNo === itemNo);
  };

  const hasData = parts.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8860B] to-[#8B6508] text-white font-sans p-4 sm:p-6 lg:p-8">
      
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-4">
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          aria-label="Upload data file"
          className="bg-black text-yellow-400 p-4 rounded-full shadow-lg border-2 border-yellow-500 hover:bg-yellow-500 hover:text-black transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-300"
        >
          <UploadIcon className="w-6 h-6" />
        </button>
        {hasData && (
          <button 
            onClick={() => setIsQuotationOpen(true)}
            aria-label="Open quotation"
            className="relative bg-black text-yellow-400 p-4 rounded-full shadow-lg border-2 border-yellow-500 hover:bg-yellow-500 hover:text-black transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-300"
          >
            <QuoteIcon className="w-6 h-6" />
            {quotationParts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {quotationParts.length}
              </span>
            )}
          </button>
        )}
      </div>

      {isUploadModalOpen && (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40 p-4 transition-opacity duration-300" 
            role="dialog"
            aria-modal="true"
        >
          <div className="bg-black/50 border border-yellow-600 p-8 rounded-xl shadow-2xl relative w-full max-w-lg transition-transform duration-300 scale-100">
            <button 
                onClick={() => setIsUploadModalOpen(false)}
                aria-label="Close upload dialog"
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
                <CloseIcon className="w-6 h-6" />
            </button>
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-yellow-400 mb-2">Upload Parts Data</h2>
                <p className="text-gray-300 mb-6">
                    Choose a CSV, TSV, or XLSX file to begin searching.
                </p>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv,.tsv,.xlsx"
                    className="hidden"
                    id="file-upload"
                />
                <label htmlFor="file-upload" className="w-full flex items-center justify-center gap-2 bg-black px-6 py-3 rounded-lg border-2 border-yellow-500 hover:bg-yellow-500 hover:text-black transition-all duration-300 cursor-pointer font-semibold">
                    <UploadIcon className="w-6 h-6" />
                    <span>Choose File</span>
                </label>

                {uploadMessage && (
                    <div className={`mt-4 flex items-center justify-center gap-2 p-3 rounded-lg text-sm transition-opacity duration-300 ${
                        uploadStatus === 'loading' ? 'text-yellow-300' :
                        uploadStatus === 'success' ? 'text-green-300' :
                        uploadStatus === 'error' ? 'text-red-300' : ''
                    }`}>
                        {uploadStatus === 'success' && <SuccessIcon className="w-5 h-5" />}
                        {uploadStatus === 'error' && <ErrorIcon className="w-5 h-5" />}
                        <span>{uploadMessage}</span>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
      
      <QuotationSidebar
        isOpen={isQuotationOpen}
        onClose={() => setIsQuotationOpen(false)}
        parts={quotationParts}
        onRemove={handleRemoveFromQuotation}
        onClear={handleClearQuotation}
        discount={discountPercentage}
        onDiscountChange={setDiscountPercentage}
        onUpdateQuantity={handleUpdateQuotationQuantity}
      />

      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-yellow-300 drop-shadow-lg">JCB Parts Finder</h1>
          <p className="text-yellow-100/80 mt-2">Dark Yellow Edition</p>
        </header>

        <main className="space-y-8">
          {!hasData ? (
            <div className="text-center bg-black/30 p-10 rounded-xl mt-16">
                <h2 className="text-2xl text-yellow-300 mb-4">Welcome</h2>
                <p className="text-gray-400">Please upload a parts data file using the <UploadIcon className="w-5 h-5 inline-block -mt-1"/> icon to begin.</p>
            </div>
          ) : (
            <>
                <section className="bg-black/30 p-6 rounded-xl shadow-2xl backdrop-blur-sm transition-opacity duration-500">
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">Search Parts</h2>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search by Item No. or Description..."
                        className="w-full bg-black text-white border-2 border-yellow-500 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleSearch} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-colors duration-300">
                            <span>Search</span>
                        </button>
                        <button onClick={handleClear} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-600 transition-colors duration-300">
                            <ClearIcon className="w-5 h-5" />
                            <span>Clear</span>
                        </button>
                    </div>
                </div>
                </section>

                {searchResults && (
                <section>
                    <h2 className="text-2xl font-semibold text-yellow-400 mb-4">Search Results ({searchResults.length})</h2>
                    {searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {searchResults.map((part) => (
                          <PartCard 
                            key={part.itemNo} 
                            part={part}
                            onAddToQuotation={handleAddToQuotation}
                            isPartInQuotation={isPartInQuotation(part.itemNo)}
                          />
                        ))}
                    </div>
                    ) : (
                    <div className="text-center bg-black/30 p-10 rounded-xl">
                        <p className="text-xl text-yellow-300">No matching parts found.</p>
                        <p className="text-gray-400 mt-2">Try a different search term or check your data file.</p>
                    </div>
                    )}
                </section>
                )}
            </>
          )}
        </main>

        <footer className="text-center mt-12 text-yellow-100/50 text-sm">
            <p>Design created by Arshad Ali</p>
        </footer>
      </div>
    </div>
  );
};

export default App;