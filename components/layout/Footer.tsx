import Link from "next/link";
import { AdBanner } from "@/components/common/AdBanner";

export function Footer() {
  return (
    <footer className="site-footer">
      <AdBanner />
      <div className="footer-links">
        <Link href="/">소개</Link>
        <Link href="/">이용약관</Link>
        <Link href="/">개인정보처리방침</Link>
        <Link href="/">문의</Link>
      </div>
      <p>© 2024 Gomdol Tool. All rights reserved.</p>
    </footer>
  );
}
