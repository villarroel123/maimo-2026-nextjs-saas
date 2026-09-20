"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment } from "@fortawesome/free-solid-svg-icons";

export default function CommentIcon({ className = "" }) {
  return <FontAwesomeIcon aria-hidden="true" className={className} icon={faComment} />;
}
