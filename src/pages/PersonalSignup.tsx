import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import logo from "@/assets/trainylab-logo.png";

const PersonalSignup = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Step 2
  const [cref, setCref] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const inputClass =
    "w-full bg-secondary border border-border rounded-lg py-3 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-body text-sm";

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Erro ao criar conta");

      const { data: seqData, error: seqError } = await supabase.rpc("nextval_personal_code" as any);
      let code: string;
      if (seqError || !seqData) {
        code = `PT-${Math.floor(10000 + Math.random() * 90000)}`;
      } else {
        code = `PT-${seqData}`;
      }

      const { error: insertError } = await supabase
        .from("personal_trainers")
        .insert({
          user_id: userId,
          personal_code: code,
          full_name: fullName,
          phone: phone || null,
          cref: cref || null,
          city: city || null,
          state: state || null,
        } as any);
      if (insertError) throw insertError;

      await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", userId);

      setDone(true);
    } catch (err: any) {
      toast({ title: "Erro ao criar conta", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm text-center flex flex-col items-center"
        >
          <img src={logo} alt="TrainyLab" className="h-14 md:h-20 w-auto mb-8" />
          <CheckCircle2 className="w-14 h-14 text-primary mb-4" />
          <h1 className="text-lg md:text-2xl font-heading tracking-wider mb-3">
            CADASTRO <span className="text-gradient">CRIADO!</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Enviamos um link de confirmação para o seu e-mail. Confirme para acessar seu app TrainyLab.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              onSubmit={handleStep1}
              className="flex flex-col items-center"
            >
              <img src={logo} alt="TrainyLab" className="h-14 md:h-20 w-auto mb-8" />
              <h1 className="text-lg md:text-2xl font-heading tracking-wider mb-1 text-center">
                CRIE SUA CONTA <span className="text-gradient">TRAINYLAB</span>
              </h1>
              <p className="text-xs text-muted-foreground mb-8">Dados pessoais</p>

              <div className="w-full space-y-4 mb-8">
                <input
                  type="text"
                  placeholder="Nome completo *"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className={inputClass}
                />
                <input
                  type="email"
                  placeholder="E-mail *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                />
                <input
                  type="tel"
                  placeholder="Telefone / WhatsApp"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
                <input
                  type="password"
                  placeholder="Senha *"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                className="w-full gradient-accent py-3 rounded-lg font-body font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                Próximo passo
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.35 }}
              onSubmit={handleStep2}
              className="flex flex-col items-center"
            >
              <img src={logo} alt="TrainyLab" className="h-14 md:h-20 w-auto mb-8" />
              <h1 className="text-lg md:text-2xl font-heading tracking-wider mb-1 text-center">
                COMPLETE SEU PERFIL <span className="text-gradient">PROFISSIONAL</span>
              </h1>
              <p className="text-xs text-muted-foreground mb-8">Dados profissionais</p>

              <div className="w-full space-y-4 mb-8">
                <input
                  type="text"
                  placeholder="CREF (opcional)"
                  value={cref}
                  onChange={(e) => setCref(e.target.value)}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Estado"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-accent py-3 rounded-lg font-body font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Concluir cadastro"
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Voltar
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PersonalSignup;
