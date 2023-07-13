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
import EmojiPicker, {Emoji, EmojiClickData} from 'emoji-picker-react';
import Typing from "../Typing/Typing";

export const Chat: FC<{
  sendMessage: (payload: string, type: string, replyingMessage : IMessage | null) => void,
  userTyping: (user: string) => void,
  readMessages: (user: string) => void
}> = (props) => {
  
  const bottomRef = useRef(null);

  const mediaRecorder = useRef<null | MediaRecorder>(null);
  const chunks = useRef<Blob[]>([]);

  const audio = useRef<HTMLAudioElement | undefined>( typeof Audio !== "undefined" ? new Audio("/sounds/in.mp3") : undefined );

  const [isRecording, setIsRecording] = useState(false);
  const typeOfMessage = useRef('text');
  const [audioMessage, setAudioMessage] = useState<string>('');
  const imageMessage = useRef<string>('');

  const [isEmojiPikerShow, setIsEmojiPikerShow] = useState(false);

  const [messages, setMessages] = useState([] as IMessage[]);
  const [membersInfo, setMembersInfo] = useState([] as IMember[]);
  const [textOfMessage, setTextOfMessage] = useState("");

  const [isReplying , setIsReplying] = useState(false);
  const replyingMessage = useRef<IMessage | null>(null);

  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const canPublish = useRef<boolean>(true);
  const timer = useRef< ReturnType<typeof setTimeout> >();

  const me = useRef({} as IMember);

  const { sendMessage, userTyping, readMessages } = props;

  useEffect(() => {

    if(audioMessage || textOfMessage) {

      if(canPublish.current) {
        userTyping(me.current.id);
    
        canPublish.current = false;

        setTimeout(function() {
          canPublish.current = true;
        }, 200);

      }

    }

  }, [audioMessage, textOfMessage, userTyping])

  function blobToBase64(blob : Blob) {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  const onMessageClick = (event : React.PointerEvent, message : IMessage) => {
    event.preventDefault();
    replyingMessage.current = message;
    setIsReplying(true);
  } 

  const CancelReplying = () => {
    replyingMessage.current = null;
    setIsReplying(false);
  };

  const ReadAllNotMineMessages = () => {

    setMessages((prev) =>  {

      return prev.map((message) => {
        if (me.current.id !== message.autor) {

          message.isRead = true;

        }
        return message
      })

    });

  };

  const ReadAllMeMessages = () => {

    setMessages((prev) =>  {

      return prev.map((message) => {
        if (me.current.id == message.autor) {

          message.isRead = true;

        }
        return message
      })

    });

  };

  const onFucusHandler = () => {

    audio.current = new Audio("/sounds/in.mp3");

    ReadAllNotMineMessages();

    readMessages(me.current.id);


  };

  const onBlurHandler = () => {

    audio.current = new Audio("/sounds/out.mp3");

  };

  const changeHandler = async () => {
    const input : HTMLInputElement | null = document.querySelector('input[type=file]');

    if (!input!.files!.length) return

    for (let i = 0 ; i < input!.files!.length; i++) {
      imageMessage.current = await blobToBase64(input!.files![i]);
      typeOfMessage.current = 'image';
      sendMessageFunc();
    }
  }

  useEffect(() => {

    const input = document.querySelector('input[type=file]');

    input?.addEventListener('change', changeHandler)
    
    window.addEventListener('focus', onFucusHandler);
    window.addEventListener('blur', onBlurHandler);
    window.addEventListener('click', onFucusHandler);

    return () => {
      window.removeEventListener('focus', onFucusHandler);
      window.removeEventListener('blur', onBlurHandler);
      window.removeEventListener('click', onFucusHandler);
      input?.removeEventListener('change', changeHandler)
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {

    function messageSendHandler(arg: { message: IMessage }) {


      if (me.current.id !== arg.message.autor) {

        audio.current?.play();

      }
      
      setMessages((prev) => [...prev, arg.message]);

    }

    function userReadMessagesHandler({ user } : { user : string }){

      if (me.current.id != user) {
        ReadAllMeMessages();
      }

    }

    function userTypingHandler({ user } : { user : string }) {

      setTypingUsers(users => {

        if (!users.includes(user)) {

          
          clearTimeout(timer.current);
          timer.current = setTimeout( () => {
            setTypingUsers((prev) => { return ([...prev].filter((item) => item != user)) } )
          }, 900);

          return [...users, user]
        }
        else {
          return users
        }

      });
      
    }

    function subscriptionSucceededHandler(members: Members) {
      let intualMembers: IMember[] = [];

      me.current = members.me;

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

    channel.bind("user-typing", userTypingHandler);

    channel.bind("user-read-messages", userReadMessagesHandler);

    channel.bind("pusher:member_added", memberAddedHandler);

    channel.bind("pusher:member_removed", memberRemovedHandler);

    return () => {
      pusherClient.unsubscribe("presence-channel");

      channel.unbind("message-send", messageSendHandler);

      channel.unbind("pusher:subscription_succeeded", subscriptionSucceededHandler);

      channel.unbind("user-typing", userTypingHandler);

      channel.unbind("user-read-messages", userReadMessagesHandler);

      channel.unbind("pusher:member_added", memberAddedHandler);

      channel.unbind("pusher:member_removed", memberRemovedHandler);
    };
  }, []);

  useEffect(() => {

    const bottom : HTMLElement = bottomRef?.current!;

    bottom.scrollIntoView({behavior: 'smooth'})

  }, [messages]);

  const sendMessageFunc = (event? : React.MouseEvent) => {
    const textarea = document.querySelector('textarea');
    if (typeOfMessage.current == 'audio') {
      sendMessage(audioMessage, 'audio', replyingMessage.current);
      chunks.current = [];
      mediaRecorder.current = null;
      setAudioMessage('');
    } 
    else if (typeOfMessage.current == 'image') {
      sendMessage(imageMessage.current!, 'image', replyingMessage.current);
      imageMessage.current = '';
    }
    else if (typeOfMessage.current == 'text') {
      if (!textOfMessage.length) return
      sendMessage(textOfMessage, 'text', replyingMessage.current);
      setTextOfMessage("");
      textarea?.focus();
    }
    replyingMessage.current = null;
    setIsReplying(false);
    typeOfMessage.current = 'text';
  };


  const onKeyDownHandler = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {

    if (event.key == "Enter") {
      event.preventDefault();

      if (typeOfMessage.current == 'audio') {
        sendMessage(audioMessage, 'audio', replyingMessage.current);
        chunks.current = [];
        mediaRecorder.current = null;
        setAudioMessage('');
      }
      else if (typeOfMessage.current == 'text') {
        if (!textOfMessage.length || textOfMessage == ' ') return
        sendMessage(textOfMessage, 'text', replyingMessage.current);
        setTextOfMessage("");
      }
      replyingMessage.current = null;
      setIsReplying(false);
      typeOfMessage.current = 'text';
    }
  };

  const addEmoji = (emojiData: EmojiClickData, event: MouseEvent) => {
    setTextOfMessage((prev) => prev + emojiData.emoji)
  };

  const OnMouseDownHandler = async(event : React.PointerEvent) => {

    event.preventDefault();

    let stream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
    mediaRecorder.current = new MediaRecorder(stream);

    mediaRecorder.current.ondataavailable = (e : BlobEvent) => {
      chunks.current.push(e.data);
    };

    mediaRecorder.current.onstop = async (e) => {
      const body = document.body;
      const audio = document.createElement("audio");
      body.appendChild(audio);
      const blob = new Blob(chunks.current, { type: "audio/ogg; codecs=opus" });
      setAudioMessage(await blobToBase64(blob));
      chunks.current = [];
      setIsRecording(false);
      typeOfMessage.current = 'audio';
    }

    mediaRecorder.current.start()
    setIsRecording(true)

    setTimeout(() => {
      mediaRecorder.current!.stop()
    }, 400)

  };

  return (
    <>
      <div className="container-fluid h-100">
        <div className="offcanvas offcanvas-start users" data-bs-scroll="true" id="offcanvasWithBothOptions" aria-labelledby="offcanvasWithBothOptionsLabel">
          <div className="offcanvas-header">
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body">
            <div className="card">
              <div className="card-body contacts_body">
                <ul className="contacts">
                  {membersInfo.map((memberInfo) => (
                    <li key={memberInfo.id} className=" d-flex mr-30">
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
                            className="online_icon"></span>
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
                    <li key={memberInfo.id} className="d-flex">
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
                            className="online_icon"></span>
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
              <button className="btn border-black d-block d-md-none users_btn" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasWithBothOptions" aria-controls="offcanvasWithBothOptions">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.6401 22H7.36009C6.34927 21.9633 5.40766 21.477 4.79244 20.6742C4.17722 19.8713 3.95266 18.8356 4.18009 17.85L4.42009 16.71C4.69613 15.1668 6.02272 14.0327 7.59009 14H16.4101C17.9775 14.0327 19.3041 15.1668 19.5801 16.71L19.8201 17.85C20.0475 18.8356 19.823 19.8713 19.2077 20.6742C18.5925 21.477 17.6509 21.9633 16.6401 22Z" fill="black"/>
                  <path d="M12.5001 12H11.5001C9.29096 12 7.50009 10.2092 7.50009 8.00001V5.36001C7.49743 4.46807 7.85057 3.61189 8.48127 2.98119C9.11197 2.35049 9.96815 1.99735 10.8601 2.00001H13.1401C14.032 1.99735 14.8882 2.35049 15.5189 2.98119C16.1496 3.61189 16.5028 4.46807 16.5001 5.36001V8.00001C16.5001 9.06088 16.0787 10.0783 15.3285 10.8284C14.5784 11.5786 13.561 12 12.5001 12Z" fill="black"/>
                </svg>
                {membersInfo.length}
              </button>
              <div className="card-body msg_card_body mt-5">
                {messages.map((message) => {
                  const isMe = message.autor == me.current.id;
                  const isRead = message.isRead;
                  const type = message.type;
                  const isReplyingMessage = message.replyingMessage != null ? true : false;
                  const replyingMessage = message.replyingMessage;
                  const timeOfMessage = new Date(message.time)
                  const timeInFormat =  timeOfMessage.getHours() + ':' + timeOfMessage.getMinutes() + ':' + timeOfMessage.getSeconds();

                  return (
                    <div
                    onPointerDown={ (e) => onMessageClick(e, message)}
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
                        className={(isMe ? "msg_cotainer_send " : "msg_cotainer ") + (isRead ? "" : "opacity-50 ")}>
                        {
                        isReplyingMessage && 
                        <div className="d-flex align-items-center replyingMessage">
                          {replyingMessage.autor} : 
                          { replyingMessage.type == 'audio' && <audio controls={true} src={replyingMessage.payload}></audio>}
                          { replyingMessage.type == 'image' && 
                              <Image
                                src={replyingMessage.payload}
                                width={600}
                                height={600}
                                quality={20}
                                className="user_img"
                                alt="Picture of the author"
                              />
                            }
                          { replyingMessage.type == 'text' && replyingMessage.payload as string }
                        </div>
                        }
                        { type == 'audio' && <audio controls={true} src={message.payload}></audio>}
                        { type == 'image' && 
                            <Image
                              src={message.payload}
                              width={600}
                              height={600}
                              quality={20}
                              className="user_img"
                              alt="Picture of the author"
                            />
                          }
                        { type == 'text' && message.payload as string }
                        <span className="msg_time">{timeInFormat}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="card-footer position-relative">
                <div className="typing_container d-flex">
                  {typingUsers.map((user) => {

                    const isMe = user == me.current.id;

                    if (!isMe) {
                      return (<Typing key={user} name={user}/>)
                    }

                  })}
                </div>
                {
                  isReplying && 
                  <div className="replyingMessage mb-1 d-flex align-items-center">
                    <b>{replyingMessage.current?.autor}</b> : 
                      { replyingMessage.current?.type == 'audio' && <audio controls={true} src={replyingMessage.current?.payload}></audio>}
                      { replyingMessage.current?.type == 'image' && 
                        <Image
                          src={replyingMessage.current?.payload}
                          width={600}
                          height={600}
                          quality={20}
                          className="user_img"
                          alt="Picture of the author"
                        />
                        }
                      { replyingMessage.current?.type == 'text' && replyingMessage.current?.payload as string }
                    <button type="button" className="btn-close position-absolute me-4 end-0" aria-label="Close" onPointerDown={CancelReplying}></button>
                  </div>
                }
                <div className="input-group ]">
                  <div className="input-group-append  d-flex input-group-text send_btn btn_group_right">
                      <input type="file" id="input-file" multiple={true} accept="image/*" style={{display:'none'}}/>
                      <label htmlFor="input-file" className="btn text-black">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M5.28977 13.27H9.28977C10.5507 13.2476 11.5924 14.2491 11.6198 15.51V19.51C11.6143 20.7724 10.5922 21.7945 9.32977 21.8H5.32977C4.06883 21.8167 3.03168 20.8108 3.00977 19.55V15.55C3.00977 14.2908 4.03056 13.27 5.28977 13.27ZM9.28977 20.3C9.72607 20.3 10.0798 19.9463 10.0798 19.51V15.51C10.0798 15.3013 9.99623 15.1014 9.84778 14.9549C9.69934 14.8083 9.49836 14.7273 9.28977 14.73H5.28977C5.0829 14.73 4.8845 14.8121 4.73822 14.9584C4.59194 15.1047 4.50977 15.3031 4.50977 15.51V19.51C4.50973 19.9424 4.85737 20.2945 5.28977 20.3H9.28977Z" fill="black"/>
                          <path d="M8.05977 16.78V16.21C8.05977 15.7957 7.72398 15.46 7.30977 15.46C6.89555 15.46 6.55977 15.7957 6.55977 16.21V16.78H5.99977C5.58555 16.78 5.24977 17.1157 5.24977 17.53C5.24977 17.9442 5.58555 18.28 5.99977 18.28H6.56977V18.86C6.56977 19.2742 6.90555 19.61 7.31977 19.61C7.73398 19.61 8.06977 19.2742 8.06977 18.86V18.28H8.64977C9.06398 18.28 9.39977 17.9442 9.39977 17.53C9.39977 17.1157 9.06398 16.78 8.64977 16.78H8.05977Z" fill="black"/>
                          <path fillRule="evenodd" clipRule="evenodd" d="M13.0498 2.42996L20.0498 9.42996C20.1986 9.58149 20.2782 9.78775 20.2698 9.99996V17C20.2698 19.6233 18.1431 21.75 15.5198 21.75H12.6498C12.2356 21.75 11.8998 21.4142 11.8998 21C11.8998 20.5857 12.2356 20.25 12.6498 20.25H15.5198C17.3147 20.25 18.7698 18.7949 18.7698 17V10.75H14.5198C13.001 10.75 11.7698 9.51874 11.7698 7.99996V3.73996H9.51977C7.72322 3.74547 6.26976 5.20341 6.26977 6.99996V12C6.26977 12.4142 5.93398 12.75 5.51977 12.75C5.10555 12.75 4.76977 12.4142 4.76977 12V6.99996C4.7591 5.73327 5.25483 4.51478 6.14679 3.61532C7.03874 2.71585 8.25303 2.20992 9.51977 2.20996H12.5198C12.7186 2.21014 12.9092 2.28927 13.0498 2.42996ZM13.2698 4.76996V7.99996C13.2753 8.68641 13.8333 9.23998 14.5198 9.23996H17.7398L13.2698 4.76996Z" fill="black"/>
                        </svg>
                      </label>
                  </div>
                  {
                    typeOfMessage.current == 'audio' ? 
                    <audio className="form-control type_msg" controls={true} src={audioMessage}></audio>
                    :
                    <textarea
                      name=""
                      className="form-control type_msg"
                      placeholder="Type your message..."
                      value={textOfMessage}
                      onChange={(e) => setTextOfMessage(e.target.value)}
                      onKeyDown={onKeyDownHandler}
                    />
                  }
                  <div className="input-group-append d-flex btn_group_left">
                    { isEmojiPikerShow && 
                    <div className="position-absolute emoji_picker">
                      <EmojiPicker lazyLoadEmojis={true} onEmojiClick={addEmoji}/>
                    </div>}
                    <span className="input-group-text send_btn p-0 text-black">
                      <button className="btn" onClick={() =>setIsEmojiPikerShow((prev) => !prev)}>
                      <svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
                        <g id="🔍-Product-Icons" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                            <g id="ic_fluent_emoji_add_24_regular" fill="#212121" fillRule="nonzero">
                                <path d="M17.5,12 C20.5375661,12 23,14.4624339 23,17.5 C23,20.5375661 20.5375661,23 17.5,23 C14.4624339,23 12,20.5375661 12,17.5 C12,14.4624339 14.4624339,12 17.5,12 Z M12.0000002,1.99896738 C17.523704,1.99896738 22.0015507,6.47681407 22.0015507,12.0005179 C22.0015507,12.2637452 21.9913819,12.5245975 21.9714157,12.7827034 C21.5335438,12.3671164 21.0376367,12.012094 20.4972374,11.7307716 C20.3551544,7.16057357 16.6051843,3.49896738 12.0000002,3.49896738 C7.30472352,3.49896738 3.49844971,7.30524119 3.49844971,12.0005179 C3.49844971,16.6060394 7.16059249,20.3562216 11.7317296,20.4979161 C12.0124658,21.0381559 12.3673338,21.5337732 12.7825138,21.9716342 C12.5247521,21.9918733 12.2635668,22.0020684 12.0000002,22.0020684 C6.47629639,22.0020684 1.99844971,17.5242217 1.99844971,12.0005179 C1.99844971,6.47681407 6.47629639,1.99896738 12.0000002,1.99896738 Z M17.5,13.9992349 L17.4101244,14.0072906 C17.2060313,14.0443345 17.0450996,14.2052662 17.0080557,14.4093593 L17,14.4992349 L16.9996498,16.9992349 L14.4976498,17 L14.4077742,17.0080557 C14.2036811,17.0450996 14.0427494,17.2060313 14.0057055,17.4101244 L13.9976498,17.5 L14.0057055,17.5898756 C14.0427494,17.7939687 14.2036811,17.9549004 14.4077742,17.9919443 L14.4976498,18 L17.0006498,17.9992349 L17.0011076,20.5034847 L17.0091633,20.5933603 C17.0462073,20.7974534 17.207139,20.9583851 17.411232,20.995429 L17.5011076,21.0034847 L17.5909833,20.995429 C17.7950763,20.9583851 17.956008,20.7974534 17.993052,20.5933603 L18.0011076,20.5034847 L18.0006498,17.9992349 L20.5045655,18 L20.5944411,17.9919443 C20.7985342,17.9549004 20.9594659,17.7939687 20.9965098,17.5898756 L21.0045655,17.5 L20.9965098,17.4101244 C20.9594659,17.2060313 20.7985342,17.0450996 20.5944411,17.0080557 L20.5045655,17 L17.9996498,16.9992349 L18,14.4992349 L17.9919443,14.4093593 C17.9549004,14.2052662 17.7939687,14.0443345 17.5898756,14.0072906 L17.5,13.9992349 Z M8.46174078,14.7838355 C9.12309331,15.6232213 10.0524954,16.1974014 11.0917655,16.4103066 C11.0312056,16.7638158 11,17.1282637 11,17.5 C11,17.6408778 11.0044818,17.7807089 11.0133105,17.9193584 C9.53812034,17.6766509 8.21128537,16.8896809 7.28351576,15.7121597 C7.02716611,15.3868018 7.08310832,14.9152347 7.40846617,14.6588851 C7.73382403,14.4025354 8.20539113,14.4584777 8.46174078,14.7838355 Z M9.00044779,8.75115873 C9.69041108,8.75115873 10.2497368,9.3104845 10.2497368,10.0004478 C10.2497368,10.6904111 9.69041108,11.2497368 9.00044779,11.2497368 C8.3104845,11.2497368 7.75115873,10.6904111 7.75115873,10.0004478 C7.75115873,9.3104845 8.3104845,8.75115873 9.00044779,8.75115873 Z M15.0004478,8.75115873 C15.6904111,8.75115873 16.2497368,9.3104845 16.2497368,10.0004478 C16.2497368,10.6904111 15.6904111,11.2497368 15.0004478,11.2497368 C14.3104845,11.2497368 13.7511587,10.6904111 13.7511587,10.0004478 C13.7511587,9.3104845 14.3104845,8.75115873 15.0004478,8.75115873 Z" id="🎨-Color"></path>
                            </g>
                        </g>
                      </svg>
                      </button>
                    </span>
                    <span className="input-group-text send_btn p-0 text-black">
                      <button
                        className="btn"
                        onPointerDown={OnMouseDownHandler}
                      >
                        {isRecording ? 
                        'Recording'
                        :
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19.8201 11.75C19.8201 11.3358 19.4843 11 19.0701 11C18.6559 11 18.3201 11.3358 18.3201 11.75C18.3495 13.4783 17.6904 15.1474 16.4879 16.3892C15.2855 17.6311 13.6385 18.3437 11.9101 18.37C10.1817 18.3437 8.53477 17.6311 7.33233 16.3892C6.1299 15.1474 5.47072 13.4783 5.50012 11.75C5.50012 11.3358 5.16434 11 4.75012 11C4.33591 11 4.00012 11.3358 4.00012 11.75C3.97741 15.86 7.07278 19.3185 11.1601 19.75V22.25C11.1601 22.6642 11.4959 23 11.9101 23C12.3243 23 12.6601 22.6642 12.6601 22.25V19.83C16.7783 19.3957 19.8844 15.8905 19.8201 11.75Z" fill="black"/>
                          <path fillRule="evenodd" clipRule="evenodd" d="M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V12ZM12 3.5C10.067 3.5 8.5 5.067 8.5 7V12C8.5 13.933 10.067 15.5 12 15.5C13.933 15.5 15.5 13.933 15.5 12V7C15.5 5.067 13.933 3.5 12 3.5Z" fill="black"/>
                        </svg>
                         }
                        
                      </button>
                    </span>
                    <span className="input-group-text send_btn p-0">
                      <button className="btn text-black" onClick={sendMessageFunc}>
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
