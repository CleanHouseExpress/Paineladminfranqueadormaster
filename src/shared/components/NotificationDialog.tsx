import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Button } from '../../app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../app/components/ui/dialog';

type NotificationVariant = 'error' | 'warning' | 'info';

interface NotificationDialogProps {
  open: boolean;
  title?: string;
  message: string | null;
  variant?: NotificationVariant;
  onOpenChange: (open: boolean) => void;
}

const variantConfig = {
  error: {
    title: 'Nao foi possivel continuar',
    icon: ShieldAlert,
    tone: 'text-destructive',
  },
  warning: {
    title: 'Atencao',
    icon: AlertTriangle,
    tone: 'text-amber-600',
  },
  info: {
    title: 'Informacao',
    icon: Info,
    tone: 'text-primary',
  },
};

export function NotificationDialog({
  open,
  title,
  message,
  variant = 'error',
  onOpenChange,
}: NotificationDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${config.tone}`}>
              <Icon className="size-5" />
            </div>
            <div className="space-y-2">
              <DialogTitle>{title ?? config.title}</DialogTitle>
              <DialogDescription className="text-sm leading-6">
                {message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
