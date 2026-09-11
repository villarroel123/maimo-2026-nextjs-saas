"use client";

export default function DeleteActivityButton({ projectId, activityId, activityTitle, deleteAction }) {
  return (
    <form action={deleteAction}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="activityId" value={activityId} />
      <button
        type="submit"
        className="text-xs text-[#C0392B] hover:text-[#a4291f] border border-[#F2B8CF] bg-white px-3 py-1.5 rounded-lg transition font-medium cursor-pointer"
        onClick={(e) => {
          if (!window.confirm(`¿Seguro que deseas eliminar la actividad "${activityTitle}"?`)) {
            e.preventDefault();
          }
        }}
      >
        Eliminar
      </button>
    </form>
  );
}