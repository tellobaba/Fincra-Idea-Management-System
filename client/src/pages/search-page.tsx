import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import SearchBar from '@/components/search/search-bar';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Loader2 } from 'lucide-react';

const SearchPage = () => {
  const [, setLocation] = useLocation();
  
  return (
    <div className="container max-w-7xl mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => window.history.back()} className="mr-4">
          <ChevronLeft className="w-5 h-5" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Search</h1>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4">Find ideas, challenges, and pain points</h2>
          <SearchBar className="w-full" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <Link href="/ideas">
            <div className="bg-green-50 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Ideas</h3>
              <p className="text-green-700">Browse all ideas and innovation opportunities</p>
            </div>
          </Link>
          
          <Link href="/challenges">
            <div className="bg-blue-50 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Challenges</h3>
              <p className="text-blue-700">Browse all challenges that need solutions</p>
            </div>
          </Link>
          
          <Link href="/pain-points">
            <div className="bg-red-50 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Pain Points</h3>
              <p className="text-red-700">Browse all reported pain points</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
