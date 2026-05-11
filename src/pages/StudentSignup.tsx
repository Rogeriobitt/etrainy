import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { persistProfileAfterSignup } from "@/lib/persistProfileAfterSignup";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Lock,
  Calendar,
  Weight,
  Ruler,
  Dumbbell,
  Camera,
  CheckCircle2,
} from "lucide-react";

const TOTAL_STEPS = 5;

const experienceLevels = [
  { value: "iniciante", label: "Iniciante", desc: "Menos de 6 meses" },
  { value: "intermediario", label: "Intermediário", desc: "6 meses a 2 anos" },
  { value: "avancado", label: "Avançado", desc: "Mais de 2 anos" },
];

const goals = [
  { value: "hipertrofia", label: "Hipertrofia", desc: "Ganho de massa muscular" },
  { value: "emagrecimento", label: "Emagrecimento", desc: "" },
  { value: "forca", label: "Força", desc: "" },
  { value: "condicionamento", label: "Condicionamento / Saúde geral", desc: "" },
];

const trainingDays = ["2x", "3x", "4x", "5x", "6x"];

const trainingLocations = [
  { value: "academia", label: "Academia" },
  { value: "casa_pesos", label: "Em casa com pesos livres (halteres, elásticos)" },
  { value: "casa_corpo", label: "Em casa sem equipamentos (peso do corpo)" },
];

