import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImg from "@/assets/hero-fitness.jpg";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[85vh] md:min-h-screen flex items-end pb-24 md:pb-20 overflow-hidden">
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
          className="max-w-xl"
        >
          <h1 className="text-4xl md:text-6xl font-heading leading-none mb-4 tracking-wider">
            A CENTRAL DE TREINOS PARA O <span className="text-gradient">PERSONAL</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 font-body">
            Seus alunos, seus treinos, seu app.
          </p>
          <button
            onClick={() => navigate("/cadastro/personal")}
            className="gradient-accent px-8 py-4 rounded-lg font-body font-semibold text-primary-foreground flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            Sou Professor
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
