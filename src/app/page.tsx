import {
  LoginButton,
  LogoutButton,
} from "@/components/Buttons/buttons.component";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Image from 'next/image'
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        height: "70vh",
      }}
    >
        {session ? 
        <>
          <LogoutButton /> 
          <Link href="/main">Main page</Link>
          {/* {JSON.stringify(session, null, 4)} */}
          {
            <>
              <h3>{session?.user?.name}</h3>
              <Image
                src={session?.user?.image as string}
                alt="Picture of the user"
                width={100}
                height={100}
                quality={100}
              />
            </>
           }
          
        </> 
        : <LoginButton />}
    </main>
  );
}
