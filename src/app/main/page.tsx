/* eslint-disable @next/next/no-img-element */
import { authOptions } from "@/lib/auth";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import "./globals.css";
import { pusherServer } from "@/lib/pusher";
import Image from 'next/image'
import { Chat } from "@/components/Chat/Chat";

export const metadata: Metadata = {
  title: "Page",
};

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const sendMessage = async (color : string, payload : string, type : string) => {
    "use server";

    const time =  (new Date).getHours() + ':' + (new Date).getMinutes() + ':' + (new Date).getSeconds();

    pusherServer.trigger("presence-channel", "message-send", {
      message: {
        id: +Date.now(),
        autor: session.user?.name,
        payload,
        color,
        time: time,
        img: session.user?.image,
        type
      },
    }).catch((e) => console.log(e));
  };

  return (
    <div className="body">
      <Chat sendMessage={sendMessage}/>
    </div>
  );
}
