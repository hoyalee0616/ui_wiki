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
    <svg className="mascot-hero" viewBox="0 0 260 210" aria-hidden="true">
      <path
        d="M179 19C179 8.8 187.4 1.5 199.1 1.5H215.9C227.6 1.5 236 8.8 236 19V35.8C236 46 227.6 53.3 215.9 53.3H205.2L188.4 68.5L191.7 52C184 49.3 179 43.2 179 35.8V19Z"
        fill="#ffffff"
        stroke="#e6e9ef"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M207.5 35.1L205.1 32.9C196.6 25.5 202.1 17 207.5 22.5C212.9 17 218.4 25.5 209.9 32.9L207.5 35.1Z"
        fill="#ff7373"
      />

      <ellipse cx="143" cy="199" rx="65" ry="7" fill="#6b5144" opacity="0.13" />
      <path
        d="M46 175C45.5 139.3 61.2 110.7 87.7 98.5"
        fill="none"
        stroke="#6f5648"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
      <path
        d="M83.2 155.6C75.4 167.6 73.8 182.2 80.2 188.8C86.7 195.6 96.2 185.7 99 174.7"
        fill="#fffefd"
        stroke="#6f5648"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M198.8 106.3C210.4 112 217.7 124.9 221.1 139.9C225.3 158 223.7 179.5 215.3 186.2C209.8 190.6 202.6 185 201.8 175.3"
        fill="#fffefd"
        stroke="#6f5648"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M206.2 93.8C215.8 94.8 223.6 102.8 223.4 112C223.2 120.1 216.8 124.1 210.9 121.4C204.9 118.7 200.8 112.9 199.4 106.9"
        fill="#fffefd"
        stroke="#6f5648"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M208.4 96.8L206.7 109.6M214.2 100.2L211.1 111.7M219 105.3L214.8 114.6" stroke="#6f5648" strokeWidth="2.4" strokeLinecap="round" />

      <circle cx="91.5" cy="66.5" r="17" fill="#fff7f2" stroke="#6f5648" strokeWidth="3.8" />
      <circle cx="91.5" cy="66.5" r="9.2" fill="#ffdcd6" />
      <circle cx="164.5" cy="66.5" r="17" fill="#fff7f2" stroke="#6f5648" strokeWidth="3.8" />
      <circle cx="164.5" cy="66.5" r="9.2" fill="#ffdcd6" />
      <path
        d="M64.5 123.5C64.5 77.4 89.6 55.2 128 55.2S191.5 77.4 191.5 123.5C191.5 173.4 169.7 198.4 128 198.4S64.5 173.4 64.5 123.5Z"
        fill="#fffefd"
        stroke="#6f5648"
        strokeWidth="3.8"
        strokeLinejoin="round"
      />
      <path
        d="M75.8 164.6C79.4 178.7 92.7 191.4 113.2 195.8"
        fill="none"
        stroke="#fff0e8"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="105.6" cy="117.8" r="5.8" fill="#3e312b" />
      <circle cx="150.4" cy="117.8" r="5.8" fill="#3e312b" />
      <circle cx="107.5" cy="115.6" r="1.7" fill="#ffffff" />
      <circle cx="152.3" cy="115.6" r="1.7" fill="#ffffff" />
      <ellipse cx="88" cy="132.8" rx="13.5" ry="8.3" fill="#ffd9d5" opacity="0.9" />
      <ellipse cx="168" cy="132.8" rx="13.5" ry="8.3" fill="#ffd9d5" opacity="0.9" />
      <path d="M124.5 128H131.5L128 131.9Z" fill="#3e312b" stroke="#3e312b" strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M128 132.7C124.3 139.2 115.9 138.9 113.4 132.7M128 132.7C131.7 139.2 140.1 138.9 142.6 132.7"
        fill="none"
        stroke="#3e312b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M128 140.2C130.4 145.2 136.4 144.5 138.2 139.3" fill="#ff8d85" stroke="#3e312b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
