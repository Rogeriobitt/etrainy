import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Users, Sparkles, ClipboardCheck, Loader2 } from "lucide-react";
import { useEffect } from "react";

const PersonalDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12">
        <h1 className="text-3xl md:text-4xl font-heading tracking-wider mb-1">
          Dashboard <span className="text-gradient">Personal</span>
        </h1>
        <p className="text-muted-foreground mb-10">
          Gerencie seus alunos e crie séries personalizadas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Meus Alunos", icon: Users, text: "Em breve: visualize e gerencie seus alunos vinculados." },
            { title: "Criar Série com IA", icon: Sparkles, text: "Em breve: use a assistente para criar séries para seus alunos." },
            { title: "Séries Pendentes", icon: ClipboardCheck, text: "Em breve: revise séries geradas pela IA antes de aprovar." },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="bg-card border border-border rounded-xl p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-heading tracking-wide mb-2">{card.title}</h2>
                <p className="text-sm text-muted-foreground">{card.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PersonalDashboard;
