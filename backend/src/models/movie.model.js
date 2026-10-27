import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
      index: true
    },
    description: {
      type: String,
      required: [true, 'Movie description is required'],
      trim: true
    },
    poster: {
      type: String,
      required: [true, 'Movie poster image URL is required'],
      trim: true
    },
    backdrop: {
      type: String,
      trim: true,
      default: ''
    },
    genres: {
      type: [String],
      required: [true, 'At least one genre is required'],
      validate: [(val) => val.length > 0, 'Provide at least one genre'],
      index: true
    },
    languages: {
      type: [String],
      required: [true, 'At least one language is required'],
      default: ['English']
    },
    formats: {
      type: [String],
      default: ['2D', '3D']
    },
    duration: {
      type: Number,
      required: [true, 'Movie duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute']
    },
    director: {
      type: String,
      trim: true,
      default: 'Unknown'
    },
    cast: {
      type: [String],
      default: []
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required']
    },
    certification: {
      type: String,
      enum: ['U', 'UA', 'A', 'R', 'PG-13', 'PG'],
      default: 'UA'
    },
    trailerUrl: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['now_showing', 'upcoming', 'archived'],
      default: 'now_showing',
      index: true
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 8.0
    }
  },
  {
    timestamps: true
  }
);

// Compound text index for fast title & genre search
movieSchema.index({ title: 'text', description: 'text', genres: 'text' });
movieSchema.index({ status: 1, releaseDate: -1 });

export const Movie = mongoose.model('Movie', movieSchema);
export default Movie;
