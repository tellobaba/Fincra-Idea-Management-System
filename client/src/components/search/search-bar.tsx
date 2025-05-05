import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X, Loader2 } from 'lucide-react';

type SearchSuggestion = {
  id: number;
  title: string;
  category: string;
};

type SearchBarProps = {
  className?: string;
};

const SearchBar: React.FC<SearchBarProps> = ({ className = '' }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [, setLocation] = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Handle clicks outside the search component to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    // Clear suggestions if query is too short
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    // Set loading state
    setIsLoading(true);
    
    // Create a function to fetch suggestions
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 300);
    
    // Clean up the timeout
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setLocation(`/search/results?q=${encodeURIComponent(query)}`);
      setIsFocused(false);
    }
  };
  
  const handleSuggestionClick = (id: number, category: string) => {
    // Format the category to match URL paths
    let categoryPath = '';
    
    // Ensure we're mapping to the correct route paths
    if (category === 'opportunity') {
      setLocation(`/ideas/${id}`);
    } else if (category === 'challenge') {
      setLocation(`/challenges/${id}`);
    } else if (category === 'pain-point') {
      setLocation(`/pain-points/${id}`);
    }
    
    setQuery('');
    setIsFocused(false);
  };
  
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'opportunity':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Idea</Badge>;
      case 'challenge':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Challenge</Badge>;
      case 'pain-point':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Pain Point</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Search form */}
      <form onSubmit={handleSearch} className="flex w-full items-center relative">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Search ideas, challenges & pain points..."
            className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
      
      {/* Suggestions dropdown - only show when we have a query and the input is focused */}
      {isFocused && query.length >= 2 && (
        <div 
          ref={dropdownRef} 
          className="absolute left-0 right-0 top-12 z-50 rounded-md border border-gray-200 bg-white shadow-lg"
        >
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-60 overflow-auto py-1">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion.id, suggestion.category)}
                  className="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-gray-100"
                >
                  <span className="text-sm font-medium">{suggestion.title}</span>
                  <div>{getCategoryBadge(suggestion.category)}</div>
                </li>
              ))}
              <li className="border-t border-gray-100 p-2 text-center">
                <button 
                  onClick={handleSearch}
                  className="text-sm font-medium text-violet-600 hover:text-violet-800"
                >
                  See all results
                </button>
              </li>
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;