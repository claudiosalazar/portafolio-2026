"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./page.module.scss";

gsap.registerPlugin(useGSAP);

export default function Home() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".hero-title", {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    });
  }, { scope: container });

  return (
    <main ref={container} className={styles.main}>
      <div className={styles.heroSection}>
        <h1 className="hero-title">Claudio Salazar</h1>
        <p className="hero-subtitle">Frontend Developer UI/UX</p>
      </div>
    </main>
  );
}
