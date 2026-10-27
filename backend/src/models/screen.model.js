import mongoose from 'mongoose';

const rowSchema = new mongoose.Schema(
  {
    rowLabel: {
      type: String,
      required: true,
      trim: true,
      uppercase: true // e.g. 'A', 'B', 'C'
    },
    category: {
      type: String,
      enum: ['standard', 'premium', 'vip'],
      default: 'standard'
    },
    seatsCount: {
      type: Number,
      required: true,
      min: [1, 'Row must have at least 1 seat']
    },
    accessibleSeats: {
      type: [Number], // Seat indices (1-based) that are wheelchair accessible
      default: []
    }
  },
  { _id: false }
);

const screenSchema = new mongoose.Schema(
  {
    theatreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre reference is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Screen name is required'],
      trim: true // e.g. 'Screen 1 - IMAX Laser'
    },
    screenType: {
      type: String,
      enum: ['Standard', 'IMAX', '4DX', 'Dolby Cinema', 'Gold Class', 'Laser IMAX'],
      default: 'Standard'
    },
    supportedFormats: {
      type: [String],
      default: ['2D', '3D']
    },
    seatingLayout: {
      rows: {
        type: [rowSchema],
        required: true,
        default: [
          { rowLabel: 'A', category: 'vip', seatsCount: 10, accessibleSeats: [1, 2] },
          { rowLabel: 'B', category: 'vip', seatsCount: 10, accessibleSeats: [] },
          { rowLabel: 'C', category: 'premium', seatsCount: 12, accessibleSeats: [] },
          { rowLabel: 'D', category: 'premium', seatsCount: 12, accessibleSeats: [] },
          { rowLabel: 'E', category: 'premium', seatsCount: 12, accessibleSeats: [] },
          { rowLabel: 'F', category: 'standard', seatsCount: 14, accessibleSeats: [] },
          { rowLabel: 'G', category: 'standard', seatsCount: 14, accessibleSeats: [] },
          { rowLabel: 'H', category: 'standard', seatsCount: 14, accessibleSeats: [] }
        ]
      }
    },
    totalCapacity: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'maintenance'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Calculate totalCapacity before save if not explicitly provided
screenSchema.pre('save', function (next) {
  if (this.seatingLayout && this.seatingLayout.rows) {
    this.totalCapacity = this.seatingLayout.rows.reduce(
      (sum, row) => sum + (row.seatsCount || 0),
      0
    );
  }
  next();
});

screenSchema.index({ theatreId: 1, name: 1 });

export const Screen = mongoose.model('Screen', screenSchema);
export default Screen;
