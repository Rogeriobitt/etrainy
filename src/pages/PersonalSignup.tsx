import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  Award,
  Loader2,
  CheckCircle2,
  Copy,
} from "lucide-react";

const experienceOptions = [
  "Menos de 1 ano",
  "1 a 3 anos",
  "3 a 5 anos",
  "Mais de 5 anos",
];

const PersonalSignup = () => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gymName, setGymName] = useState("");
  const [experience, setExperience] = useState("");
  const [cref, setCref] = useState("");

  const inputClass =
    "w-full bg-secondary border border-border rounded-lg py-3 pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";
  const inputClassNoIcon =
    "w-full bg-secondary border border-border rounded-lg py-3 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword || !experience) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "As senhas não conferem", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Create auth user
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

      // 2. Generate unique PT code
      const { data: seqData, error: seqError } = await supabase.rpc("nextval_personal_code" as any);
      let code: string;
      if (seqError || !seqData) {
        // Fallback: random 5-digit code
        code = `PT-${Math.floor(10000 + Math.random() * 90000)}`;
      } else {
        code = `PT-${seqData}`;
      }

      // 3. Insert personal trainer record
      const { error: insertError } = await supabase
        .from("personal_trainers")
        .insert({
          user_id: userId,
          personal_code: code,
          full_name: fullName,
          phone: phone || null,
          gym_name: gymName || null,
          experience,
          cref: cref || null,
        });
      if (insertError) throw insertError;

      // 4. Update profile
      await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", userId);

      setGeneratedCode(code);
      setDone(true);
    } catch (err: any) {
      toast({ title: "Erro ao criar conta", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast({ title: "Código copiado!" });
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-heading tracking-wider mb-2">
            Cadastro <span className="text-gradient">Concluído!</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Seu cadastro como personal foi criado com sucesso.
          </p>

          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <p className="text-sm text-muted-foreground mb-2">Seu código de personal</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-heading tracking-widest text-primary">
                {generatedCode}
              </span>
              <button onClick={copyCode} className="text-muted-foreground hover:text-foreground transition-colors">
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Passe esse código para seus alunos vincularem suas contas a você.
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard/personal")}
            className="gradient-accent px-8 py-3 rounded-lg font-semibold text-primary-foreground hover:opacity-90 transition-opacity w-full"
          >
            Ir para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading tracking-widest mb-1">
            FIT<span className="text-gradient">FLOW</span>
          </h1>
          <p className="text-muted-foreground text-sm">Cadastro de Personal Trainer</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1 */}
          <div className="space-y-4">
            <h2 className="text-lg font-heading tracking-wide border-b border-border pb-2">
              Dados Pessoais e Login
            </h2>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="text" placeholder="Nome completo *" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="email" placeholder="E-mail *" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="password" placeholder="Senha *" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={inputClass} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="password" placeholder="Confirmar senha *" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputClass} />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="tel" placeholder="Telefone / WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="text" placeholder="Academia em que trabalha" value={gymName} onChange={(e) => setGymName(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-4">
            <h2 className="text-lg font-heading tracking-wide border-b border-border pb-2">
              Profissional
            </h2>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tempo de experiência *</p>
              <div className="space-y-2">
                {experienceOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setExperience(opt)}
                    className={`w-full text-left py-3 px-4 rounded-lg border text-sm font-semibold transition-colors ${
                      experience === opt
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="text" placeholder="CREF (opcional)" value={cref} onChange={(e) => setCref(e.target.value)} className={inputClass} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-accent py-3 rounded-lg font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Concluir Cadastro
              </>
            )}
          </button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Já tem conta?{" "}
          <button onClick={() => navigate("/auth")} className="text-primary hover:underline font-medium">
            Faça login
          </button>
        </p>
      </div>
    </div>
  );
};

export default PersonalSignup;
