import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "../../config/index.js";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    passwordHash: {
      type: String,
      required: true,
      // Never returned by a query unless explicitly selected. Without this a
      // stray `findOne()` in a controller would serialize the hash to the
      // client.
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
      index: true,
    },
    /**
     * Incremented on every refresh and on logout.
     *
     * A refresh token carries the version it was issued against. Presenting a
     * token whose version is behind the user's current one means the token was
     * already used - which, since rotation replaces it each time, indicates the
     * token was captured and replayed. That invalidates the whole family rather
     * than just rejecting the one request.
     */
    refreshTokenVersion: {
      type: Number,
      default: 0,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.passwordHash;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/** Hash on the way in, so no caller can accidentally store a plaintext password. */
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("passwordHash")) {
    return next();
  }
  this.passwordHash = await bcrypt.hash(this.passwordHash, config.bcryptSaltRounds);
  next();
});

/**
 * Constant-time password comparison.
 *
 * bcrypt.compare is itself constant-time for a given hash, which is what stops
 * an attacker learning the password by timing the response.
 */
userSchema.methods.verifyPassword = function verifyPassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

const User = mongoose.model("User", userSchema);

export default User;
