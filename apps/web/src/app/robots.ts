/**
 * app/robots.ts
 * Sinh /robots.txt
 */
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Khu vực app đã đăng nhập và trang sau đăng ký không cần lập chỉ mục
        disallow: ["/channels/", "/thank-you"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
