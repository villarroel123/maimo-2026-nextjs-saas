"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment } from "@fortawesome/free-solid-svg-icons";

export default function CommentIcon({ color = "currentColor" }) {
  return (
    <FontAwesomeIcon
      aria-hidden="true"
      icon={faComment}
      style={{ color, display: "block", height: 20, width: 20 }}
    />
  );
}
