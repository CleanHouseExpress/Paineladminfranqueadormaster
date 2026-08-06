import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/card';

interface UnitFormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  testId?: string;
}

export function UnitFormSection({ title, description, children, testId }: UnitFormSectionProps) {
  return (
    <Card className="gap-0 rounded-lg shadow-none" data-testid={testId}>
      <CardHeader className="border-b bg-muted/20 px-4 py-4 sm:px-5">
        <CardTitle className="text-base font-semibold tracking-normal">{title}</CardTitle>
        {description ? <CardDescription className="text-sm">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="px-4 py-4 sm:px-5">
        {children}
      </CardContent>
    </Card>
  );
}
