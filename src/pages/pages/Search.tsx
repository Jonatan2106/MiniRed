import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFromAPIWithoutAuth } from '../../api/noAuth';

import '../styles/search.css';
import '../styles/main.css';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = async () => {
    try {
      const response = await fetchFromAPIWithoutAuth(`/search?q=${query}`, 'GET');
      setResults(response);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Search failed', error);
      setError('Failed to fetch search results. Please try again.');
    }
  };

  return (
    <div className="search-container">
      {/* Search Input */}
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search posts, comments, or subreddits"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="search-button" onClick={handleSearch}>
          Search
        </button>
      </div>

      {/* Error Message */}
      {error && <p className="error-message">{error}</p>}

      {/* Search Results */}
      <div className="search-results">
        {results.length > 0 ? (
          results.map((result) => (
            <div
              key={result.id}
              className="search-result-item"
              onClick={() => navigate(`/post/${result.post_id}`)}
            >
              <h3>{result.title}</h3>
              <p>{result.content}</p>
              <p className="text-sm">
                Posted on {new Date(result.created_at).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          query && <p className="no-results">No results found for "{query}".</p>
        )}
      </div>
    </div>
  );
};

export default Search;