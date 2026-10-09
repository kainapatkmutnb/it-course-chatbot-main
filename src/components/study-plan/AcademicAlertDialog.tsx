import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Trash2,
  GraduationCap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type AcademicAlertVariant = 'warning' | 'destructive' | 'info';

export interface AcademicAlertState {
  isOpen: boolean;
  title: string;
  description: string;
  variant?: AcademicAlertVariant;
  highlightItems?: string[];
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  isConfirm?: boolean;
}

interface AcademicAlertDialogProps {
  dialog: AcademicAlertState | null;
  onClose: () => void;
}

export const AcademicAlertDialog: React.FC<AcademicAlertDialogProps> = ({
  dialog,
  onClose,
}) => {
  if (!dialog || !dialog.isOpen) return null;

  const variant = dialog.variant || 'warning';

  const renderIcon = () => {
    switch (variant) {
      case 'destructive':
        return (
          <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
            {dialog.isConfirm ? <Trash2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
        );
      case 'info':
        return (
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
            <GraduationCap className="w-5 h-5" />
          </div>
        );
      case 'warning':
      default:
        return (
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
    }
  };

  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (dialog.onConfirm) {
      await dialog.onConfirm();
    }
    onClose();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    if (dialog.onCancel) {
      dialog.onCancel();
    }
    onClose();
  };

  return (
    <AlertDialog open={dialog.isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent className="academic-panel bg-white border-2 border-slate-900 shadow-large rounded-2xl p-6 max-w-md w-[92vw] sm:w-full">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-start gap-3.5">
            {renderIcon()}
            <div className="flex-1 min-w-0 pt-0.5">
              <AlertDialogTitle className="academic-title text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {dialog.title}
              </AlertDialogTitle>
            </div>
          </div>

          <AlertDialogDescription className="text-sm text-slate-600 leading-relaxed whitespace-pre-line text-left pt-1">
            {dialog.description}
          </AlertDialogDescription>

          {dialog.highlightItems && dialog.highlightItems.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-wrap gap-1.5 mt-2">
              {dialog.highlightItems.map((item, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="bg-white border-slate-300 text-slate-800 text-xs px-2.5 py-0.5 font-medium shadow-2xs"
                >
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-5 flex flex-row items-center justify-end gap-2 sm:gap-2.5">
          {dialog.isConfirm && (
            <AlertDialogCancel
              onClick={handleCancel}
              className="mt-0 h-9 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-xs cursor-pointer"
            >
              {dialog.cancelText || 'ยกเลิก'}
            </AlertDialogCancel>
          )}

          <AlertDialogAction
            onClick={handleAction}
            className={
              dialog.isConfirm && variant === 'destructive'
                ? "h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-xs cursor-pointer"
                : "h-9 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs cursor-pointer"
            }
          >
            {dialog.confirmText || (dialog.isConfirm ? 'ยืนยัน' : 'เข้าใจแล้ว')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
