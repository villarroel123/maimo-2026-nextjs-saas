export default function UserForm({
  action,
  user,
  showCredentials = false,
  submitLabel = "Guardar",
}) {
  return (
    <form
      action={action}
      className="grid min-w-0 gap-4 rounded-2xl border border-[#823038]/15 bg-[#FDFDFF] p-4 sm:p-5"
    >
      {showCredentials ? (
        <label className="grid gap-2 text-sm font-medium text-[#823038]">
          <span>Email</span>

          <input
            className="h-11 rounded-xl border border-[#823038]/20 bg-[#FFE4F3]/40 px-3 text-[#823038] outline-none transition placeholder:text-[#823038]/40 focus:border-[#823038] focus:bg-[#FFE4F3]"
            name="email"
            type="email"
            defaultValue={user?.email || ""}
            required
          />
        </label>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-[#823038]">
        <span>Nombre visible</span>

        <input
          className="h-11 rounded-xl border border-[#823038]/20 bg-[#FFE4F3]/40 px-3 text-[#823038] outline-none transition placeholder:text-[#823038]/40 focus:border-[#823038] focus:bg-[#FFE4F3]"
          name="displayName"
          defaultValue={user?.displayName || ""}
        />
      </label>

      {showCredentials ? (
        <label className="grid gap-2 text-sm font-medium text-[#823038]">
          <span>Contraseña</span>

          <input
            className="h-11 rounded-xl border border-[#823038]/20 bg-[#FFE4F3]/40 px-3 text-[#823038] outline-none transition placeholder:text-[#823038]/40 focus:border-[#823038] focus:bg-[#FFE4F3]"
            name="password"
            type="password"
            minLength={6}
            required
          />
        </label>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-[#823038]">
        <span>Tipo de usuario</span>

        <select
          className="h-11 rounded-xl border border-[#823038]/20 bg-[#FFE4F3]/40 px-3 text-[#823038] outline-none transition focus:border-[#823038] focus:bg-[#FFE4F3]"
          name="user_type"
          defaultValue={user?.user_type || "user"}
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </label>

      <button
        className="mt-2 h-11 w-full rounded-xl border border-[#823038] bg-[#823038] px-4 text-sm font-semibold text-[#FDFDFF] transition hover:bg-[#5C1F3A]"
        type="submit"
      >
        {submitLabel}
      </button>
    </form>
  );
}