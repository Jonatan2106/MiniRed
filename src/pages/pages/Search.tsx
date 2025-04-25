import React, { useState } from 'react';
import { fetchFromAPI } from '../../api/api';
import '../styles/search.css';
import '../styles/main.css';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async () => {
    try {
      const response = await fetchFromAPI(`/search?q=${query}`);
      setResults(response);
    } catch (error) {
      console.error('Search failed', error);
    }
  };

  return (
    <div className="search-container">
      <input
        type="text"
        className="search-input"
        placeholder="Search posts"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button className="search-button" onClick={handleSearch}>
        Search
      </button>

      <div className="results-container">
        {results.map((result) => (
          <div key={result.post_id} className="result-item">
            <h2>{result.title}</h2>
            <p>{result.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;
