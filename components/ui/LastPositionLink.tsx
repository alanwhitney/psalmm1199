"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLastPositionUrl } from "@/lib/last-position";

interface Props {
  className?: string;
  children: React.ReactNode;
}

export default function LastPositionLink({ className, children }: Props) {
  const [href, setHref] = useState("/bible/PSA/119");

  useEffect(() => {
    setHref(getLastPositionUrl());
  }, []);

  return <Link href={href} className={className}>{children}</Link>;
}
