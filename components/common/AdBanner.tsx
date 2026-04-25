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
    <div className="ad-container" style={{ margin: "32px auto", textAlign: "center", width: "100%", overflowX: "hidden", minHeight: "100px" }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", overflow: "hidden" }}
        data-ad-client="ca-pub-5188089974325767"
        data-ad-slot="5704536249"
        data-ad-format="auto"
        data-full-width-responsive="false"
      ></ins>
    </div>
  );
}
