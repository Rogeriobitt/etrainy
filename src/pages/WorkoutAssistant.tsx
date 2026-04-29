import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Lock, ArrowLeft } from "lucide-react";

const WorkoutAssistant = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-heading tracking-wider mb-3">
            Criação de série exclusiva do Personal
          </h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Para garantir um treino seguro e adequado ao seu perfil, a montagem
            da sua série é feita pelo seu Personal Trainer. Fale com ele para
            que sua próxima série seja preparada e aprovada.
          </p>
          <button
            onClick={() => navigate("/aluno/dashboard")}
            className="gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutAssistant;
