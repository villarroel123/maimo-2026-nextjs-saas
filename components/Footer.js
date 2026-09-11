import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-10 bg-[#FFE4F3]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-6 text-center text-sm text-[#8A5468] sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="flex items-center justify-center gap-2">
            <img
              src="/items/narabi_logo.png"
              alt="Fanprojects"
              className="h-8 w-8  object-cover"
            />
            <p className="font-semibold uppercase tracking-[0.14em] text-[#5C1F3A]">
              NARABI
            </p>
          </div>
          <p className="mt-2 max-w-2xl leading-6">
            Organiza, pensa y elegi los fanprojects para tus conciertos!
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#C0567A]">
            Hecho por y para fans
          </p>
        </div>
      </div>
    </footer>
  );
}