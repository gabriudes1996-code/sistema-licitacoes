"use client";

import { useEffect } from "react";

export default function BiddingDescriptionToggle() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const cell = target.closest(
        ".simpleItemsTable tbody tr td:nth-child(2)"
      ) as HTMLElement | null;

      if (!cell) return;

      cell.classList.toggle("descriptionExpanded");
      cell.setAttribute(
        "aria-expanded",
        cell.classList.contains("descriptionExpanded") ? "true" : "false"
      );
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
