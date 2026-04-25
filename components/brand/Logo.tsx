import Link from "next/link";
import Image from "next/image";

function MascotMark() {
  return (
    <img
      src="/logo.png"
      alt="Logo Mascot"
      className="logo-mark"
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
      <Image
        src="/logo2.png"
        alt="Gomdol Mascot"
        width={260}
        height={202}
        className="hero-mascot-image"
        priority
      />
    </div>
  );
}
