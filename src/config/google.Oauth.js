import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import  User  from "../models/user.js";
import { generateToken } from "../config/jwt.config.js"; // your existing JWT helper

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const photo = profile.photos?.[0]?.value;

        let existingUser = await User.findOne({ email });
        if (!existingUser) {
          // New user
          existingUser = await User.create({
            name: profile.displayName,
            email,
            googleId: profile.id,
            profilePhoto: photo ? [{ publicId: null, url: photo }] : [],
            role: "user",
            isAdmin: false,
          });
        } else if (!existingUser.googleId) {
          // Existing user without googleId → link account
          existingUser.googleId = profile.id;
          
          await existingUser.save();
        }

        // ✅ Generate JWT token
        const token = generateToken(existingUser);

        // Attach token for callback route
        return done(null, { user: existingUser, token });
      } catch (err) {
        console.error("  Error in Google OAuth:", err);
        return done(err, null);
      }
    }
  )
);

// Not needed if JWT → but keep minimal
passport.serializeUser((data, done) => done(null, data));
passport.deserializeUser((data, done) => done(null, data));

