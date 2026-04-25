import Link from "next/link";

function MascotMark() {
  return (
    <img 
      src="/logo.png" 
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
      <img 
        src="/logo2.png" 
        alt="Gomdol Mascot" 
        style={{ width: "100%", height: "100%", objectFit: "contain" }} 
      />
    </div>
  );
}
