import { Movie } from '../models/movie.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Get paginated movies with filtering & search
 * @route   GET /api/v1/movies
 * @access  Public
 */
export const getMovies = async (req, res, next) => {
  try {
    const {
      search,
      genre,
      language,
      format,
      status = 'now_showing',
      sort = 'popularity',
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    // Filter by status (unless 'all' is requested)
    if (status && status !== 'all') {
      query.status = status;
    } else if (status === 'all') {
      // Exclude archived by default unless specifically asked
      query.status = { $ne: 'archived' };
    }

    // Genre filter
    if (genre) {
      query.genres = { $in: [new RegExp(`^${genre.trim()}$`, 'i')] };
    }

    // Language filter
    if (language) {
      query.languages = { $in: [new RegExp(`^${language.trim()}$`, 'i')] };
    }

    // Format filter (e.g. IMAX, 3D)
    if (format) {
      query.formats = { $in: [new RegExp(`^${format.trim()}$`, 'i')] };
    }

    // Text / regex search
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { genres: searchRegex },
        { cast: searchRegex }
      ];
    }

    // Sorting
    let sortCriteria = {};
    if (sort === 'popularity' || sort === 'rating') {
      sortCriteria = { rating: -1, releaseDate: -1 };
    } else if (sort === 'releaseDate' || sort === 'newest') {
      sortCriteria = { releaseDate: -1 };
    } else if (sort === 'title') {
      sortCriteria = { title: 1 };
    } else {
      sortCriteria = { releaseDate: -1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [movies, total] = await Promise.all([
      Movie.find(query).sort(sortCriteria).skip(skip).limit(limitNum),
      Movie.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json(
      ApiResponse.success(
        movies,
        'Movies retrieved successfully',
        200,
        {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single movie details by ID
 * @route   GET /api/v1/movies/:id
 * @access  Public
 */
export const getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return next(ApiError.notFound('Movie not found'));
    }
    return res.status(200).json(ApiResponse.success(movie, 'Movie details retrieved'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new movie
 * @route   POST /api/v1/movies
 * @access  Private (Admin only)
 */
export const createMovie = async (req, res, next) => {
  try {
    const movie = await Movie.create(req.body);
    logger.info(`New movie created: ${movie.title} (${movie._id})`);
    return res.status(201).json(ApiResponse.created(movie, 'Movie created successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update movie by ID
 * @route   PATCH /api/v1/movies/:id
 * @access  Private (Admin only)
 */
export const updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!movie) {
      return next(ApiError.notFound('Movie not found'));
    }
    logger.info(`Movie updated: ${movie.title} (${movie._id})`);
    return res.status(200).json(ApiResponse.success(movie, 'Movie updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete or archive movie by ID
 * @route   DELETE /api/v1/movies/:id
 * @access  Private (Admin only)
 */
export const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return next(ApiError.notFound('Movie not found'));
    }

    // Soft delete by setting status to archived
    movie.status = 'archived';
    await movie.save();

    logger.info(`Movie archived: ${movie.title} (${movie._id})`);
    return res.status(200).json(ApiResponse.success(movie, 'Movie archived successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all distinct genres for filters
 * @route   GET /api/v1/movies/genres
 * @access  Public
 */
export const getGenres = async (req, res, next) => {
  try {
    const genres = await Movie.distinct('genres', { status: { $ne: 'archived' } });
    return res.status(200).json(ApiResponse.success(genres.sort(), 'Distinct genres retrieved'));
  } catch (error) {
    next(error);
  }
};
