export interface IMessage {
  id: number,
  autor: string,
  payload: string,
  color: string
  time: string,
  img: string,
  type: string
  replyingMessage : IMessage
}