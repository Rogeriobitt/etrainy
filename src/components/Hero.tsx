import { motion } from "framer-motion";
import { Play, Dumbbell } from "lucide-react";
import heroImg from "@/assets/hero-fitness.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-end pb-20 overflow-hidden">
      <img
        src={heroImg}
        alt="Treino intenso na academia"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 gradient-hero" />

      <div className="relative z-10 container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <h1 className="text-6xl md:text-8xl font-heading leading-none mb-4 tracking-wider">
            TREINE EM <span className="text-gradient">CASA</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 font-body max-w-lg">
            Aulas em vídeo e treinos personalizados para você alcançar seus objetivos sem sair de casa.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="gradient-accent px-8 py-4 rounded-lg font-body font-semibold text-primary-foreground flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Play className="w-5 h-5" />
              Começar Agora
            </button>
            <button className="bg-secondary px-8 py-4 rounded-lg font-body font-semibold text-secondary-foreground flex items-center gap-2 hover:bg-secondary/80 transition-colors border border-border">
              <Dumbbell className="w-5 h-5" />
              Ver Treinos
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
