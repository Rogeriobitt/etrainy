import { motion } from "framer-motion";
import { Play, Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImg from "@/assets/hero-fitness.jpg";

const Hero = () => {
  const navigate = useNavigate();

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
          <h1 className="text-5xl md:text-7xl font-heading leading-none mb-4 tracking-wider">
            SEU TREINO, DO <span className="text-gradient">SEU JEITO</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-3 font-body max-w-lg">
            Acompanhe sua evolução, receba séries personalizadas e conte com a ajuda da IA junto ao seu personal trainer — na academia ou em qualquer lugar.
          </p>
          <p className="text-sm md:text-base text-primary/80 mb-8 font-body max-w-lg">
            IA integrada ao seu personal para criar treinos inteligentes e acompanhar sua evolução mês a mês.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/auth?cadastro=true")}
              className="gradient-accent px-8 py-4 rounded-lg font-body font-semibold text-primary-foreground flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Play className="w-5 h-5" />
              Começar Agora
            </button>
            <button
              onClick={() => navigate("/treinos-preview")}
              className="bg-secondary px-8 py-4 rounded-lg font-body font-semibold text-secondary-foreground flex items-center gap-2 hover:bg-secondary/80 transition-colors border border-border"
            >
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
