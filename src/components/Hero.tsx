import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/trainylab-logo.png";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="flex-1 flex items-center justify-center bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center text-center max-w-2xl mx-auto"
        >
          <img src={logo} alt="Trainylab" className="h-20 md:h-28 w-auto mb-8" />
          <h1 className="text-xl md:text-3xl font-heading leading-none mb-4 tracking-wider">
            A CENTRAL DE TREINOS PARA O <span className="text-gradient">PERSONAL</span>.
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mb-10 font-body">
            Seus alunos, seus treinos, seu app.
          </p>
          <button
            onClick={() => navigate("/cadastro/personal")}
            className="gradient-accent px-8 py-4 rounded-lg font-body font-semibold text-primary-foreground flex items-center gap-2 hover:opacity-90 transition-opacity mb-6"
          >
            Sou Professor
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate("/auth")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Entrar no meu app Trainylab
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
