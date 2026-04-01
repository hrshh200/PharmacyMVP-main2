import React, { useState, useEffect } from 'react';
import { Search, X, Pill } from 'lucide-react';

const SearchBar = ({ onSearchChange, medicines = [] }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const handleChange = (value) => {
    setQuery(value);
    
    // Filter medicines based on query
    if (value.trim().length > 0) {
      const filtered = medicines.filter((medicine) =>
        medicine.name.toLowerCase().includes(value.toLowerCase()) ||
        medicine.brand?.toLowerCase().includes(value.toLowerCase()) ||
        medicine.manufacturer?.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 8)); // Limit to 8 suggestions
    } else {
      setSuggestions([]);
    }
  };

  const handleSearch = () => {
    if (onSearchChange) onSearchChange(query);
    setSuggestions([]);
  };

  const handleSelectSuggestion = (medicine) => {
    setQuery(medicine.name);
    if (onSearchChange) onSearchChange(medicine.name);
    setSuggestions([]);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    if (onSearchChange) onSearchChange('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative w-full mx-auto">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-500 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search for medicines, brands, or health products..."
            className="w-full pl-12 pr-12 py-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 shadow-md transition-all hover:border-cyan-300"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setSuggestions([]), 200)}
          />
          
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-14 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 rounded-lg p-1"
              title="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Dropdown Suggestions */}
          {suggestions.length > 0 && isFocused && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white border-2 border-cyan-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {suggestions.map((medicine, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectSuggestion(medicine)}
                    className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-cyan-50 hover:to-emerald-50 transition-all flex items-center gap-3 border-b border-gray-100 last:border-b-0 group"
                  >
                    {/* Medicine Image */}
                    <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-cyan-50 to-emerald-50 rounded-lg overflow-hidden border border-cyan-100 flex items-center justify-center group-hover:border-cyan-300 transition-all">
                      <img
                        src="/medicine.png"
                        alt={medicine.name}
                        className="h-10 w-10 object-contain"
                        onError={(e) => {
                          e.target.src = '/logo.png';
                        }}
                      />
                    </div>

                    {/* Medicine Details */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 line-clamp-1 group-hover:text-cyan-700 transition-colors">
                        {medicine.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {medicine.manufacturer && (
                          <span className="text-xs text-gray-600 line-clamp-1">
                            {medicine.manufacturer}
                          </span>
                        )}
                        {medicine.dosage && (
                          <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded font-medium">
                            {medicine.dosage}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price Badge */}
                    {medicine.price && (
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm font-bold text-cyan-600">
                          ₹{medicine.price}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Empty State */}
              {suggestions.length === 0 && query && (
                <div className="px-4 py-8 text-center">
                  <Pill className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm font-medium">No medicines found</p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSearch}
          className="bg-gradient-to-r from-cyan-600 to-emerald-500 hover:from-cyan-700 hover:to-emerald-600 text-white px-6 py-4 rounded-xl transition shadow-md flex items-center justify-center font-semibold gap-2 hover:shadow-lg transform hover:scale-105 active:scale-95"
          title="Search"
        >
          <Search className="w-5 h-5" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
