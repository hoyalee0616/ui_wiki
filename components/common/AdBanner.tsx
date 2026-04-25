"use client";

import { useEffect } from "react";

export function AdBanner() {
  useEffect(() => {
    try {
      // @ts-expect-error adsbygoogle is injected by the AdSense script.
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.warn("AdSense warning:", err);
    }
  }, []);

  return (
    <div className="ad-container" style={{ margin: "32px 0", textAlign: "center", width: "100%", overflow: "hidden", minHeight: "100px" }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5188089974325767"
        data-ad-slot="5704536249"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
