"use client";

import { useEffect, useRef } from "react";

export default function Reveal({ as: Element = "div", children, className = "", ...props }) {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    element.classList.add("home-reveal-ready");
    const observer = new IntersectionObserver(([entry]) => {
      element.classList.toggle("home-reveal-visible", entry.isIntersecting);
    }, { threshold: 0.12 });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <Element {...props} ref={elementRef} className={`home-reveal ${className}`}>{children}</Element>;
}