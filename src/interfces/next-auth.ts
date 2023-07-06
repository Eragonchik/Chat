import NextAuth from "next-auth"

declare module "next-auth" {

  interface Session {
    iat: number,
    exp: number,
    access_token : string,
    token: string
  }

  interface User{
    group : number
  }

}