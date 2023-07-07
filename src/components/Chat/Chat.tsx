"use client";

import { pusherClient } from "@/lib/pusher";
import { Members } from "pusher-js";
import {
  FC,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { IMember } from "@/interfces/member";
import { IMessage } from "@/interfces/message";

export const Chat: FC<{
  sendMessage: (color: string, text: string) => void;
}> = (props) => {


  const audioIn = useRef<HTMLAudioElement | undefined>( typeof Audio !== "undefined" ? new Audio("/sounds/in.mp3") : undefined );
  const audioOut = useRef<HTMLAudioElement | undefined>( typeof Audio !== "undefined" ? new Audio("/sounds/out.mp3") : undefined );

  const [messages, setMessages] = useState([] as IMessage[]);
  const [membersInfo, setMembersInfo] = useState([] as IMember[]);
  const [textOfMessage, setTextOfMessage] = useState("");
  const [audioSound, setAudioSound] = useState(audioIn.current);

  const [me, setMe] = useState({} as IMember);

  const { sendMessage } = props;

  const onFucusHandler = () => {

    setAudioSound(audioIn.current);

  };

  const onBlurHandler = () => {

    setAudioSound(audioOut.current);

  };

  useEffect(() => {
    
    window.addEventListener('focus', onFucusHandler);
    window.addEventListener('blur', onBlurHandler);

    return () => {
      window.removeEventListener('focus', onFucusHandler);
      window.removeEventListener('blur', onBlurHandler);
    }

  }, [])

  useEffect(() => {

    function messageSendHandler(arg: { message: IMessage }) {
      setMessages((prev) => [arg.message, ...prev]);

      if (me.id !== arg.message.autor) {

        audioSound.play();

      } 
      
    }

    function subscriptionSucceededHandler(members: Members) {
      let intualMembers: IMember[] = [];

      setMe({ ...members.me });

      members.each((member: IMember) => {
        intualMembers.push(member);
      });

      setMembersInfo(intualMembers);
    }

    function memberAddedHandler(member: IMember) {
      setMembersInfo((prev) => [member, ...prev]);
    }

    function memberRemovedHandler(member: IMember) {
      setMembersInfo((prev) => [
        ...prev.filter((item) => item.id != member.id),
      ]);
    }
    const channel = pusherClient.subscribe("presence-channel");

    channel.bind("message-send", messageSendHandler);

    channel.bind("pusher:subscription_succeeded", subscriptionSucceededHandler);

    channel.bind("pusher:member_added", memberAddedHandler);

    channel.bind("pusher:member_removed", memberRemovedHandler);

    return () => {
      pusherClient.unsubscribe("presence-channel");

      channel.unbind("message-send", messageSendHandler);

      channel.unbind(
        "pusher:subscription_succeeded",
        subscriptionSucceededHandler
      );

      channel.unbind("pusher:member_added", memberAddedHandler);

      channel.unbind("pusher:member_removed", memberRemovedHandler);
    };
  }, [me.id, audioSound]);

  const sendMessageFunc = () => {
    sendMessage(me.info.color as string, textOfMessage);
    setTextOfMessage("");
  };

  const clearMessage = () => {
    const textarea = document.querySelector("textarea");
    setTextOfMessage("");
    textarea?.blur();
  };

  const onKeyDownHandler = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    const textarea = document.querySelector("textarea");

    if (event.key == "Enter") {
      sendMessage(me.info.color as string, textOfMessage);
      setTextOfMessage("");
      textarea?.blur();
    }
  };

  return (
    <>
      <div className="container-fluid h-100">
        <div className="row justify-content-center h-100">
          <div className="col-md-4 col-xl-3 chat">
            <div className="card mb-sm-3 mb-md-0 contacts_card">
              <div className="card-header"></div>
              <div className="card-body contacts_body">
                <ul className="contacts">
                  {membersInfo.map((memberInfo) => (
                    <li key={memberInfo.id}>
                      <div className="d-flex bd-highlight">
                        <div className="img_cont">
                          <Image
                            src={memberInfo.info.img}
                            width={500}
                            height={500}
                            className="rounded-circle user_img"
                            alt="Picture of the author"
                          />
                          <span
                            className="online_icon"
                            style={{
                              backgroundColor: memberInfo.info.color,
                            }}></span>
                        </div>
                        <div className="user_info">
                          <span>{memberInfo.id}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card-footer"></div>
            </div>
          </div>
          <div className="col-md-8 col-xl-6 chat">
            <div className="card">
              <div className="card-body msg_card_body">
                {messages.map((message) => {
                  const isMe = message.autor == me.id;

                  return (
                    <div
                      key={message.id}
                      className={
                        "d-flex mb-4 " +
                        (isMe ? "justify-content-end" : "justify-content-start")
                      }>
                      {!isMe && (
                        <div className="img_cont_msg">
                          <Image
                            src={message.img}
                            width={38}
                            height={38}
                            className="rounded-circle user_img_msg"
                            alt="Picture of the author"
                          />
                        </div>
                      )}
                      <div
                        className="msg_cotainer"
                        style={{ backgroundColor: message.color }}>
                        {message.text}
                        <span className="msg_time">{message.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="card-footer">
                <div className="input-group">
                  <div className="input-group-append">
                    <span className="input-group-text attach_btn">
                      <button className="btn" onClick={clearMessage}>
                        Clear
                      </button>
                    </span>
                  </div>
                  <textarea
                    name=""
                    className="form-control type_msg"
                    placeholder="Type your message..."
                    value={textOfMessage}
                    onChange={(e) => setTextOfMessage(e.target.value)}
                    onKeyDown={onKeyDownHandler}></textarea>
                  <div className="input-group-append">
                    <span className="input-group-text send_btn">
                      <button className="btn" onClick={sendMessageFunc}>
                        Send
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
