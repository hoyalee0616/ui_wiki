import Link from "next/link";

function MascotMark() {
  return (
    <img 
      src="/logo_mascot.png" 
      alt="Logo Mascot" 
      className="logo-mark" 
      style={{ objectFit: "contain" }}
    />
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
