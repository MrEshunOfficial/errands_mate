"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useProfile } from "@/hooks/profiles/useCoreUserProfile";
import { useIdImage } from "@/hooks/files/useIdImage";

import {
  ArrowRight,
  Briefcase,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { IdImageUploader } from "@/components/files/user-profile/IdImageUploader";
import { ProfilePictureUploader } from "@/components/files/user-profile/ProfilePictureUploader";
import { UserRole } from "@/types/base.types";
import { IFile } from "@/types/files.types";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Role = "provider" | "customer";
type FinalVariant = "provider" | "customer";

interface ContactForm {
  primary: string;
  secondary: string;
  email: string;
}

interface FieldErrors {
  primary?: string | null;
}

// ─── Progress Strip ────────────────────────────────────────────────────────────

const STEP_LABELS = ["Photo", "Role", "Contact", "Finish"] as const;

function OnboardingProgress({ step }: { step: number }) {
  const clamped = Math.min(step, 3);
  const pct = Math.round((clamped / 3) * 100);

  return (
    <div className="px-6 pt-5 pb-4 border-b border-border">
      <Progress value={pct} className="h-1.5 mb-3" />
      <div className="flex justify-between">
        {STEP_LABELS.map((label, i) => {
          const isDone = i < clamped;
          const isActive = i === clamped;
          return (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors",
                  isDone || isActive
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground",
                )}>
                {isDone ? <CheckCircle2 className="w-3 h-3 stroke-3" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[10px] transition-colors",
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 0: Profile Picture ───────────────────────────────────────────────────

function StepPicture({ onNext }: { onNext: () => void }) {
  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Add a profile photo
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Optional — helps people recognise you. You can update this anytime.
        </p>
      </div>

      <ProfilePictureUploader />

      <Button className="w-full" onClick={onNext}>
        Continue <ArrowRight className="ml-1.5 w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Step 1: Role ──────────────────────────────────────────────────────────────

const ROLES = [
  {
    key: "provider" as Role,
    label: "Service Provider",
    desc: "Offer skills and earn from clients",
    tag: "Earn",
    Icon: Briefcase,
    activeClass: "border-primary bg-primary/5 ring-2 ring-primary/20",
  },
  {
    key: "customer" as Role,
    label: "Customer",
    desc: "Find and hire skilled professionals",
    tag: "Hire",
    Icon: Users,
    activeClass: "border-sky-500 bg-sky-50 ring-2 ring-sky-200",
  },
] as const;

interface StepRoleProps {
  role: Role | null;
  onSelect: (r: Role) => void;
  onNext: () => void;
  onBack: () => void;
}

function StepRole({ role, onSelect, onNext, onBack }: StepRoleProps) {
  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          How will you use the platform?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Personalises your experience. You can change this later.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {ROLES.map((opt) => {
          const selected = role === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(opt.key)}
              className={cn(
                "flex items-center gap-3 w-full p-4 rounded-xl border border-border text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? opt.activeClass : "hover:bg-muted/50",
              )}>
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  selected ? "bg-white shadow-sm" : "bg-muted",
                )}>
                <opt.Icon
                  className={cn(
                    "w-5 h-5",
                    selected ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold">{opt.label}</span>
                  <Badge
                    variant={selected ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0">
                    {opt.tag}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>

              <div
                className={cn(
                  "w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  selected ? "border-primary bg-primary" : "border-border",
                )}>
                {selected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <Button onClick={onNext} disabled={!role} className="w-full">
          Continue <ArrowRight className="ml-1.5 w-4 h-4" />
        </Button>
        <Button variant="ghost" onClick={onBack} className="w-full">
          Back
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Contact Details ───────────────────────────────────────────────────

interface StepContactProps {
  profileHook: ReturnType<typeof useProfile>;
  role: Role;
  contact: ContactForm;
  onChange: (field: keyof ContactForm, val: string) => void;
  fieldErrors: FieldErrors;
  onNext: () => Promise<void>;
  onBack: () => void;
}

function StepContact({
  profileHook,
  role,
  contact,
  onChange,
  fieldErrors,
  onNext,
  onBack,
}: StepContactProps) {
  const { loading, errors, clearError } = profileHook;

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Your contact details
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {role === "provider"
            ? "Clients will use these to reach you. Keep them accurate."
            : "How providers can reach you. Private unless you share."}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Primary phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone-primary">
            Primary phone <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone-primary"
            type="tel"
            value={contact.primary}
            onChange={(e) => onChange("primary", e.target.value)}
            placeholder="+233 XX XXX XXXX"
            aria-invalid={!!fieldErrors.primary}
            onFocus={() => clearError("mutation")}
            className={cn(
              fieldErrors.primary &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          {fieldErrors.primary && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {fieldErrors.primary}
            </p>
          )}
        </div>

        {/* Secondary phone */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="phone-secondary">Secondary phone</Label>
            <span className="text-xs text-muted-foreground">Optional</span>
          </div>
          <Input
            id="phone-secondary"
            type="tel"
            value={contact.secondary}
            onChange={(e) => onChange("secondary", e.target.value)}
            placeholder="Alternate number"
          />
        </div>

        {/* Business email */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="business-email">Business email</Label>
            <span className="text-xs text-muted-foreground">Optional</span>
          </div>
          <Input
            id="business-email"
            type="email"
            value={contact.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="you@company.com"
          />
        </div>

        {/* API-level error */}
        {errors.mutation && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.mutation}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <Button onClick={onNext} disabled={loading.creating} className="w-full">
          {loading.creating ? (
            "Creating profile…"
          ) : (
            <>
              Save & Continue <ArrowRight className="ml-1.5 w-4 h-4" />
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={loading.creating}
          className="w-full">
          Back
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3A: Provider — ID Verify ────────────────────────────────────────────

type IdPhase = "details" | "upload" | "done";

interface StepIdVerifyProps {
  profileHook: ReturnType<typeof useProfile>;
  idImageHook: ReturnType<typeof useIdImage>;
  cardNumber: string;
  onCardNumber: (v: string) => void;
  onDone: () => void;
  onSkip: () => void;
}

function StepIdVerify({
  profileHook,
  cardNumber,
  onCardNumber,
  onDone,
  onSkip,
}: StepIdVerifyProps) {
  const {
    updateIdDetails,
    loading: pL,
    errors: pE,
    clearError: pClear,
  } = profileHook;

  const [phase, setPhase] = useState<IdPhase>("details");
  const [uploadedFiles, setUploadedFiles] = useState<IFile[]>([]);

  const handleDetailsContinue = async () => {
    pClear("mutation");
    // cardNumber is optional — proceed even if blank
    const result = await updateIdDetails({
      ghana_card_number: cardNumber.trim() || undefined,
    });
    if (!result) return; // API error — stay on details
    setPhase("upload");
  };

  const handleUploadSuccess = (files: IFile[]) => {
    setUploadedFiles(files);
    setPhase("done");
  };

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Hero */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <circle cx="8" cy="11" r="2.5" />
            <path d="M13 10h5M13 13h3" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Identity Verification
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            Verify to build client trust, receive payments, and earn your
            Verified badge.
          </p>
        </div>
      </div>

      {/* ── Phase: details ── */}
      {phase === "details" && (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="card-number">Ghana Card Number</Label>
              <span className="text-xs text-muted-foreground">
                e.g. GHA-XXXXXXXXX-X
              </span>
            </div>
            <Input
              id="card-number"
              value={cardNumber}
              onChange={(e) => {
                onCardNumber(e.target.value);
                pClear("mutation");
              }}
              placeholder="GHA-000000000-0"
            />
          </div>

          {pE.mutation && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{pE.mutation}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Upload front & back photos of your ID. photos must be clear and
              all details visible.
            </p>
            <Button
              onClick={handleDetailsContinue}
              disabled={pL.updatingIdDetails}
              className="w-full">
              {pL.updatingIdDetails ? "Saving…" : "Continue to ID Upload"}
            </Button>
            <Button
              variant="ghost"
              onClick={onSkip}
              disabled={pL.updatingIdDetails}
              className="w-full text-muted-foreground">
              I&apos;ll do this later
            </Button>
          </div>
        </>
      )}

      {/* ── Phase: upload ── */}
      {phase === "upload" && (
        <>
          <IdImageUploader onUploadSuccess={handleUploadSuccess} />
          <Button
            variant="ghost"
            onClick={onDone}
            className="w-full text-muted-foreground">
            proceed without ID (limited access)
          </Button>
          <Button>
            upload <ArrowRight className="ml-1.5 w-4 h-4" />
          </Button>
        </>
      )}

      {/* ── Phase: done ── */}
      {phase === "done" && (
        <>
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription>
              {uploadedFiles.length} ID image
              {uploadedFiles.length !== 1 ? "s" : ""} uploaded. Your
              verification is under review.
            </AlertDescription>
          </Alert>
          <Button onClick={onDone} className="w-full">
            Finish setup <ArrowRight className="ml-1.5 w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
}

// ─── Final Screen ──────────────────────────────────────────────────────────────

const FINALS: Record<
  FinalVariant,
  { emoji: string; title: string; sub: string; cta: string }
> = {
  provider: {
    emoji: "🚀",
    title: "You're live as a provider!",
    sub: "Finish identity verification before you can setup your business profile and start accepting clients.",
    cta: "Go to Dashboard",
  },
  customer: {
    emoji: "👋",
    title: "Welcome aboard!",
    sub: "Your profile is ready. Set up your preferences so we can surface the right providers for you.",
    cta: "Set Up Preferences",
  },
};

function FinalScreen({
  variant,
  onComplete,
}: {
  variant: FinalVariant;
  onComplete: () => void;
}) {
  const cfg = FINALS[variant];
  return (
    <div className="p-8 flex flex-col items-center text-center gap-5">
      <span className="text-5xl leading-none">{cfg.emoji}</span>

      <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center">
        <CheckCircle2 className="w-7 h-7 text-emerald-600" strokeWidth={2} />
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight">{cfg.title}</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-65 mx-auto leading-relaxed">
          {cfg.sub}
        </p>
      </div>

      <Button onClick={onComplete} className="w-full max-w-xs">
        {cfg.cta} <ArrowRight className="ml-1.5 w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
interface ProfileOnboardingProps {
  /** Called when the user clicks the final CTA.
   *  For providers: navigate to business profile setup.
   *  For customers: navigate to /preferences page. */
  onComplete?: (role: Role) => void;
}

export default function ProfileOnboarding({
  onComplete,
}: ProfileOnboardingProps) {
  const profileHook = useProfile(false);
  const idImageHook = useIdImage();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role | null>(null);
  const [contact, setContact] = useState<ContactForm>({
    primary: "",
    secondary: "",
    email: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [cardNumber, setCardNumber] = useState("");
  const [finalVariant, setFinalVariant] = useState<FinalVariant | null>(null);

  const go = useCallback((n: number) => setStep(n), []);

  const changeContact = (field: keyof ContactForm, val: string) => {
    setContact((c) => ({ ...c, [field]: val }));
    if (fieldErrors[field as keyof FieldErrors])
      setFieldErrors((e) => ({ ...e, [field]: null }));
  };

  const validateContact = (): boolean => {
    const errs: FieldErrors = {};
    const p = contact.primary.trim();
    if (!p) {
      errs.primary = "Primary phone is required";
    } else if (!/^\+?[\d\s\-(). ]{7,20}$/.test(p)) {
      errs.primary = "Enter a valid phone number";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Step 2 submit ─────────────────────────────────────────────────────────
  const handleContactNext = async () => {
    if (!validateContact()) return;
    if (!role) return;

    profileHook.clearError("mutation");

    const result = await profileHook.createProfile({
      role: role === "provider" ? UserRole.PROVIDER : UserRole.CUSTOMER,
      contactInfo: {
        mainContact: contact.primary.trim(),
        ...(contact.secondary.trim()
          ? { additionalContact: contact.secondary.trim() }
          : {}),
        ...(contact.email.trim()
          ? { businessEmail: contact.email.trim() }
          : {}),
      },
    });

    if (!result) return; // API error — stay on step 2

    if (role === "provider") {
      go(3); // → ID verification
    } else {
      // Customer: profile is done, go straight to final screen
      setFinalVariant("customer");
      go(4);
    }
  };

  // ── ID verify handlers ────────────────────────────────────────────────────
  const handleIdDone = () => {
    setFinalVariant("provider");
    go(4);
  };
  const handleIdSkip = () => {
    setFinalVariant("provider");
    go(4);
  };

  // ── Final CTA ─────────────────────────────────────────────────────────────
  const handleComplete = () => {
    onComplete?.(role!);
    toast.info("basic info added, proceeding to the next step!");
  };

  // Progress bar covers steps 0-3 only
  const showProgress = step <= 3;

  const renderStep = () => {
    if (step === 0) return <StepPicture onNext={() => go(1)} />;

    if (step === 1)
      return (
        <StepRole
          role={role}
          onSelect={setRole}
          onNext={() => go(2)}
          onBack={() => go(0)}
        />
      );

    if (step === 2)
      return (
        <StepContact
          profileHook={profileHook}
          role={role!}
          contact={contact}
          onChange={changeContact}
          fieldErrors={fieldErrors}
          onNext={handleContactNext}
          onBack={() => go(1)}
        />
      );

    if (step === 3)
      return (
        <StepIdVerify
          profileHook={profileHook}
          idImageHook={idImageHook}
          cardNumber={cardNumber}
          onCardNumber={setCardNumber}
          onDone={handleIdDone}
          onSkip={handleIdSkip}
        />
      );

    // Step 4 — final screen (provider or customer)
    return (
      <FinalScreen
        variant={finalVariant ?? "customer"}
        onComplete={handleComplete}
      />
    );
  };

  return (
    <Card className="w-full max-w-110 overflow-hidden shadow-lg">
      {showProgress && <OnboardingProgress step={Math.min(step, 3)} />}
      <div className="overflow-hidden">{renderStep()}</div>
    </Card>
  );
}
