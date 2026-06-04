const Hero = () => {
  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=2000"
          className="w-full h-full object-cover opacity-60"
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black" />
      </div>

      <div className="relative z-10 text-center px-4">
        <span className="text-gold tracking-[0.5em] uppercase text-xs mb-4 block">
          Szwajcarska Precyzja
        </span>
        
        <h1 className="text-6xl md:text-8xl font-serif italic mb-8 tracking-tighter text-white">
          Kolekcja Premium
        </h1>
        
        <a 
          href="#kolekcja" 
          className="border border-white/30 px-12 py-4 text-[10px] uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all inline-block backdrop-blur-sm"
        >
          Pokaż zegarki
        </a>
      </div>
    </section>
  );
};

// TEJ LINIJKI BRAKOWAŁO:
export default Hero;