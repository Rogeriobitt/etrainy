import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";
import logo from "@/assets/trainylab-logo.png";
import { persistProfileAfterSignup } from "@/lib/persistProfileAfterSignup";

const StudentInviteSignup = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [invitation, setInvitation] = useState<any>(null);
  const [personalName, setPersonalName] = useState("");
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [goal, setGoal] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const inputClass =
    "w-full bg-secondary border border-border rounded-lg py-3 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-body text-sm";

  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) { setInvalid(true); setLoadingInvite(false); return; }

      const { data, error } = await supabase
        .from("student_invitations" as any)
        .select("*, personal_trainers(full_name, id)")
        .eq("token", token)
        .eq("status", "pending")
        .maybeSingle();

      if (error || !data) {
        setInvalid(true);
        setLoadingInvite(false);
        return;
      }

      setInvitation(data);
      setPersonalName((data as any).personal_trainers?.full_name || "seu professor");
      setLoadingInvite(false);
    };
    loadInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    if (!sex) {
      toast({ title: "Selecione o sexo", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.student_email,
        password,
        options: {
          data: { full_name: invitation.student_name },
          emailRedirectTo: window.location.origin,
        },
      });
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error("Erro ao criar conta");

      // 2. Update profile with student data
      const personalTrainerId = invitation.personal_trainers?.id || invitation.personal_trainer_id;
      await persistProfileAfterSignup(userId, {
        full_name: invitation.student_name,
        email: invitation.student_email,
        birth_date: birthDate || null,
        sex: sex || null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        goal: goal || null,
        has_personal: true,
        personal_trainer_id: personalTrainerId,
      });

      // 3. Mark invitation as used
      await supabase
        .from("student_invitations" as any)
        .update({ status: "used", used_at: new Date().toISOString() } as any)
        .eq("id", invitation.id);

      setDone(true);
    } catch (err: any) {
      toast({ title: "Erro ao criar conta", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loadingInvite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <img src={logo} alt="Trainylab" className="h-14 md:h-20 w-auto mb-8 mx-auto" />
          <h1 className="text-lg font-heading tracking-wider mb-3">CONVITE INVÁLIDO</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Este link de convite é inválido ou já foi utilizado.
          </p>
          <button
            onClick={() => navigate("/")}
            className="text-sm text-primary hover:underline"
          >
            Ir para a página inicial
          </button>
        </motion.div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm text-center flex flex-col items-center"
        >
          <img src={logo} alt="Trainylab" className="h-14 md:h-20 w-auto mb-8" />
          <CheckCircle2 className="w-14 h-14 text-primary mb-4" />
          <h1 className="text-lg md:text-2xl font-heading tracking-wider mb-3">
            CADASTRO <span className="text-gradient">CONCLUÍDO!</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bem-vindo ao Trainylab! Agora você já pode acessar seus treinos com o seu professor.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Confirme seu e-mail para acessar o app.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          onSubmit={handleSubmit}
          className="flex flex-col items-center"
        >
          <img src={logo} alt="Trainylab" className="h-14 md:h-20 w-auto mb-6" />
          <h1 className="text-lg md:text-2xl font-heading tracking-wider mb-2 text-center">
            BEM-VINDO AO <span className="text-gradient">TRAINYLAB</span>
          </h1>
          <p className="text-xs text-muted-foreground mb-8 text-center">
            Você foi convidado pelo professor <span className="text-foreground font-medium">{personalName}</span>.
          </p>

          <div className="w-full space-y-4 mb-8">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data de nascimento</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Sexo *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSex("Homem")}
                  className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    sex === "Homem"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  Homem
                </button>
                <button
                  type="button"
                  onClick={() => setSex("Mulher")}
                  className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    sex === "Mulher"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  Mulher
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Peso (kg)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                step="0.1"
                className={inputClass}
              />
              <input
                type="number"
                placeholder="Altura (cm)"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                step="0.1"
                className={inputClass}
              />
            </div>

            <input
              type="text"
              placeholder="Objetivo (ex: Hipertrofia, Emagrecimento)"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className={inputClass}
            />

            <input
              type="password"
              placeholder="Criar senha *"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-accent py-3 rounded-lg font-body font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Concluir cadastro"}
          </button>
        </motion.form>
      </div>
    </div>
  );
};

export default StudentInviteSignup;
