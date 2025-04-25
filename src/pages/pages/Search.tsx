import React, { useState } from 'react';
import { fetchFromAPI } from '../../api/api';

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
    <div>
      <input
        type="text"
        placeholder="Search posts"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      <div>
        {results.map((result) => (
          <div key={result.post_id}>
            <h2>{result.title}</h2>
            <p>{result.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;
