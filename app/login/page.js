import { redirect } from "next/navigation";
import { Homemade_Apple, Chiron_GoRound_TC } from "next/font/google";
import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

const homemadeApple = Homemade_Apple({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-homemade-apple",
});

const chironGoRoundTC = Chiron_GoRound_TC({
  subsets: ["latin"],
  weight: "400",
});

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className={`${chironGoRoundTC.className} min-h-screen bg-[#FDFDFF] text-[#823038] pb-17`}>
      <section className="grid min-h-[calc(100vh-65px)] grid-cols-1 lg:grid-cols-2">
        {/* Sobre el proyecto */}
        <div className="flex flex-col items-center justify-center gap-6 bg-[#823038] px-6 text-center text-[#FDFDFF] sm:px-10 lg:items-start lg:px-16 lg:text-left lg:h-[40em] lg:rounded-br-[3rem]">

          <p className={`${homemadeApple.className} text-4xl sm:text-5xl`}>
            Bienvenido a narabi
          </p>

          <p className="max-w-md text-base leading-7 text-[#FDFDFF]/80">
            Narabi es el espacio donde los fans organizan, votan y hacen realidad
            los fanprojects para sus próximos conciertos. Colaborá con tu comunidad,
            proponé ideas y seguí de cerca cada actividad, todo en un solo lugar.
          </p>
        </div>

        {/* Formulario de login */}
        <div className="flex items-center justify-center bg-[#FDFDFF] px-4 py-8 sm:px-5 sm:py-10">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}