import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import VideoClasses from "@/components/VideoClasses";
import WorkoutPlans from "@/components/WorkoutPlans";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <div id="aulas">
        <VideoClasses />
      </div>
      <div id="treinos">
        <WorkoutPlans />
      </div>
      <footer className="py-10 border-t border-border text-center text-muted-foreground text-sm">
        <p>© 2026 TrainyLab. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Index;
