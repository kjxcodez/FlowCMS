import React from "react";
import { getSession } from "@/lib/session";
import LandingClient from "./landing-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  return <LandingClient session={session} />;
}
