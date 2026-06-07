const Hero = () => {
  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://www.netcarshow.com/R/Lamborghini-Urus_S-2023-thb.jpg"
          className="w-full h-full object-cover opacity-60"
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black" />
      </div>

      <div className="relative z-10 text-center px-4">
        <span className="text-gold tracking-[0.5em] uppercase text-xs mb-4 block">
          Inżynieria Marzeń
        </span>
        
        <h1 className="text-6xl md:text-8xl font-serif italic mb-8 tracking-tighter text-white">
          Kolekcja Premium
        </h1>
        
        <a 
          href="#kolekcja" 
          className="border border-white/30 px-12 py-4 text-[10px] uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all inline-block backdrop-blur-sm"
        >
          Pokaż Kolekcję
        </a>
      </div>
    </section>
  );
};

// TEJ LINIJKI BRAKOWAŁO:
export default Hero;