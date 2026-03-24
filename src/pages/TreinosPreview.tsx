import { useNavigate } from "react-router-dom";
import { ArrowLeft, Dumbbell, Clock, Flame } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TreinosPreview = () => {
  const navigate = useNavigate();

  const { data: classes, isLoading } = useQuery({
    queryKey: ["preview-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_classes")
        .select("id, title, description, duration, calories, tag, thumbnail_url")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <h1 className="text-4xl md:text-5xl font-heading tracking-wider mb-3">
          NOSSOS <span className="text-gradient">TREINOS</span>
        </h1>
        <p className="text-muted-foreground mb-10 max-w-lg">
          Confira as aulas disponíveis na plataforma. Cadastre-se para ter acesso completo.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Dumbbell className="w-8 h-8 animate-pulse text-primary" />
          </div>
        ) : !classes?.length ? (
          <p className="text-muted-foreground text-center py-12">
            Em breve novas aulas serão adicionadas. Volte depois!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors"
              >
                {cls.thumbnail_url ? (
                  <img
                    src={cls.thumbnail_url}
                    alt={cls.title}
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <div className="w-full h-44 bg-secondary flex items-center justify-center">
                    <Dumbbell className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                )}
                <div className="p-5">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    {cls.tag}
                  </span>
                  <h3 className="text-lg font-heading tracking-wide mt-1">{cls.title}</h3>
                  {cls.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {cls.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {cls.duration}
                    </span>
                    {cls.calories && (
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" /> {cls.calories}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TreinosPreview;
