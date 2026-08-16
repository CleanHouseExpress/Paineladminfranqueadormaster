import type { ReactNode } from 'react';

import { cn } from '../../app/components/ui/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'wide';
}

export function PageContainer({ children, className, size = 'default' }: PageContainerProps) {
  return (
    <div
      data-testid="page-container"
      className={cn(
        'mx-auto flex w-full flex-col gap-6',
        size === 'wide' ? 'max-w-[1440px]' : 'max-w-[1280px]',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  secondaryActions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  badge,
  actions,
  secondaryActions,
  className,
}: PageHeaderProps) {
  return (
    <header
      data-testid="page-header"
      className={cn(
        'flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {breadcrumbs ? <div className="text-xs text-muted-foreground">{breadcrumbs}</div> : null}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="truncate text-2xl font-semibold leading-tight tracking-normal text-foreground">{title}</h1>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {(secondaryActions || actions) ? (
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          {secondaryActions ? <div className="flex flex-col gap-2 sm:flex-row">{secondaryActions}</div> : null}
          {actions ? <div className="flex flex-col gap-2 sm:flex-row">{actions}</div> : null}
        </div>
      ) : null}
    </header>
  );
}

interface ListToolbarProps {
  children: ReactNode;
  className?: string;
}

export function ListToolbar({ children, className }: ListToolbarProps) {
  return (
    <div
      data-testid="list-toolbar"
      className={cn(
        'grid gap-3 rounded-lg border bg-card p-3 shadow-sm shadow-foreground/5',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface PageSectionProps {
  children: ReactNode;
  className?: string;
}

export function PageSection({ children, className }: PageSectionProps) {
  return (
    <section className={cn('rounded-lg border bg-card text-card-foreground shadow-sm shadow-foreground/5', className)}>
      {children}
    </section>
  );
}

interface FormActionsProps {
  children: ReactNode;
  className?: string;
}

export function FormActions({ children, className }: FormActionsProps) {
  return (
    <div className={cn('flex flex-col-reverse gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:justify-end', className)}>
      {children}
    </div>
  );
}