const StudentSignup = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();



  const totalVisibleSteps = TOTAL_STEPS;

  // Step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState("");

  // Step 2
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  // Step 3
  const [experience, setExperience] = useState("");
  const [goal, setGoal] = useState("");
  const [days, setDays] = useState("");
  const [location, setLocation] = useState("");

  // Step 4
  const [hasInjury, setHasInjury] = useState(false);
  const [injuryDesc, setInjuryDesc] = useState("");
  const [hasPersonal, setHasPersonal] = useState(false);
  const [personalCode, setPersonalCode] = useState("");

  // Step 5
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!fullName || !email || !password || !confirmPassword || !birthDate || !sex) {
          toast({ title: "Preencha todos os campos", variant: "destructive" });
          return false;
        }
        if (password.length < 6) {
          toast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" });
          return false;
        }
        if (password !== confirmPassword) {
          toast({ title: "As senhas não conferem", variant: "destructive" });
          return false;
        }
        return true;
      case 2:
        if (!weight || !height) {
          toast({ title: "Preencha peso e altura", variant: "destructive" });
          return false;
        }
        return true;
      case 3:
        if (!experience || !goal || !days || !location) {
          toast({ title: "Preencha todos os campos", variant: "destructive" });
          return false;
        }
        return true;
      case 4:
        if (hasInjury && !injuryDesc.trim()) {
          toast({ title: "Descreva sua lesão ou restrição", variant: "destructive" });
          return false;
        }
        if (hasPersonal && !personalCode.trim()) {
          toast({ title: "Insira o código do seu personal", variant: "destructive" });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
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

      // 2. Upload avatar if provided
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
          avatarUrl = urlData.publicUrl;
        }
      }

      // 3. Update profile with all data
      await persistProfileAfterSignup(userId, {
        full_name: fullName,
        email,
        birth_date: birthDate,
        sex,
        weight: parseFloat(weight),
        height: parseFloat(height),
        goal,
        experience_level: experience,
        training_days: days,
        training_location: location,
        has_injury: hasInjury,
        injury_description: hasInjury ? injuryDesc : null,
        has_personal: hasPersonal,
        personal_code: hasPersonal ? personalCode : null,
        personal_trainer_id: null,
        avatar_url: avatarUrl,
      });

      toast({ title: "Conta criada com sucesso! 🎉" });
      navigate("/dashboard/aluno");
    } catch (err: any) {
      toast({ title: "Erro ao criar conta", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-secondary border border-border rounded-lg py-3 pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";
  const inputClassNoIcon =
    "w-full bg-secondary border border-border rounded-lg py-3 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-heading tracking-wide">Dados Pessoais</h2>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="text" placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={inputClass} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="password" placeholder="Confirmar senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputClass} />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Sexo</p>
              <div className="flex gap-3">
                {["Masculino", "Feminino"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s.toLowerCase())}
                    className={`flex-1 py-3 rounded-lg border text-sm font-semibold transition-colors ${
                      sex === s.toLowerCase()
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-heading tracking-wide">Dados Físicos</h2>
            <div className="relative">
              <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="number" step="0.1" placeholder="Peso atual (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} required className={inputClass} />
            </div>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="number" step="1" placeholder="Altura (cm)" value={height} onChange={(e) => setHeight(e.target.value)} required className={inputClass} />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <h2 className="text-xl font-heading tracking-wide">Dados de Treino</h2>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Nível de experiência</p>
              <div className="space-y-2">
                {experienceLevels.map((lvl) => (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setExperience(lvl.value)}
                    className={`w-full text-left py-3 px-4 rounded-lg border text-sm transition-colors ${
                      experience === lvl.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <span className="font-semibold">{lvl.label}</span>
                    {lvl.desc && <span className="text-xs ml-2 opacity-70">({lvl.desc})</span>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Objetivo principal</p>
              <div className="space-y-2">
                {goals.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGoal(g.value)}
                    className={`w-full text-left py-3 px-4 rounded-lg border text-sm transition-colors ${
                      goal === g.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <span className="font-semibold">{g.label}</span>
                    {g.desc && <span className="text-xs ml-2 opacity-70">({g.desc})</span>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Dias por semana</p>
              <div className="flex gap-2">
                {trainingDays.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`flex-1 py-3 rounded-lg border text-sm font-semibold transition-colors ${
                      days === d
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Onde vai treinar</p>
              <div className="space-y-2">
                {trainingLocations.map((loc) => (
                  <button
                    key={loc.value}
                    type="button"
                    onClick={() => setLocation(loc.value)}
                    className={`w-full text-left py-3 px-4 rounded-lg border text-sm transition-colors ${
                      location === loc.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <h2 className="text-xl font-heading tracking-wide">Restrições e Observações</h2>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Possui alguma lesão ou restrição física?</p>
              <div className="flex gap-3">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => { setHasInjury(v); if (!v) setInjuryDesc(""); }}
                    className={`flex-1 py-3 rounded-lg border text-sm font-semibold transition-colors ${
                      hasInjury === v
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {v ? "Sim" : "Não"}
                  </button>
                ))}
              </div>
              {hasInjury && (
                <textarea
                  placeholder="Descreva sua lesão ou restrição..."
                  value={injuryDesc}
                  onChange={(e) => setInjuryDesc(e.target.value)}
                  rows={3}
                  className={`${inputClassNoIcon} mt-3`}
                />
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Tem um personal trainer?</p>
              <div className="flex gap-3">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => { setHasPersonal(v); if (!v) setPersonalCode(""); }}
                    className={`flex-1 py-3 rounded-lg border text-sm font-semibold transition-colors ${
                      hasPersonal === v
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {v ? "Sim" : "Não"}
                  </button>
                ))}
              </div>
              {hasPersonal && (
                <input
                  type="text"
                  placeholder="Código do personal (ID)"
                  value={personalCode}
                  onChange={(e) => setPersonalCode(e.target.value)}
                  className={`${inputClassNoIcon} mt-3`}
                />
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-5 text-center">
            <h2 className="text-xl font-heading tracking-wide">Foto de Perfil</h2>
            <p className="text-sm text-muted-foreground">
              Você pode adicionar ou alterar sua foto depois.
            </p>

            <div className="flex flex-col items-center gap-4">
              <div className="w-28 h-28 rounded-full border-2 border-dashed border-border bg-secondary flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <label className="cursor-pointer gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm hover:opacity-90 transition-opacity">
                {avatarFile ? "Trocar Foto" : "Escolher Foto"}
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-heading tracking-widest mb-1">
            TRAINY<span className="text-gradient">LAB</span>
          </h1>
          <p className="text-muted-foreground text-sm">Cadastro de Aluno</p>
        </div>

        {refTrainerName && !refInvalid && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 mb-6 text-center">
            <p className="text-xs text-muted-foreground">Você foi convidado pelo professor</p>
            <p className="text-sm font-semibold text-primary">{refTrainerName}</p>
          </div>
        )}
        {refInvalid && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 mb-6 text-center">
            <p className="text-xs text-destructive">
              Link de convite inválido. Você pode continuar o cadastro normalmente.
            </p>
          </div>
        )}

        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-8">
          {Array.from({ length: totalVisibleSteps }).map((_, i) => {
            const visibleIndex = skipPersonalStep && step >= 5 ? step - 1 : step;
            return (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i < visibleIndex ? "bg-primary" : "bg-secondary"
                }`}
              />
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center mb-6">
          Etapa {skipPersonalStep && step >= 5 ? step - 1 : step} de {totalVisibleSteps}
        </p>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 bg-secondary border border-border py-3 rounded-lg font-semibold text-secondary-foreground flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Voltar
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 gradient-accent py-3 rounded-lg font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              Próximo <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 gradient-accent py-3 rounded-lg font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" /> Concluir Cadastro
                </>
              )}
            </button>
          )}
        </div>

        {/* Login link */}
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

export default StudentSignup;
