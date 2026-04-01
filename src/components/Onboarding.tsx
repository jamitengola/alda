"use client";

import { useState } from "react";
import { BrainCircuit, Mic, Zap, ArrowRight, Check, Radio } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: "Bem-vindo ao ALDA",
    subtitle: "O seu coach de IA para reuniões de alto impacto",
    description:
      "Coaching em tempo real, preparação inteligente e follow-up automático — tudo invisível no seu Mac.",
    icon: BrainCircuit,
    color: "from-blue-500 to-cyan-400",
  },
  {
    title: "Como funciona",
    subtitle: "3 etapas para cada reunião",
    description: "",
    icon: Zap,
    color: "from-amber-500 to-orange-400",
    features: [
      {
        icon: Radio,
        label: "Antes",
        desc: "Gere um briefing estratégico com IA",
      },
      {
        icon: Mic,
        label: "Durante",
        desc: "Receba sugestões em tempo real enquanto fala",
      },
      {
        icon: ArrowRight,
        label: "Depois",
        desc: "Follow-up automático e métricas de performance",
      },
    ],
  },
  {
    title: "Pronto para começar",
    subtitle: "A sua primeira sessão de coaching espera",
    description:
      "Clique abaixo para iniciar. Pode alternar entre modos: Vendas, Pitch, Negociação, Objeções e mais.",
    icon: Check,
    color: "from-green-500 to-emerald-400",
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        data-interactive
        className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900/95 p-8 shadow-2xl"
      >
        {/* Progress dots */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-blue-500" : i < step ? "w-3 bg-blue-500/40" : "w-3 bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="mb-5 flex justify-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${current.color}`}
          >
            <Icon className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <h2 className="mb-1 text-center text-xl font-bold text-white">
          {current.title}
        </h2>
        <p className="mb-4 text-center text-sm text-gray-400">
          {current.subtitle}
        </p>

        {current.description && (
          <p className="mb-6 text-center text-sm leading-relaxed text-gray-300">
            {current.description}
          </p>
        )}

        {/* Step 2: feature list */}
        {current.features && (
          <div className="mb-6 space-y-3">
            {current.features.map((f, i) => {
              const FIcon = f.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3"
                >
                  <FIcon className="h-5 w-5 shrink-0 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{f.label}</p>
                    <p className="text-xs text-gray-400">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Voltar
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Pular
            </button>
          )}

          <button
            onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setStep(step + 1);
              }
            }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {isLast ? "Iniciar Coaching" : "Continuar"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
