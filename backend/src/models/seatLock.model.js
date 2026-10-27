import mongoose from 'mongoose';
import { env } from '../config/env.js';

const seatLockSchema = new mongoose.Schema(
  {
    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: [true, 'Show ID reference is required'],
      index: true
    },
    seatIdentifier: {
      type: String,
      required: [true, 'Seat identifier is required (e.g. A5, C12)'],
      trim: true
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    lockedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // MongoDB TTL index: automatically deletes expired documents!
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: guarantees impossible double-lock collision at database engine level
seatLockSchema.index({ showId: 1, seatIdentifier: 1 }, { unique: true });

export const SeatLock = mongoose.model('SeatLock', seatLockSchema);
export default SeatLock;
