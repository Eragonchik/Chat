import "./globals.css";

export default function Typing({name} : {name : string}) {
  return (
    <div className="typing">
      {name}
      <div className="typing__dot"></div>
      <div className="typing__dot"></div>
      <div className="typing__dot"></div>
    </div>
  );
}
