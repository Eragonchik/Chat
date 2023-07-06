import GithubProvider from "next-auth/providers/github"
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials"



export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({token, user, account}){

      if (account?.access_token) {
        token.access_token = account.access_token
      }

      return {
        ...token, ...user
      }
    },
    async session({session, token}){
      const {iat, exp, access_token, token:getToken} = token;
      if (access_token) {
        return {...session, access_token, iat, exp}
      }
      else {
        return {...session, token : getToken, iat, exp}
      }
    }
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string, 
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: 'Laravel',
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: { label: "Username", type: "email", placeholder: "shvaykayra@ukr.net" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // You need to provide your own logic here that takes the credentials
        // submitted and returns either a object representing a user or value
        // that is false/null if the credentials are invalid.
        // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
        // You can also use the `req` object to obtain additional parameters
        // (i.e., the request IP address)
        const res = await fetch("http://dev.smmup.pro/api/login", {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" }
        })
        const json = await res.json();
  
        // If no error and we have user data, return it
        if (res.ok && json) {

          const user = {
            ...json.data,
            name : 'Guest',
            email: 'someEmail@com',
            image: 'https://img.freepik.com/free-vector/mysterious-mafia-man-smoking-cigarette_52683-34828.jpg?w=826&t=st=1688649301~exp=1688649901~hmac=a58549cd1e7ef5b4be42f7978bab8d6a6245dcd58be513d337e3ea01431ccfc3'
          }

          return user
        }
        // Return null if user data could not be retrieved
        return null
      }
    })
  ],
};