"use client";

import React, { useState } from "react";
import { WelcomeStep } from "@/components/onboarding/steps/welcome-step";
import { WorkspaceStep } from "@/components/onboarding/steps/workspace-step";
import { TutorialStep } from "@/components/onboarding/steps/tutorial-step";
import { DeploymentStep } from "@/components/onboarding/steps/deployment-step";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    workspaceName: "",
    firstSchemaName: "Blog Post",
  });

  const next = () => setStep(s => s + 1);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <WelcomeStep onNext={next} />
          </motion.div>
        )}
        
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6 }}
          >
            <WorkspaceStep 
              onNext={(name : string) => {
                setData(d => ({ ...d, workspaceName: name }));
                next();
              }} 
            />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.6 }}
          >
            <TutorialStep 
              workspaceName={data.workspaceName}
              onNext={(schemaName: string) => {
                setData(d => ({ ...d, firstSchemaName: schemaName }));
                next();
              }} 
            />
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <DeploymentStep data={data} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Indicator */}
      <div className="fixed top-12 left-1/2 -translate-x-1/2 flex gap-3 z-50">
        {[1, 2, 3, 4].map(i => (
          <div 
            key={i}
            className={cn(
              "h-1 transition-all duration-700 rounded-full",
              step === i ? "w-12 bg-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]" : "w-4 bg-white/10"
            )}
          />
        ))}
      </div>
    </div>
  );
}
