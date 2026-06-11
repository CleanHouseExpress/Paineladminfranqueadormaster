import { TenantProvider } from './TenantContext';
import { AuthProvider } from './AuthContext';
import { ModuleProvider } from './ModuleContext';
import { OnboardingProvider } from './OnboardingContext';

/** Composes all global providers. Wrap the app root with this. */
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider>
      <AuthProvider>
        <ModuleProvider>
          <OnboardingProvider>
            {children}
          </OnboardingProvider>
        </ModuleProvider>
      </AuthProvider>
    </TenantProvider>
  );
}
