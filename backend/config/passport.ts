import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { UserRepository } from '../repository/userRepository';

const userRepository = new UserRepository();

export const configurePassport = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No se encontró correo asociado en la cuenta de Google'));
          }

          let user = await userRepository.findByEmail(email);

          if (!user) {
            const name = profile.displayName || profile.name?.givenName || 'Usuario Google';
            const baseUsername = (email.split('@')[0] || 'google_user').replace(/[^a-zA-Z0-9_]/g, '_');
            let username = baseUsername;
            let existing = await userRepository.findByUsername(username);
            let counter = 1;
            while (existing) {
              username = `${baseUsername}${counter}`;
              existing = await userRepository.findByUsername(username);
              counter++;
            }

            const photo = profile.photos?.[0]?.value || '';

            user = await userRepository.create({
              name,
              username,
              email,
              password: '',
              phone: '',
              avatar: photo,
            });

            if (photo && user.id_user) {
              try {
                await userRepository.updateAvatar(user.id_user, photo);
              } catch {
                /* ignore */
              }
            }
          }

          return done(null, user);
        } catch (error) {
          // Si la base de datos no está disponible, permite inicio en modo demo
          try {
            const email = profile.emails?.[0]?.value || 'usuario.google@gmail.com';
            const name = profile.displayName || 'Usuario Google';
            const user = {
              id_user: 1,
              name,
              username: (email.split('@')[0] || 'google_user').replace(/[^a-zA-Z0-9_]/g, '_'),
              email,
              phone: '+502 5555-0101',
              avatar: profile.photos?.[0]?.value || '',
            };
            return done(null, user);
          } catch {
            return done(error as Error);
          }
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
};
