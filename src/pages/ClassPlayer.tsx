import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Clock, Flame, Loader2 } from "lucide-react";

const ClassPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: cls, isLoading } = useQuery({
    queryKey: ["video-class", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_classes")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : !cls ? (
          <p className="text-muted-foreground text-center py-20">Aula não encontrada.</p>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video rounded-xl overflow-hidden bg-card mb-6">
              <video
                controls
                className="w-full h-full"
                poster={cls.thumbnail_url || undefined}
                src={cls.video_url}
              >
                Seu navegador não suporta o elemento de vídeo.
              </video>
            </div>
            <h1 className="text-3xl md:text-4xl font-heading tracking-wider mb-2">{cls.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground mb-4">
              <span className="bg-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full">{cls.tag}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {cls.duration}</span>
              {cls.calories && <span className="flex items-center gap-1"><Flame className="w-4 h-4" /> {cls.calories}</span>}
            </div>
            {cls.description && <p className="text-muted-foreground leading-relaxed">{cls.description}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassPlayer;
