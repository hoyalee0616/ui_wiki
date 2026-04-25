import Link from "next/link";

function MascotMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 96 78" aria-hidden="true">
      <ellipse cx="48" cy="72" rx="28" ry="3.5" fill="#6b5144" opacity="0.16" />
      <circle cx="27" cy="18" r="10" fill="#fff7f2" stroke="#6f5648" strokeWidth="3.2" />
      <circle cx="69" cy="18" r="10" fill="#fff7f2" stroke="#6f5648" strokeWidth="3.2" />
      <circle cx="27" cy="18" r="5.4" fill="#ffdcd6" />
      <circle cx="69" cy="18" r="5.4" fill="#ffdcd6" />
      <path
        d="M16 44C16 23.8 28.9 10.5 48 10.5S80 23.8 80 44C80 61.8 67.6 70.5 48 70.5S16 61.8 16 44Z"
        fill="#fffefd"
        stroke="#6f5648"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <circle cx="36.4" cy="42.2" r="3.2" fill="#3e312b" />
      <circle cx="59.6" cy="42.2" r="3.2" fill="#3e312b" />
      <ellipse cx="27.7" cy="48.4" rx="6.8" ry="4.3" fill="#ffd9d5" opacity="0.9" />
      <ellipse cx="68.3" cy="48.4" rx="6.8" ry="4.3" fill="#ffd9d5" opacity="0.9" />
      <path d="M45.8 47.2H50.2L48 49.7Z" fill="#3e312b" stroke="#3e312b" strokeWidth="1.4" strokeLinejoin="round" />
      <path
        d="M48 50.5C45.6 55 39.8 54.6 38.5 50.4M48 50.5C50.4 55 56.2 54.6 57.5 50.4"
        fill="none"
        stroke="#3e312b"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <Link className="brand" href="/">
      <MascotMark />
      <span>
        <strong>Gomdol Tool</strong>
        <small>모든 유틸리티를 한 곳에</small>
      </span>
    </Link>
  );
}

export function HeroMascot() {
  return (
    <div className="mascot-hero">
      {/* 
        채팅창에 올려주신 두 번째 귀여운 곰돌이 이미지를 
        프로젝트의 public 폴더 안에 'hero_mascot.png' 라는 이름으로 저장해 주세요!
      */}
      <img 
        src="/hero_mascot.png" 
        alt="Gomdol Mascot" 
        style={{ width: "100%", height: "100%", objectFit: "contain" }} 
      />
    </div>
  );
}
