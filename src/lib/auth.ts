
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';
import dbConnect from './db';
import User from '@/models/user';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: "read:user user:email repo" } }, // Request repository access
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await dbConnect();
        if (!credentials?.email || !credentials.password) return null;

        const user = await User.findOne({ email: credentials.email });
        if (!user || !user.password) return null;

        const isPasswordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isPasswordMatch) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      await dbConnect();
      if (account?.provider === 'github') {
        try {
          const existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            await new User({
              email: user.email,
              name: user.name,
              image: user.image,
            }).save();
          } else {
             if (user.name && user.name !== existingUser.name) existingUser.name = user.name;
             if (user.image && user.image !== existingUser.image) existingUser.image = user.image;
             await existingUser.save();
          }
          return true;
        } catch (err) {
          console.error('Error on GitHub sign-in:', err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
       if (user) {
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
