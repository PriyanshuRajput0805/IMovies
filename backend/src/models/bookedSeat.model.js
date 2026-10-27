import mongoose from 'mongoose';

const bookedSeatSchema = new mongoose.Schema(
  {
    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: [true, 'Show ID reference is required'],
      index: true
    },
    seatIdentifier: {
      type: String,
      required: [true, 'Seat identifier is required'],
      trim: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: guarantees impossible double-booking at database engine level
bookedSeatSchema.index({ showId: 1, seatIdentifier: 1 }, { unique: true });

export const BookedSeat = mongoose.model('BookedSeat', bookedSeatSchema);
export default BookedSeat;
