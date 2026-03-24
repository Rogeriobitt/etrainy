import { motion, AnimatePresence } from "framer-motion";
import { X, GraduationCap, UserCog, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EntryModalProps {
  open: boolean;
  onClose: () => void;
}

const EntryModal = ({ open, onClose }: EntryModalProps) => {
  const navigate = useNavigate();

  const handleChoice = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm px-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-heading tracking-wide text-center mb-6">
              Como você quer <span className="text-gradient">entrar</span>?
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => handleChoice("/auth?role=aluno")}
                className="w-full gradient-accent py-4 rounded-xl font-semibold text-primary-foreground flex items-center justify-center gap-3 hover:opacity-90 transition-opacity text-lg"
              >
                <GraduationCap className="w-5 h-5" />
                Sou Aluno
              </button>

              <button
                onClick={() => handleChoice("/auth?role=personal")}
                className="w-full bg-secondary border border-border py-4 rounded-xl font-semibold text-secondary-foreground flex items-center justify-center gap-3 hover:bg-secondary/80 transition-colors text-lg"
              >
                <UserCog className="w-5 h-5" />
                Sou Personal
              </button>
            </div>

            <div className="mt-5 text-center">
              <button
                onClick={() => handleChoice("/auth?role=admin")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                <Shield className="w-3.5 h-3.5" />
                Acesso Administrativo
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EntryModal;
