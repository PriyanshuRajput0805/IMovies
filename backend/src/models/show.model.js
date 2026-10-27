import mongoose from 'mongoose';

const showSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie reference is required'],
      index: true
    },
    theatreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre reference is required'],
      index: true
    },
    screenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screen',
      required: [true, 'Screen reference is required'],
      index: true
    },
    showDate: {
      type: Date,
      required: [true, 'Show date is required'],
      index: true
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (format HH:mm)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm 24-hour format']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (format HH:mm)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm 24-hour format']
    },
    format: {
      type: String,
      default: '2D'
    },
    language: {
      type: String,
      default: 'English'
    },
    pricing: {
      standard: {
        type: Number,
        required: true,
        min: [50, 'Price must be at least 50'],
        default: 200
      },
      premium: {
        type: Number,
        required: true,
        min: [50, 'Price must be at least 50'],
        default: 320
      },
      vip: {
        type: Number,
        required: true,
        min: [50, 'Price must be at least 50'],
        default: 500
      }
    },
    bookingCutoffMinutes: {
      type: Number,
      default: 15
    },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed'],
      default: 'scheduled',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for optimal show filtering
showSchema.index({ theatreId: 1, showDate: 1 });
showSchema.index({ movieId: 1, showDate: 1 });
showSchema.index({ screenId: 1, showDate: 1 });
showSchema.index({ status: 1, showDate: 1 });

export const Show = mongoose.model('Show', showSchema);
export default Show;
