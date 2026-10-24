import mongoose from 'mongoose';

const pickupTaskSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: [true, 'Task must be linked to a donation']
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must be assigned to a volunteer or NGO']
    },
    status: {
      type: String,
      enum: {
        values: ['assigned', 'picked_up', 'delivered', 'cancelled'],
        message: '{VALUE} is not a valid task status'
      },
      default: 'assigned'
    },
    pickedUpAt: {
      type: Date,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    destination: {
      name: { type: String, default: '' }, // e.g. "Hope Community Shelter"
      address: { type: String, default: '' }
    },
    beneficiariesServed: {
      type: Number,
      default: 0
    },
    deliveryNotes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Fast lookups by volunteer and donation
pickupTaskSchema.index({ volunteer: 1, status: 1 });
pickupTaskSchema.index({ donation: 1 });

const PickupTask = mongoose.model('PickupTask', pickupTaskSchema);
export default PickupTask;
