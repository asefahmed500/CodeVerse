import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import type { NextAuthConfig } from 'next-auth'
import dbConnect from "@/lib/db"
import { User } from "@/models/User"

export const authOptions: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "repo,user",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).accessToken = token.accessToken;
      
        await dbConnect()
        const user = await User.findOneAndUpdate(
          { email: session.user.email },
          { 
            name: session.user.name,
            image: session.user.image,
            lastLogin: new Date()
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        
        (session.user as any).id = user._id.toString();
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
