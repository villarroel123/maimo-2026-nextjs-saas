"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleArrowLeft,
  faCircleArrowRight,
} from "@fortawesome/free-solid-svg-icons";

export default function CircleArrowIcon({ direction, className = "" }) {
  const icon = direction === "right" ? faCircleArrowRight : faCircleArrowLeft;

  return (
    <FontAwesomeIcon
      aria-hidden="true"
      className={className}
      icon={icon}
    />
  );
}
