import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-links">
        <Link href="/">소개</Link>
        <Link href="/">이용약관</Link>
        <Link href="/">개인정보처리방침</Link>
        <Link href="/">문의</Link>
      </div>
      <p>© 2024 Utility Wiki. All rights reserved.</p>
    </footer>
  );
}
