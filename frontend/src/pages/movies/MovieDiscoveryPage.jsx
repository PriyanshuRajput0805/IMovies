import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaRedo, FaFilm } from 'react-icons/fa';
import api from '../../services/api.js';
import MovieCard from '../../components/movies/MovieCard.jsx';

export const MovieDiscoveryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [genresList, setGenresList] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter states initialized from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
  const [selectedFormat, setSelectedFormat] = useState(searchParams.get('format') || '');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'popularity');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  // Load distinct genres from API
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await api.get('/movies/genres');
        setGenresList(res.data);
      } catch (err) {
        console.warn('Failed to load genres:', err);
      }
    };
    fetchGenres();
  }, []);

  // Fetch movies from API
  const fetchMovies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedGenre) params.set('genre', selectedGenre);
      if (selectedStatus) params.set('status', selectedStatus);
      if (selectedFormat) params.set('format', selectedFormat);
      if (selectedSort) params.set('sort', selectedSort);
      params.set('page', currentPage);
      params.set('limit', 8);

      const res = await api.get(`/movies?${params.toString()}`);
      setMovies(res.data);
      setMeta(res.meta);
    } catch (err) {
      console.error('Failed to fetch movies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [search, selectedGenre, selectedStatus, selectedFormat, selectedSort, currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMovies();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedGenre('');
    setSelectedStatus('all');
    setSelectedFormat('');
    setSelectedSort('popularity');
    setCurrentPage(1);
    setSearchParams({});
  };

  return (
    <div className="container py-4">
      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between pb-3 mb-4 border-bottom" style={{ borderColor: 'var(--imovies-border)' }}>
        <div>
          <span className="badge badge-gold px-3 py-1 mb-2 rounded-pill">Cinema Discovery</span>
          <h2 className="cinema-heading text-white m-0">Explore Movies & Screenings</h2>
        </div>

        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="mt-3 mt-md-0" style={{ maxWidth: '380px', width: '100%' }}>
          <div className="input-group">
            <span className="input-group-text bg-transparent border-end-0" style={{ borderColor: 'var(--imovies-border)', color: 'var(--imovies-text-muted)' }}>
              <FaSearch size={14} />
            </span>
            <input
              type="search"
              className="form-control bg-transparent text-white border-start-0 shadow-none"
              style={{ borderColor: 'var(--imovies-border)', fontSize: '0.9rem' }}
              placeholder="Search by title, genre, actor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>
      </div>

      <div className="row g-4">
        {/* Filters Sidebar */}
        <div className="col-12 col-lg-3">
          <div className="cinema-card p-4 sticky-top" style={{ top: '80px', zIndex: 10 }}>
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--imovies-border)' }}>
              <h6 className="cinema-heading text-white m-0 d-flex align-items-center gap-2">
                <FaFilter style={{ color: 'var(--imovies-primary)' }} /> Filter Catalogue
              </h6>
              {(selectedGenre || selectedStatus !== 'all' || selectedFormat || search) && (
                <button onClick={handleResetFilters} className="btn btn-link text-warning p-0 small text-decoration-none d-flex align-items-center gap-1">
                  <FaRedo size={10} /> Reset
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="mb-4">
              <label className="text-secondary small fw-semibold mb-2 d-block">Status</label>
              <div className="d-flex flex-wrap gap-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'now_showing', label: 'Now Showing' },
                  { id: 'upcoming', label: 'Upcoming' }
                ].map((st) => (
                  <button
                    key={st.id}
                    className={`btn btn-sm ${selectedStatus === st.id ? 'btn-cinema-primary' : 'btn-cinema-outline'} py-1 px-2`}
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => { setSelectedStatus(st.id); setCurrentPage(1); }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Genres Filter */}
            <div className="mb-4">
              <label className="text-secondary small fw-semibold mb-2 d-block">Genres</label>
              <div className="d-flex flex-wrap gap-1">
                <button
                  className={`btn btn-sm ${selectedGenre === '' ? 'btn-cinema-primary' : 'btn-cinema-outline'} py-1 px-2`}
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => { setSelectedGenre(''); setCurrentPage(1); }}
                >
                  All Genres
                </button>
                {genresList.map((g) => (
                  <button
                    key={g}
                    className={`btn btn-sm ${selectedGenre === g ? 'btn-cinema-primary' : 'btn-cinema-outline'} py-1 px-2`}
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => { setSelectedGenre(g); setCurrentPage(1); }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Format Filter */}
            <div className="mb-4">
              <label className="text-secondary small fw-semibold mb-2 d-block">Screening Formats</label>
              <div className="d-flex flex-wrap gap-1">
                {['', '2D', '3D', 'IMAX 3D', '4DX'].map((fmt) => (
                  <button
                    key={fmt}
                    className={`btn btn-sm ${selectedFormat === fmt ? 'btn-cinema-primary' : 'btn-cinema-outline'} py-1 px-2`}
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => { setSelectedFormat(fmt); setCurrentPage(1); }}
                  >
                    {fmt || 'All Formats'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Selector */}
            <div>
              <label className="text-secondary small fw-semibold mb-2 d-block">Sort Results</label>
              <select
                className="form-select form-select-sm bg-dark text-white border-secondary shadow-none"
                value={selectedSort}
                onChange={(e) => { setSelectedSort(e.target.value); setCurrentPage(1); }}
              >
                <option value="popularity">Popularity / Highest Rating</option>
                <option value="releaseDate">Latest Release Date</option>
                <option value="title">Movie Title (A to Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Movies Grid */}
        <div className="col-12 col-lg-9">
          {loading ? (
            <div className="text-center py-5 text-secondary">
              <div className="spinner-border text-warning mb-3" role="status"></div>
              <p>Loading cinema listings...</p>
            </div>
          ) : movies.length === 0 ? (
            <div className="cinema-card p-5 text-center">
              <div className="p-3 rounded-circle d-inline-block mb-3" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--imovies-primary)' }}>
                <FaFilm size={36} />
              </div>
              <h4 className="cinema-heading text-white mb-2">No Movies Found</h4>
              <p className="text-secondary small mb-4">
                We couldn't find any titles matching your selected filters or search keyword.
              </p>
              <button onClick={handleResetFilters} className="btn btn-cinema-primary">
                Clear All Filters
              </button>
            </div>
          ) : (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3 text-secondary small">
                <span>Showing <strong>{movies.length}</strong> of <strong>{meta?.total || movies.length}</strong> movies</span>
                <span>Page {meta?.page || 1} of {meta?.totalPages || 1}</span>
              </div>

              <div className="row g-4">
                {movies.map((movie) => (
                  <div key={movie._id} className="col-12 col-sm-6 col-md-4 col-xl-3">
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              {meta && meta.totalPages > 1 && (
                <div className="d-flex justify-content-center align-items-center gap-2 mt-5">
                  <button
                    disabled={!meta.hasPrevPage}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="btn btn-cinema-outline btn-sm px-3"
                  >
                    Previous
                  </button>

                  <div className="d-flex gap-1">
                    {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setCurrentPage(pg)}
                        className={`btn btn-sm ${currentPage === pg ? 'btn-cinema-primary' : 'btn-cinema-outline'}`}
                        style={{ width: '36px', height: '36px' }}
                      >
                        {pg}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={!meta.hasNextPage}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="btn btn-cinema-outline btn-sm px-3"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDiscoveryPage;
