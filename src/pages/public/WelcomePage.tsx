import { AnimatedBackground } from '../../components/common/AnimatedBackground.tsx';
import { PageTransition } from '../../components/common/PageTransition.tsx';
import { PassReveal } from '../../components/pass/PassReveal.tsx';
import { PosterPreview } from '../../components/poster/PosterPreview.tsx';
import { FoodPreference } from '../../components/welcome/FoodPreference.tsx';
import { PersonalizedWelcome } from '../../components/welcome/PersonalizedWelcome.tsx';
import { RegistrationReview } from '../../components/welcome/RegistrationReview.tsx';
import { RegistrationSuccess } from '../../components/welcome/RegistrationSuccess.tsx';
import { TalentSelection } from '../../components/welcome/TalentSelection.tsx';
import { WelcomeScreen } from '../../components/welcome/WelcomeScreen.tsx';
import { useEventSettings } from '../../hooks/useEventSettings.ts';
import { useRegistration } from '../../hooks/useRegistration.ts';

export function WelcomePage() {
  const { settings } = useEventSettings();
  const {
    step,
    setStep,
    draft,
    updateDraft,
    toggleTalent,
    submittedRecord,
    submitting,
    submitError,
    submit,
    resetJourney,
  } = useRegistration();

  return (
    <div className="relative min-h-screen bg-[#fff4e2] text-[#5a0f14]">
      <AnimatedBackground
        showStagePhoto={false}
        intensity={step === 'celebration' ? 'subtle' : 'normal'}
      />

      <div className="relative z-10">
        {step === 'welcome' && (
          <PageTransition key="welcome" stepKey="welcome">
            <WelcomeScreen
              settings={settings}
              initialName={draft.student_name}
              onStart={(cleanedName) => {
                updateDraft({ student_name: cleanedName });
                setStep('personalized_welcome');
              }}
            />
          </PageTransition>
        )}

        {step === 'personalized_welcome' && (
          <PageTransition
            key="personalized_welcome"
            stepKey="personalized_welcome"
          >
            <PersonalizedWelcome
              studentName={draft.student_name}
              eventName={settings.event_name}
              onBack={() => setStep('welcome')}
              onContinue={() => setStep('talents')}
            />
          </PageTransition>
        )}

        {step === 'talents' && (
          <PageTransition key="talents" stepKey="talents">
            <TalentSelection
              selectedTalents={draft.selected_talents}
              otherDescription={draft.other_talent_description}
              onToggleTalent={toggleTalent}
              onOtherDescriptionChange={(val) =>
                updateDraft({ other_talent_description: val })
              }
              onBack={() => setStep('personalized_welcome')}
              onContinue={() => setStep('food')}
            />
          </PageTransition>
        )}

        {step === 'food' && (
          <PageTransition key="food" stepKey="food">
            <FoodPreference
              selected={draft.food_preference}
              onSelect={(pref) => updateDraft({ food_preference: pref })}
              onBack={() => setStep('talents')}
              onContinue={() => setStep('review')}
            />
          </PageTransition>
        )}

        {step === 'review' && (
          <PageTransition key="review" stepKey="review">
            <RegistrationReview
              draft={draft}
              submitting={submitting}
              submitError={submitError}
              onJumpToStep={(target) => setStep(target)}
              onSubmit={() => {
                void submit();
              }}
            />
          </PageTransition>
        )}

        {step === 'celebration' && submittedRecord && (
          <PageTransition key="celebration" stepKey="celebration">
            <RegistrationSuccess
              registration={submittedRecord}
              eventName={settings.event_name}
              onGeneratePoster={() => setStep('poster')}
            />
          </PageTransition>
        )}

        {step === 'poster' && submittedRecord && (
          <PageTransition key="poster" stepKey="poster">
            <PosterPreview
              registration={submittedRecord}
              settings={settings}
              onContinueToPass={() => setStep('pass')}
              onBack={resetJourney}
            />
          </PageTransition>
        )}

        {step === 'pass' && submittedRecord && (
          <PageTransition key="pass" stepKey="pass">
            <PassReveal
              registration={submittedRecord}
              settings={settings}
              onViewPoster={() => setStep('poster')}
              onBackHome={resetJourney}
            />
          </PageTransition>
        )}
      </div>
    </div>
  );
}
