import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <>
      <div className="bg-[#FDFDFF] w-screen">
        <Image
          src="/items/ondas.png"
          alt=""
          width={1920}
          height={120}
          className="h-auto w-full"
        />
      </div>

      <footer className=" bg-[#FFE4F3]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-6 text-center text-sm sm:px-6 lg:px-8">
          <div className="min-w-0 text-[#823038]">
            <div className="flex items-center justify-center gap-2">
              <img
                src="/items/narabi_logo.png"
                alt="Fanprojects"
                className="h-8 w-8  object-cover"
              />
              <p className="font-semibold uppercase tracking-[0.14em]">
                NARABI
              </p>
            </div>
            <p className="mt-2 max-w-2xl leading-6">
              Organiza, pensa y elegi los fanprojects para tus conciertos!
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em]">
              Hecho por y para fans
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}