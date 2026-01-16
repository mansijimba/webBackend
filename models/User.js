const mongoose = require ("mongoose")

const UserSchema = new mongoose.Schema (
    {
        fullName: {
            type:String,
        },
        phone: {
            type: String,
            required: true,
        },
        email: {
            type:String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
          role: {
      type: String,
      enum: ["user"],
      default: "user"
    },
        passwordHistory: {
            type: [
                {
                    hashedPassword: String,
                    createdAt: {
                        type: Date,
                        default: Date.now
                    }
                }
            ],
            default: []
        },
            securityQuestions: {
                type: [
                    {
                        question: { type: String },
                        answerHash: { type: String }
                    }
                ],
                default: []
            },
        passwordExpiry: {
            type: Date,
            default: function() {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 90);
                return expiryDate;
            }
        },
        passwordChangedAt: {
            type: Date,
            default: Date.now
        },
        isPasswordExpired: {
            type: Boolean,
            default: false
        }
        ,
        // Multi-factor auth and lockout fields
        mfaEnabled: {
            type: Boolean,
            default: false
        },
        mfaSecret: {
            type: String,
            default: null
        },
        mfaTempSecret: {
            type: String,
            default: null
        },
        failedLoginAttempts: {
            type: Number,
            default: 0
        },
        lockUntil: {
            type: Date,
            default: null
        },
        isLocked: {
            type: Boolean,
            default: false
        },
        unlockToken: {
            type: String,
            default: null
        },
        unlockTokenExpiry: {
            type: Date,
            default: null
        }
    },
       {
            timestamps: true
        }
    )

// Method to return user without null fields and sensitive data
UserSchema.methods.toCleanJSON = function() {
  const obj = this.toObject();
  const clean = {};
  
  // Include only non-null fields and exclude sensitive fields if null
  const fieldsToInclude = ['_id', 'fullName', 'phone', 'email', 'passwordExpiry', 
    'passwordChangedAt', 'isPasswordExpired', 'failedLoginAttempts', 'isLocked', 
    'mfaEnabled', 'securityQuestions', 'createdAt', 'updatedAt'];
  
  fieldsToInclude.forEach(field => {
    if (obj[field] !== null && obj[field] !== undefined) {
      clean[field] = obj[field];
    }
  });
  
  return clean;
};

module.exports = mongoose.model(
  "User", UserSchema
)
