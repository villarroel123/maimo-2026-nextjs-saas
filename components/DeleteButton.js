"use client";

export default function DeleteButton({ projectId, projectTitle, deleteAction }) {
  return (
    <form action={deleteAction}>
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="submit"
        className="text-xs text-[#C0392B] hover:text-[#a4291f] border border-[#F2B8CF] bg-white px-3 py-2 rounded-lg transition font-medium cursor-pointer"
        onClick={(e) => {
          if (!window.confirm(`¿Seguro que deseas eliminar el concierto "${projectTitle}"?`)) {
            e.preventDefault();
          }
        }}
      >
        Eliminar
      </button>
    </form>
  );
}