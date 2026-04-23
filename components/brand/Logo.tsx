import Link from "next/link";

function MascotMark() {
  return (
    <div className="logo-mark" aria-hidden="true">
      <span className="ear left" />
      <span className="ear right" />
      <span className="face">
        <span className="eye left" />
        <span className="eye right" />
        <span className="mouth" />
      </span>
    </div>
  );
}

export function Logo() {
  return (
    <Link className="brand" href="/">
      <MascotMark />
      <span>
        <strong>Utility Wiki</strong>
        <small>모든 유틸리티를 한 곳에</small>
      </span>
    </Link>
  );
}

export function HeroMascot() {
  return (
    <div className="mascot-hero" aria-hidden="true">
      <div className="speech-bubble">❤</div>
      <div className="mascot-body">
        <span className="ear left" />
        <span className="ear right" />
        <span className="arm left" />
        <span className="arm right" />
        <span className="paw" />
        <span className="face">
          <span className="eye left" />
          <span className="eye right" />
          <span className="blush left" />
          <span className="blush right" />
          <span className="mouth" />
        </span>
      </div>
    </div>
  );
}
