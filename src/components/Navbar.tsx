import { useState } from "react";
import { Menu, X, Dumbbell, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleAuthClick = () => {
    if (user) {
      signOut();
    } else {
      navigate("/auth");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-primary" />
          <span className="text-2xl font-heading tracking-widest">FITFLOW</span>
        </a>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#aulas" className="text-muted-foreground hover:text-foreground transition-colors">Aulas</a>
          <a href="#treinos" className="text-muted-foreground hover:text-foreground transition-colors">Treinos</a>
          {user && (
            <span className="text-muted-foreground flex items-center gap-1">
              <User className="w-4 h-4" />
              {user.user_metadata?.full_name || user.email}
            </span>
          )}
          <button
            onClick={handleAuthClick}
            className="gradient-accent px-5 py-2 rounded-lg text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            {user ? <><LogOut className="w-4 h-4" /> Sair</> : "Entrar"}
          </button>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-card border-t border-border px-6 py-4 flex flex-col gap-4">
          <a href="#aulas" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setOpen(false)}>Aulas</a>
          <a href="#treinos" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setOpen(false)}>Treinos</a>
          <button
            onClick={() => { handleAuthClick(); setOpen(false); }}
            className="gradient-accent px-5 py-2 rounded-lg text-primary-foreground font-semibold text-sm"
          >
            {user ? "Sair" : "Entrar"}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
