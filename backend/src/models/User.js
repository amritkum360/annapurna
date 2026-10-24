import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
      type: String,
      enum: {
        values: ['donor', 'ngo', 'volunteer', 'admin'],
        message: '{VALUE} is not a valid user role'
      },
      default: 'donor'
    },
    phone: {
      type: String,
      trim: true,
      default: '+91 98200 55667'
    },
    organization: {
      type: String,
      trim: true,
      default: '' // e.g. "Green Earth Foundation", "Taj Hotel", "Royal Caterers"
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['pending', 'verified', 'rejected'],
        message: '{VALUE} is not a valid verification status'
      },
      default: 'pending'
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verificationNotes: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' }
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0] // [longitude, latitude]
      }
    }
  },
  {
    timestamps: true
  }
);

// Index for geo-spatial queries (hyperlocal distance search)
userSchema.index({ location: '2dsphere' });

// Pre-save hook to keep isVerified and verificationStatus synchronized
userSchema.pre('save', function () {
  if (this.role === 'ngo') {
    if (!this.verificationStatus) {
      this.verificationStatus = this.isVerified ? 'verified' : 'pending';
    }
    this.isVerified = this.verificationStatus === 'verified';
  } else {
    if (!this.verificationStatus) {
      this.verificationStatus = 'verified';
    }
    this.isVerified = true;
  }
});

const User = mongoose.model('User', userSchema);
export default User;
