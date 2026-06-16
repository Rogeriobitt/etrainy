import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const PersonalRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading, isAdmin } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["is-personal", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("personal_trainers")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  if (authLoading || (user && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!data && !isAdmin) return <Navigate to="/dashboard/aluno" replace />;

  return <>{children}</>;
};


export default PersonalRoute;
