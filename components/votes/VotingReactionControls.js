"use client";

import { useRef, useState } from "react";
import { toggleVotingReactionInstant } from "@/app/votaciones/actions";
import LoginRequiredPopup from "@/components/votes/LoginRequiredPopup";
import ThumbIcon from "@/components/icons/ThumbIcon";
import VotingCommentsToggle from "@/components/votes/VotingCommentsToggle";

function ReactionButton({ active, direction, disabled, isSignedIn, onReact }) {
  const label = direction === "like" ? "Me gusta" : "No me gusta";
  const className = `inline-flex size-7 items-center justify-center text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${active ? "text-[#FF9FD6]" : "text-white hover:text-[#FF9FD6]"}`;
  const icon = <ThumbIcon className="size-5" direction={direction === "dislike" ? "down" : "up"} />;

  if (!isSignedIn) {
    return <LoginRequiredPopup className={className} label={label}>{icon}<span className="sr-only">{label}</span></LoginRequiredPopup>;
  }

  return <button aria-label={label} aria-pressed={active} className={className} disabled={disabled} onClick={() => onReact(direction)} title={label} type="button">{icon}<span className="sr-only">{label}</span></button>;
}

export default function VotingReactionControls({ commentCount, initialCounts, initialReaction, isSignedIn, projectId }) {
  const [counts, setCounts] = useState({ like: initialCounts?.like || 0, dislike: initialCounts?.dislike || 0 });
  const [reaction, setReaction] = useState(initialReaction || null);
  const [isPending, setIsPending] = useState(false);
  const pendingRef = useRef(false);

  async function handleReaction(direction) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setIsPending(true);

    const previousReaction = reaction;
    const previousCounts = counts;
    const nextReaction = previousReaction === direction ? null : direction;
    setReaction(nextReaction);
    setCounts((current) => ({
      like: Math.max(0, current.like + Number(nextReaction === "like") - Number(previousReaction === "like")),
      dislike: Math.max(0, current.dislike + Number(nextReaction === "dislike") - Number(previousReaction === "dislike")),
    }));

    const result = await toggleVotingReactionInstant(projectId, direction);
    if (result?.error || result?.requiresLogin) {
      setReaction(previousReaction);
      setCounts(previousCounts);
    } else {
      setReaction(result.reaction ?? null);
    }

    pendingRef.current = false;
    setIsPending(false);
  }

  return (
    <div className="mt-auto flex items-center gap-2 pt-5">
      <ReactionButton active={reaction === "like"} direction="like" disabled={isPending} isSignedIn={isSignedIn} onReact={handleReaction} />
      {counts.like ? <span className="mr-2 text-xs font-semibold text-white/80">{counts.like}</span> : null}
      <ReactionButton active={reaction === "dislike"} direction="dislike" disabled={isPending} isSignedIn={isSignedIn} onReact={handleReaction} />
      {counts.dislike ? <span className="mr-2 text-xs font-semibold text-white/80">{counts.dislike}</span> : null}
      <VotingCommentsToggle commentCount={commentCount} isSignedIn={isSignedIn} panelId={`comentarios-${projectId}`} />
      {commentCount ? <span className="text-xs font-semibold text-white/80">{commentCount}</span> : null}
    </div>
  );
}
