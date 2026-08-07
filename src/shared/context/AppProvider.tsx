import { AuthProvider } from './AuthContext';
import { TenantProvider } from './TenantContext';
import { TenantThemeProvider } from './TenantThemeContext';
import { ModuleProvider } from './ModuleContext';
import { OnboardingProvider } from './OnboardingContext';
import { RealtimeContextProvider } from '../../services/realtime';

/** Composes all global providers. Wrap the app root with this. */
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeContextProvider>
      <TenantProvider>
        <TenantThemeProvider>
          <AuthProvider>
            <ModuleProvider>
              <OnboardingProvider>
                {children}
              </OnboardingProvider>
            </ModuleProvider>
          </AuthProvider>
        </TenantThemeProvider>
      </TenantProvider>
    </RealtimeContextProvider>
  );
}
