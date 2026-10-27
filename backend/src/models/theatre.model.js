import mongoose from 'mongoose';

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      required: [true, 'Theatre address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true
    },
    state: {
      type: String,
      trim: true,
      default: ''
    },
    zipCode: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    amenities: {
      type: [String],
      default: [
        'Dolby Atmos',
        '4K Laser Projection',
        'Recliner Seats',
        'Gourmet Food',
        'Parking',
        'Wheelchair Accessible'
      ]
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'under_maintenance'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

theatreSchema.index({ city: 1, status: 1 });
theatreSchema.index({ name: 'text', address: 'text', city: 'text' });

export const Theatre = mongoose.model('Theatre', theatreSchema);
export default Theatre;
