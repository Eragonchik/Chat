import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth";
import { PresenceChannelData } from "pusher";


export default async function handler(
  request: NextApiRequest, 
  response: NextApiResponse
) {
  const session = await getServerSession(request, response, authOptions);

  if (!session?.user?.email) {
    return response.status(401);
  }

  const socketId = request.body.socket_id;
  const channel = request.body.channel_name;

  const r = Math.floor(Math.random()*255);
  const g = Math.floor(Math.random()*255);
  const b = Math.floor(Math.random()*255);
  const color = `rgb(${r},${g},${b})`;

  const data = {
    user_id: session.user.name,
    user_info: {
      img: session.user.image,
      color: color
    }
  };


  const authResponse = pusherServer.authorizeChannel(socketId, channel, data as PresenceChannelData);
  return response.send(authResponse);
};