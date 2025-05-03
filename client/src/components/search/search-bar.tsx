import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const debounce = setTimeout(() => {
      fetchSuggestions();
    }, 300);
    
    return () => clearTimeout(debounce);
  }, [query]);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setShowSuggestions(false);
    }
  };
  
  const handleSuggestionClick = (id: number, category: string) => {
    // Format the category to match URL paths
    let categoryPath = '';
    if (category === 'opportunity') categoryPath = 'ideas';
    else if (category === 'challenge') categoryPath = 'challenges';
    else if (category === 'pain-point') categoryPath = 'pain-points';
    
    navigate(`/${categoryPath}/${id}`);
    setShowSuggestions(false);
    setQuery('');
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
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Search ideas, challenges & pain points..."
            className="pl-10 pr-10 h-10 w-full focus-visible:ring-violet-500"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
      
      {/* Suggestions dropdown */}
      {showSuggestions && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="p-4 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-60 overflow-auto py-1">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                  onClick={() => handleSuggestionClick(suggestion.id, suggestion.category)}
                >
                  <div>
                    <div className="text-sm">
                      {highlightMatchedText(suggestion.title, query)}
                    </div>
                  </div>
                  <div>{getCategoryBadge(suggestion.category)}</div>
                </li>
              ))}
              <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-center text-violet-600 text-sm font-medium">
                <button onClick={handleSearch}>See all results</button>
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

// Helper function to highlight matched text
function highlightMatchedText(text: string, query: string) {
  if (!query) return text;
  
  try {
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <span key={i} className="bg-yellow-100 text-gray-900 dark:bg-yellow-800 dark:text-gray-100">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  } catch (e) {
    // If regex fails (e.g. with special characters), just return the plain text
    return text;
  }
}

export default SearchBar;