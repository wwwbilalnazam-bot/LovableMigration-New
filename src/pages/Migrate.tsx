import { AnimatePresence } from "framer-motion";
import { PageShell, Seo } from "@/components/shared";
import { Stepper } from "@/components/wizard-ui";
import { useWizard } from "@/lib/wizard";
import { TooltipProvider } from "@/components/ui/overlay";
import Step1Project from "@/steps/Step1Project";
import Step2Connect from "@/steps/Step2Connect";
import Step3Schema from "@/steps/Step3Schema";
import Step4Data from "@/steps/Step4Data";
import Step5Users from "@/steps/Step5Users";
import Step6Storage from "@/steps/Step6Storage";
import Step7Functions from "@/steps/Step7Functions";
import Step8Done from "@/steps/Step8Done";

const STEPS = [Step1Project, Step2Connect, Step3Schema, Step4Data, Step5Users, Step6Storage, Step7Functions, Step8Done];

function Wizard() {
  const { state } = useWizard();
  const Current = STEPS[state.step];
  return (
    <div className="container max-w-3xl space-y-8 py-8 sm:py-12">
      <Stepper />
      <AnimatePresence mode="wait">
        <Current key={state.step} />
      </AnimatePresence>
    </div>
  );
}

export default function Migrate() {
  return (
    <PageShell>
      <Seo path="/migrate" noindex title="Migrate Lovable Cloud to Supabase: Free Wizard" description="Guided wizard that moves your Lovable Cloud schema, data, auth users and storage files to your own Supabase project." />
      
      <TooltipProvider><Wizard /></TooltipProvider>

    </PageShell>
  );
}
