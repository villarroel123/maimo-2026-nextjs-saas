"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThumbsDown,
  faThumbsUp,
} from "@fortawesome/free-solid-svg-icons";

export default function ThumbIcon({ direction, className = "" }) {
  return (
    <FontAwesomeIcon
      aria-hidden="true"
      className={className}
      icon={direction === "down" ? faThumbsDown : faThumbsUp}
    />
  );
}
