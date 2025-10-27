"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DocsPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/docs/how-it-works");
  }, [router]);

  return null;
}
