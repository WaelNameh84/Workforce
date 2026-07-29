import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type DetailValue = string | number | null | undefined;

export type DetailItem = {
  label: string;
  value: DetailValue;
};

export default function DetailDialog({
  open,
  onOpenChange,
  title,
  description,
  items,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  items: DetailItem[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 rounded-xl border bg-muted/30 px-4 py-3"
            >
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-right text-sm font-semibold">{item.value ?? '—'}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}