/* eslint-disable @next/next/no-img-element */
import { authOptions } from "@/lib/auth";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import "./globals.css";
import { pusherServer } from "@/lib/pusher";
import Image from 'next/image'
import { Chat } from "@/components/Chat/Chat";
import { IMessage } from "@/interfces/message";

export const metadata: Metadata = {
  title: "Page",
};

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const sendMessage = async (payload : string, type : string, replyingMessage : IMessage | null) => {
    "use server";

    const time = Date.now();

    pusherServer.trigger("presence-channel", "message-send", {
      message: {
        id: +Date.now(),
        autor: session.user?.name,
        payload,
        time: time,
        img: session.user?.image,
        type,
        replyingMessage,
        isRead : false
      },
    }).catch((e) => console.log(e));
  };

  const userTyping = async (user : string) => {
    "use server";

    pusherServer.trigger("presence-channel", "user-typing", {
      user
    }).catch((e) => console.log(e));
    
  };

  const readMessages = async (user : string) => {
    "use server";

    pusherServer.trigger("presence-channel", "user-read-messages", {
      user
    }).catch((e) => console.log(e));
    
  };

  return (
    <div className="body">
      <Chat sendMessage={sendMessage} userTyping={userTyping} readMessages={readMessages}/>
    </div>
  );
}
