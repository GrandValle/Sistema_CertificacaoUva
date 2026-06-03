"use client";
import Link from "next/link";
import { getSystemById } from "@/modules/dashboard/model/systems";
import HigienizacaoGeralPage from "@/modules/higienizacao-geral/components/HigienizacaoGeralPage";

export default function HigienizacaoGeralRoutePage() {
  const system = getSystemById("higienizacao-geral");
  if (!system) return null;

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-start pt-2 pb-8 px-2 md:px-8">
      <div className="w-full max-w-7xl flex flex-col items-center">
        <div className="w-full rounded-3xl shadow-xl bg-white p-0 md:p-2">
          <HigienizacaoGeralPage />
        </div>
      </div>
    </main>
  );
}