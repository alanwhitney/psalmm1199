"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLastPositionUrl } from "@/lib/last-position";

interface Props {
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export default function LastPositionLink({ style, children }: Props) {
  const [href, setHref] = useState("/bible/PSA/119");

  useEffect(() => {
    setHref(getLastPositionUrl());
  }, []);

  return <Link href={href} style={style}>{children}</Link>;
}
