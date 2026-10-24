import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donation must have an associated donor']
    },
    foodName: {
      type: String,
      required: [true, 'Please provide the food name / title'],
      trim: true,
      maxlength: [150, 'Food name cannot exceed 150 characters']
    },
    // Retain title for backward compatibility
    title: {
      type: String,
      trim: true
    },
    dietaryType: {
      type: String,
      enum: {
        values: ['veg', 'non-veg', 'vegan'],
        message: '{VALUE} is not a valid dietary type'
      },
      default: 'veg'
    },
    foodType: {
      type: String,
      enum: {
        values: ['cooked_meal', 'raw_ingredients', 'packaged_food', 'bakery_items'],
        message: '{VALUE} is not a valid food type'
      },
      default: 'cooked_meal'
    },
    quantityMeals: {
      type: Number,
      required: [true, 'Please provide the quantity of meals / estimated servings'],
      min: [1, 'Quantity of meals must be at least 1']
    },
    quantity: {
      type: String,
      trim: true,
      default: '' // e.g. "30 boxed trays", "15 kg curry and bread"
    },
    preparationTime: {
      type: Date,
      required: [true, 'Please specify the food preparation time'],
      default: Date.now
    },
    pickupDeadline: {
      type: Date,
      required: [true, 'Please specify the pickup deadline']
    },
    safeConsumptionDeadline: {
      type: Date,
      required: [true, 'Please specify the safe consumption deadline']
    },
    // Synced with pickupDeadline for backward compatibility
    expiryDeadline: {
      type: Date
    },
    storageCondition: {
      type: String,
      enum: ['room_temperature', 'refrigerated', 'frozen', 'hot'],
      default: 'room_temperature'
    },
    pickupAddress: {
      street: {
        type: String,
        required: [true, 'Pickup street address is required'],
        trim: true
      },
      city: {
        type: String,
        required: [true, 'Pickup city is required'],
        trim: true
      },
      state: { type: String, default: '', trim: true },
      postalCode: { type: String, default: '', trim: true },
      landmark: { type: String, default: '', trim: true }
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude] in GeoJSON
        default: undefined
      },
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
        default: null
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
        default: null
      }
    },
    photoUrl: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'accepted', 'picked_up', 'delivered', 'cancelled'],
        message: '{VALUE} is not a valid donation status'
      },
      default: 'available'
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    claimedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    deliveryCodeHash: {
      type: String,
      default: null,
      select: false
    },
    deliveryCodeEncrypted: {
      type: String,
      default: null,
      select: false
    },
    deliveryCodeExpiresAt: {
      type: Date,
      default: null
    },
    deliveryCodeAttempts: {
      type: Number,
      default: 0
    },
    deliveryNotes: {
      type: String,
      trim: true,
      default: ''
    },
    collectorLocation: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
        default: null
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
        default: null
      },
      isArrived: {
        type: Boolean,
        default: false
      },
      arrivedAt: {
        type: Date,
        default: null
      },
      updatedAt: {
        type: Date,
        default: null
      }
    },
    specialInstructions: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to ensure title and expiryDeadline sync
donationSchema.pre('save', function () {
  if (!this.title && this.foodName) {
    this.title = this.foodName;
  }
  if (!this.foodName && this.title) {
    this.foodName = this.title;
  }
  if (!this.expiryDeadline && this.pickupDeadline) {
    this.expiryDeadline = this.pickupDeadline;
  }
  if (this.location && typeof this.location.latitude === 'number' && typeof this.location.longitude === 'number') {
    this.location.coordinates = [this.location.longitude, this.location.latitude];
  }
});

// Fast query indexes
donationSchema.index({ status: 1, pickupDeadline: 1 });
donationSchema.index({ donor: 1, createdAt: -1 });

const Donation = mongoose.model('Donation', donationSchema);
export default Donation;
