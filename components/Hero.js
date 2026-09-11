export default function Hero() {
  return (
    <section className="relative flex min-h-[85vh] w-full flex-col items-center justify-center px-4 py-20 text-center text-zinc-100 sm:px-6 lg:px-8 overflow-hidden">
      
      <div className="absolute inset-0 z-0">
        <img
          src="/items/hero.jpg"
          alt="Hero background"
          className="w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 bg-[#FFE4F3]/50" />
      </div>

      {/* Contenido centrado */}
      <div className="relative z-10 mx-auto max-w-4xl space-y-6 flex justify-center items-center flex-col">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#823038] border border-[#823038] bg-[#FDFDFF] rounded-full w-[18em]">
          Comunidad de Fans
        </p>
        
        <h1 className="font-[Baloo_2] text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
          Organización de{" "}
          <span className="bg-gradient-to-r from-[#FF9FD6] to-[#FFD670] bg-clip-text text-transparent">
            conciertos
          </span>
        </h1>
        
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-[#823038] sm:text-lg">
          Colabora con fans, organiza actividades, proyectos y sorpresas para tus próximos conciertos!!
        </p>
      </div>
    </section>
  );
}