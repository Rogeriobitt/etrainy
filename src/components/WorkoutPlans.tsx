import { motion } from "framer-motion";
import { ArrowRight, Timer, Zap, Target } from "lucide-react";

const workouts = [
  {
    icon: Zap,
    title: "Queima Rápida",
    description: "Treino intenso de 15 minutos para queimar calorias rápido.",
    level: "Intermediário",
    exercises: 8,
  },
  {
    icon: Target,
    title: "Full Body",
    description: "Treino completo para trabalhar todos os grupos musculares.",
    level: "Iniciante",
    exercises: 12,
  },
  {
    icon: Timer,
    title: "Tabata 4min",
    description: "Intervalos de alta intensidade em apenas 4 minutos.",
    level: "Avançado",
    exercises: 8,
  },
];

const WorkoutPlans = () => {
  return (
    <section className="py-16 md:py-20 bg-card">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-5xl font-heading mb-2 tracking-wider">
            TREINOS <span className="text-gradient">EM CASA</span>
          </h2>
          <p className="text-muted-foreground mb-10 text-base">
            Treinos sem equipamento, prontos para usar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workouts.map((workout, i) => (
            <motion.div
              key={workout.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="gradient-card rounded-xl p-6 border border-border hover:border-primary/40 transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-lg gradient-accent flex items-center justify-center mb-5">
                <workout.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-heading tracking-wide mb-2">{workout.title}</h3>
              <p className="text-muted-foreground text-sm mb-6">{workout.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="bg-secondary px-3 py-1 rounded-full">{workout.level}</span>
                  <span className="bg-secondary px-3 py-1 rounded-full">{workout.exercises} exercícios</span>
                </div>
                <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkoutPlans;
