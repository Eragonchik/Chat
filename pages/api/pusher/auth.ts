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

  const stringToColour = (str: string) => {
    let hash = 0;
    str.split('').forEach(char => {
      hash = char.charCodeAt(0) + ((hash << 5) - hash)
    })
    let colour = '#'
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff
      colour += value.toString(16).padStart(2, '0')
    }
    return colour
  }

  const data = {
    user_id: session.user.name,
    user_info: {
      img: session.user.image,
      color: stringToColour(session.user.email)
    }
  };


  const authResponse = pusherServer.authorizeChannel(socketId, channel, data as PresenceChannelData);
  return response.send(authResponse);
};