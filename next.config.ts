import type { NextConfig } from "next"
import withSerwistInit from "@serwist/next"

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
})

const nextConfig: NextConfig = {
  // Dev-only: origins allowed to reach Next's dev endpoints. Without a matching
  // entry the dev client is blocked, React never hydrates, and client-only UI
  // (the invoice preview's fit-to-width scaling) never runs. The wildcard keeps
  // this working when DHCP changes the LAN address.
  allowedDevOrigins: ["192.168.0.*", "192.168.0.42", "10.247.143.190"],
}

export default withSerwist(nextConfig)
