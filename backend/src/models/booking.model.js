import mongoose from 'mongoose';

const selectedSeatSchema = new mongoose.Schema(
  {
    seatIdentifier: {
      type: String,
      required: true,
      trim: true // e.g. "A5"
    },
    rowLabel: {
      type: String,
      required: true
    },
    seatNumber: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      enum: ['standard', 'premium', 'vip'],
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: [true, 'Show reference is required'],
      index: true
    },
    selectedSeats: {
      type: [selectedSeatSchema],
      required: true,
      validate: [(val) => val.length > 0 && val.length <= 10, 'Must select between 1 and 10 seats']
    },
    ticketCount: {
      type: Number,
      required: true,
      min: 1
    },
    priceBreakdown: {
      subtotal: { type: Number, required: true },
      convenienceFee: { type: Number, default: 0 },
      taxes: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true }
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'expired'],
      default: 'pending',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    bookedAt: {
      type: Date,
      default: Date.now
    },
    cancelledAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Helpful compound indexes
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ showId: 1, bookingStatus: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
