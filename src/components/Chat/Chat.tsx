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
  
  const bottomRef = useRef(null);

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
      setMessages((prev) => [...prev, arg.message]);



      if (me.id !== arg.message.autor) {

        audioSound?.play();

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

  useEffect(() => {

    const bottom : HTMLElement = bottomRef?.current!;

    bottom.scrollIntoView({behavior: 'smooth'})

  }, [messages]);

  const sendMessageFunc = () => {
    if (!textOfMessage.length) return
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
      setTextOfMessage("");
      textarea?.blur();
      if (!textOfMessage.length || textOfMessage == ' ') return
      sendMessage(me.info.color as string, textOfMessage);
    }
  };

  return (
    <>
      <div className="container-fluid h-100">
      <button className="btn border-black d-block d-md-none position-absolute" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasWithBothOptions" aria-controls="offcanvasWithBothOptions">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.6401 22H7.36009C6.34927 21.9633 5.40766 21.477 4.79244 20.6742C4.17722 19.8713 3.95266 18.8356 4.18009 17.85L4.42009 16.71C4.69613 15.1668 6.02272 14.0327 7.59009 14H16.4101C17.9775 14.0327 19.3041 15.1668 19.5801 16.71L19.8201 17.85C20.0475 18.8356 19.823 19.8713 19.2077 20.6742C18.5925 21.477 17.6509 21.9633 16.6401 22Z" fill="black"/>
          <path d="M12.5001 12H11.5001C9.29096 12 7.50009 10.2092 7.50009 8.00001V5.36001C7.49743 4.46807 7.85057 3.61189 8.48127 2.98119C9.11197 2.35049 9.96815 1.99735 10.8601 2.00001H13.1401C14.032 1.99735 14.8882 2.35049 15.5189 2.98119C16.1496 3.61189 16.5028 4.46807 16.5001 5.36001V8.00001C16.5001 9.06088 16.0787 10.0783 15.3285 10.8284C14.5784 11.5786 13.561 12 12.5001 12Z" fill="black"/>
        </svg>
        {membersInfo.length}
      </button>

      <div className="offcanvas offcanvas-start users" data-bs-scroll="true" id="offcanvasWithBothOptions" aria-labelledby="offcanvasWithBothOptionsLabel">
        <div className="offcanvas-header">
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          <div className="card">
            <div className="card-body contacts_body">
              <ul className="contacts">
                {membersInfo.map((memberInfo) => (
                  <li key={memberInfo.id} className=" d-flex justify-content-center">
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
          </div>
          
        </div>
      </div>
        <div className="row justify-content-center h-100">
          <div className="col-10 col-md-4 col-xl-3 chat d-flex align-items-center d-none d-md-flex">
            <div className="card mb-sm-3 mb-md-0 contacts_card w-100">
              <div className="card-header"></div>
              <div className="card-body contacts_body">
                <ul className="contacts">
                  {membersInfo.map((memberInfo) => (
                    <li key={memberInfo.id} className=" d-flex justify-content-center">
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
          <div className="col-12 col-md-8 col-xl-6 chat d-flex align-items-center">
            <div className="card w-100">
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
                <div ref={bottomRef} />
              </div>
              <div className="card-footer">
                <div className="input-group">
                  <textarea
                    name=""
                    className="form-control type_msg attach_btn"
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
