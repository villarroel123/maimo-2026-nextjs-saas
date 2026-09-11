export function getFavoriteKey({ type, projectId, activityId }) {
  if (type === "project") {
    return `project:${projectId}`;
  }

  return `fanproject:${projectId}:${activityId}`;
}
