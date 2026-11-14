"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Calendar } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [statusText, setStatusText] = useState(
    "Verificando tu cuenta e iniciando sesión segura..."
  );

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else {
          await supabase.auth.getSession();
        }

        setStatusText("¡Sesión verificada! Redirigiendo a tu calendario...");
        router.replace("/");
      } catch {
        setStatusText("Redirigiendo al inicio...");
        router.replace("/");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F6F5F0] text-[#26332D]">
      <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E4E6DE] shadow-md max-w-sm w-full text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#34483D] text-white flex items-center justify-center mx-auto animate-pulse">
          <Calendar className="w-6 h-6" />
        </div>
        <h1 className="text-base font-bold text-[#26332D]">
          Calendario Financiero Personal
        </h1>
        <p className="text-xs text-[#68736B]">{statusText}</p>
      </div>
    </div>
  );
}
