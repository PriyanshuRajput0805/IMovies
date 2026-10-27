import { ApiError } from '../utils/ApiError.js';
import mongoose from 'mongoose';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const validateCreateMovie = (req, res, next) => {
  const { title, description, poster, genres, duration, releaseDate } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push({ field: 'title', message: 'Movie title is required' });
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.push({ field: 'description', message: 'Movie description is required' });
  }

  if (!poster || typeof poster !== 'string' || !poster.trim()) {
    errors.push({ field: 'poster', message: 'Movie poster image URL is required' });
  }

  if (!genres || !Array.isArray(genres) || genres.length === 0) {
    errors.push({ field: 'genres', message: 'At least one genre is required' });
  }

  if (!duration || typeof duration !== 'number' || duration < 1) {
    errors.push({ field: 'duration', message: 'Duration must be a positive number in minutes' });
  }

  if (!releaseDate) {
    errors.push({ field: 'releaseDate', message: 'Release date is required' });
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Validation failed', errors));
  }

  next();
};

export const validateCreateTheatre = (req, res, next) => {
  const { name, address, city } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push({ field: 'name', message: 'Theatre name is required' });
  }

  if (!address || typeof address !== 'string' || !address.trim()) {
    errors.push({ field: 'address', message: 'Theatre address is required' });
  }

  if (!city || typeof city !== 'string' || !city.trim()) {
    errors.push({ field: 'city', message: 'Theatre city is required' });
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Validation failed', errors));
  }

  next();
};

export const validateCreateScreen = (req, res, next) => {
  const { name } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push({ field: 'name', message: 'Screen name is required' });
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Validation failed', errors));
  }

  next();
};

export const validateCreateShow = (req, res, next) => {
  const { movieId, theatreId, screenId, showDate, startTime } = req.body;
  const errors = [];

  if (!movieId || !isValidObjectId(movieId)) {
    errors.push({ field: 'movieId', message: 'Valid Movie ID reference is required' });
  }

  if (!theatreId || !isValidObjectId(theatreId)) {
    errors.push({ field: 'theatreId', message: 'Valid Theatre ID reference is required' });
  }

  if (!screenId || !isValidObjectId(screenId)) {
    errors.push({ field: 'screenId', message: 'Valid Screen ID reference is required' });
  }

  if (!showDate) {
    errors.push({ field: 'showDate', message: 'Show date is required' });
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!startTime || !timeRegex.test(startTime)) {
    errors.push({ field: 'startTime', message: 'Valid start time in HH:mm format is required' });
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Validation failed', errors));
  }

  next();
};
