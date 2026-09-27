"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import ThumbIcon from "@/components/icons/ThumbIcon";
import {
  publishConcertIdea,
  publishConcertIdeaReply,
  reactToConcertIdea,
} from "@/app/projects/[id]/idea-actions";

function ReactionButton({ idea, direction, isSignedIn, detailPath, isPending, onReact }) {
  const label = direction === "like" ? "Me gusta" : "No me gusta";
  const count = direction === "like" ? idea.likeCount : idea.dislikeCount;
  const isActive = idea.userReaction === direction;
  const className = `inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold transition hover:bg-[#FFF7FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#823038] ${
    isActive ? "text-[#0D1821]" : "text-[#823038]"
  }`;
  const content = (
    <>
      <ThumbIcon className="size-4" direction={direction === "like" ? "up" : "down"} />
      {count > 0 ? <span>{count}</span> : null}
    </>
  );

  if (!isSignedIn) {
    return (
      <Link
        aria-label={label}
        className={className}
        href={`/login?next=${encodeURIComponent(`${detailPath}#idea-${idea.id}`)}`}
        title={label}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      aria-label={label}
      aria-pressed={isActive}
      className={className}
      disabled={isPending || idea.pending}
      onClick={() => onReact(idea.id, direction)}
      title={label}
      type="button"
    >
      {content}
    </button>
  );
}

export default function ConcertIdeasSection({
  currentUserName,
  detailPath,
  initialIdeas,
  isSignedIn,
  projectId,
}) {
  const loginPath = `/login?next=${encodeURIComponent(`${detailPath}#ideas`)}`;
  const [ideas, setIdeas] = useState(initialIdeas);
  const [ideaDraft, setIdeaDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  const [postingIdea, setPostingIdea] = useState(false);
  const [postingReplies, setPostingReplies] = useState({});
  const [pendingReactions, setPendingReactions] = useState({});
  const [error, setError] = useState("");
  const postingIdeaRef = useRef(false);
  const postingRepliesRef = useRef(new Set());
  const pendingReactionsRef = useRef(new Set());

  async function handleIdeaSubmit(event) {
    event.preventDefault();
    const message = ideaDraft.trim();
    if (!message || postingIdeaRef.current) return;

    postingIdeaRef.current = true;
    setPostingIdea(true);
    setError("");
    setIdeaDraft("");

    const temporaryId = `pending-${Date.now()}-${Math.random()}`;
    setIdeas((current) => [{
      id: temporaryId,
      authorName: currentUserName || "Fan de Narabi",
      message,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      dislikeCount: 0,
      userReaction: null,
      replies: [],
      pending: true,
    }, ...current]);

    try {
      const savedIdea = await publishConcertIdea(projectId, message);
      setIdeas((current) => current.map((idea) => idea.id === temporaryId ? savedIdea : idea));
    } catch {
      setIdeas((current) => current.filter((idea) => idea.id !== temporaryId));
      setIdeaDraft(message);
      setError("No se pudo publicar la idea. Probá nuevamente.");
    } finally {
      postingIdeaRef.current = false;
      setPostingIdea(false);
    }
  }

  async function handleReplySubmit(event, ideaId) {
    event.preventDefault();
    const details = event.currentTarget.closest("details");
    const message = (replyDrafts[ideaId] || "").trim();
    if (!message || postingRepliesRef.current.has(ideaId)) return;

    postingRepliesRef.current.add(ideaId);
    setPostingReplies((current) => ({ ...current, [ideaId]: true }));
    setError("");
    setReplyDrafts((current) => ({ ...current, [ideaId]: "" }));
    setExpandedReplies((current) => ({ ...current, [ideaId]: true }));

    const temporaryId = `pending-${Date.now()}-${Math.random()}`;
    const optimisticReply = {
      id: temporaryId,
      authorName: currentUserName || "Fan de Narabi",
      message,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setIdeas((current) => current.map((idea) => idea.id === ideaId
      ? { ...idea, replies: [...idea.replies, optimisticReply] }
      : idea));

    try {
      const savedReply = await publishConcertIdeaReply(projectId, ideaId, message);
      setIdeas((current) => current.map((idea) => idea.id === ideaId
        ? { ...idea, replies: idea.replies.map((reply) => reply.id === temporaryId ? savedReply : reply) }
        : idea));
      if (details) details.open = false;
    } catch {
      setIdeas((current) => current.map((idea) => idea.id === ideaId
        ? { ...idea, replies: idea.replies.filter((reply) => reply.id !== temporaryId) }
        : idea));
      setReplyDrafts((current) => ({ ...current, [ideaId]: message }));
      setError("No se pudo publicar la respuesta. Probá nuevamente.");
    } finally {
      postingRepliesRef.current.delete(ideaId);
      setPostingReplies((current) => ({ ...current, [ideaId]: false }));
    }
  }

  async function handleReaction(ideaId, direction) {
    if (pendingReactionsRef.current.has(ideaId)) return;
    const idea = ideas.find((item) => item.id === ideaId);
    if (!idea || idea.pending) return;

    pendingReactionsRef.current.add(ideaId);
    setPendingReactions((current) => ({ ...current, [ideaId]: true }));
    setError("");

    const previous = {
      reaction: idea.userReaction,
      likeCount: idea.likeCount,
      dislikeCount: idea.dislikeCount,
    };
    const next = previous.reaction === direction ? null : direction;
    setIdeas((current) => current.map((item) => item.id === ideaId ? {
      ...item,
      userReaction: next,
      likeCount: Math.max(0, item.likeCount + Number(next === "like") - Number(previous.reaction === "like")),
      dislikeCount: Math.max(0, item.dislikeCount + Number(next === "dislike") - Number(previous.reaction === "dislike")),
    } : item));

    try {
      const saved = await reactToConcertIdea(projectId, ideaId, direction);
      setIdeas((current) => current.map((item) => item.id === ideaId ? {
        ...item,
        userReaction: saved.reaction,
        likeCount: saved.likeCount,
        dislikeCount: saved.dislikeCount,
      } : item));
    } catch {
      setIdeas((current) => current.map((item) => item.id === ideaId ? {
        ...item,
        userReaction: previous.reaction,
        likeCount: previous.likeCount,
        dislikeCount: previous.dislikeCount,
      } : item));
      setError("No se pudo actualizar tu reacción. Probá nuevamente.");
    } finally {
      pendingReactionsRef.current.delete(ideaId);
      setPendingReactions((current) => ({ ...current, [ideaId]: false }));
    }
  }

  return (
    <section className="mt-12 scroll-mt-24 border-t border-[#F2B8CF] pt-10" id="ideas">
      <h2 className="text-2xl font-bold text-[#5C1F3A] sm:text-3xl">
        ¿Querés proponer una idea para un fanproject?
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#8A5468]">
        Escribí abajo y compartila con quienes van al concierto.
      </p>
      {error ? <p className="mt-4 rounded-xl border border-[#EAB0C8] bg-[#FFF7FB] p-3 text-sm text-[#823038]" role="alert">{error}</p> : null}

      {isSignedIn ? (
        <form className="mt-6 rounded-2xl border border-[#F2B8CF] bg-[#FFF7FB] p-4 sm:p-5" onSubmit={handleIdeaSubmit}>
          <label className="text-sm font-semibold text-[#5C1F3A]" htmlFor="concert-idea">
            Tu idea{currentUserName ? `, ${currentUserName}` : ""}
          </label>
          <textarea
            className="mt-3 min-h-28 w-full resize-y rounded-xl border border-[#EAB0C8] bg-white px-3.5 py-3 text-sm text-[#5C1F3A] outline-none placeholder:text-[#B68A9A] focus:border-[#C0567A] focus:ring-2 focus:ring-[#F8C9DE]"
            id="concert-idea"
            maxLength={500}
            name="idea"
            onChange={(event) => setIdeaDraft(event.target.value)}
            placeholder="¿Qué podríamos preparar para este concierto?"
            required
            rows={4}
            value={ideaDraft}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#9B697A]">Máximo 500 caracteres.</span>
            <button className="rounded-full bg-[#823038] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5C1F3A] disabled:opacity-60" disabled={postingIdea} type="submit">
              {postingIdea ? "Publicando..." : "Publicar idea"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-[#EAB0C8] bg-[#FFF7FB] p-4">
          <p className="text-sm text-[#8A5468]">Iniciá sesión para proponer una idea.</p>
          <Link className="rounded-full bg-[#823038] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5C1F3A]" href={loginPath}>
            Iniciar sesión
          </Link>
        </div>
      )}

      <div className="mt-7 space-y-4">
        {ideas.length ? ideas.map((idea) => (
          <article className="scroll-mt-24 rounded-2xl border border-[#F2B8CF] bg-white p-4 sm:p-5" id={`idea-${idea.id}`} key={idea.id}>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#FFE4F3] text-sm font-bold text-[#823038]">
                {idea.authorName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#5C1F3A]">{idea.authorName}</h3>
                  <time className="text-xs text-[#9B697A]" dateTime={idea.createdAt || undefined}>{idea.pending ? "Publicando..." : idea.createdAtLabel}</time>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#754B5B]">{idea.message}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {!idea.pending ? (
                    <>
                      <ReactionButton detailPath={detailPath} direction="like" idea={idea} isPending={pendingReactions[idea.id]} isSignedIn={isSignedIn} onReact={handleReaction} />
                      <ReactionButton detailPath={detailPath} direction="dislike" idea={idea} isPending={pendingReactions[idea.id]} isSignedIn={isSignedIn} onReact={handleReaction} />
                    </>
                  ) : null}

                  {idea.pending ? null : isSignedIn ? (
                    <details className="group relative">
                      <summary className="cursor-pointer list-none rounded-full px-2 py-1 text-xs font-semibold text-[#823038] hover:bg-[#FFF7FB] [&::-webkit-details-marker]:hidden">
                        Responder
                      </summary>
                      <form className="mt-3 w-full min-w-60 rounded-xl border border-[#F2B8CF] bg-[#FFF7FB] p-3 sm:min-w-80" onSubmit={(event) => handleReplySubmit(event, idea.id)}>
                        <label className="sr-only" htmlFor={`reply-${idea.id}`}>Responder a {idea.authorName}</label>
                        <textarea
                          className="w-full resize-y rounded-lg border border-[#EAB0C8] bg-white px-3 py-2.5 text-sm text-[#5C1F3A] outline-none placeholder:text-[#B68A9A] focus:border-[#C0567A]"
                          id={`reply-${idea.id}`}
                          maxLength={500}
                          name="reply"
                          onChange={(event) => setReplyDrafts((current) => ({ ...current, [idea.id]: event.target.value }))}
                          placeholder={`Respondé a ${idea.authorName}...`}
                          required
                          rows={3}
                          value={replyDrafts[idea.id] || ""}
                        />
                        <div className="mt-2 flex justify-end">
                          <button className="rounded-full bg-[#823038] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#5C1F3A] disabled:opacity-60" disabled={postingReplies[idea.id]} type="submit">
                            {postingReplies[idea.id] ? "Publicando..." : "Publicar respuesta"}
                          </button>
                        </div>
                      </form>
                    </details>
                  ) : (
                    <Link className="rounded-full px-2 py-1 text-xs font-semibold text-[#823038] hover:bg-[#FFF7FB]" href={loginPath}>Responder</Link>
                  )}
                </div>

                {idea.replies.length ? (
                  <div className="mt-3">
                    <button className="text-xs font-semibold text-[#B53E66] hover:text-[#823038]" onClick={() => setExpandedReplies((current) => ({ ...current, [idea.id]: !current[idea.id] }))} type="button">
                      {expandedReplies[idea.id] ? "Ver menos" : `Ver más (${idea.replies.length} ${idea.replies.length === 1 ? "respuesta" : "respuestas"})`}
                    </button>
                    {expandedReplies[idea.id] ? <div className="mt-3 space-y-3 border-l-2 border-[#F2B8CF] pl-3">
                      {idea.replies.map((reply) => (
                        <article className="rounded-xl bg-[#FFF7FB] p-3" key={reply.id}>
                          <div className="flex items-start gap-2.5">
                            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#F8C9DE] text-xs font-bold text-[#823038]">{reply.authorName.charAt(0).toUpperCase()}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h4 className="text-xs font-bold text-[#5C1F3A]">{reply.authorName}</h4>
                                <time className="text-[11px] text-[#9B697A]" dateTime={reply.createdAt || undefined}>{reply.pending ? "Publicando..." : reply.createdAtLabel}</time>
                              </div>
                              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-[#754B5B]">{reply.message}</p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div> : null}
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        )) : (
          <p className="rounded-2xl border border-dashed border-[#EAB0C8] bg-[#FFF7FB] p-5 text-sm text-[#8A5468]">
            Todavía no hay ideas para este concierto. ¡Proponé la primera!
          </p>
        )}
      </div>
    </section>
  );
}
