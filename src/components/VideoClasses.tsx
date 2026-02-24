import { motion } from "framer-motion";
import { Play, Clock, Flame, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import yogaImg from "@/assets/class-yoga.jpg";
import hiitImg from "@/assets/class-hiit.jpg";
import strengthImg from "@/assets/class-strength.jpg";
import mobilityImg from "@/assets/class-mobility.jpg";

const fallbackClasses = [
  { id: "fallback-1", title: "Yoga Flow", duration: "30 min", calories: "150 kcal", thumbnail_url: yogaImg, tag: "Flexibilidade" },
  { id: "fallback-2", title: "HIIT Explosivo", duration: "25 min", calories: "400 kcal", thumbnail_url: hiitImg, tag: "Cardio" },
  { id: "fallback-3", title: "Força Total", duration: "45 min", calories: "350 kcal", thumbnail_url: strengthImg, tag: "Força" },
  { id: "fallback-4", title: "Mobilidade", duration: "20 min", calories: "100 kcal", thumbnail_url: mobilityImg, tag: "Recuperação" },
];

const VideoClasses = () => {
  const navigate = useNavigate();

  const { data: dbClasses, isLoading } = useQuery({
    queryKey: ["video-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_classes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const classes = dbClasses && dbClasses.length > 0 ? dbClasses : fallbackClasses;
  const isFromDb = dbClasses && dbClasses.length > 0;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-5xl md:text-6xl font-heading mb-2 tracking-wider">
            AULAS EM <span className="text-gradient">VÍDEO</span>
          </h2>
          <p className="text-muted-foreground mb-12 text-lg">
            Escolha entre dezenas de aulas guiadas por instrutores profissionais.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {classes.map((cls, i) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group cursor-pointer"
                onClick={() => isFromDb ? navigate(`/class/${cls.id}`) : null}
              >
                <div className="relative rounded-xl overflow-hidden aspect-square mb-4">
                  <img
                    src={cls.thumbnail_url || "/placeholder.svg"}
                    alt={cls.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full gradient-accent flex items-center justify-center">
                      <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {cls.tag}
                  </span>
                </div>
                <h3 className="text-xl font-heading tracking-wide mb-1">{cls.title}</h3>
                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {cls.duration}
                  </span>
                  {cls.calories && (
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> {cls.calories}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default VideoClasses;
