import { TenantProvider } from './TenantContext';
import { ModuleProvider } from './ModuleContext';
import { OnboardingProvider } from './OnboardingContext';

/** Composes all global providers. Wrap the app root with this. */
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider>
      <ModuleProvider>
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
      </ModuleProvider>
    </TenantProvider>
  );
}
