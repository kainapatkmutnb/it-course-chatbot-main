import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react"

function getToastMeta(variant?: string, title?: React.ReactNode, description?: React.ReactNode) {
  const text = `${typeof title === 'string' ? title : ''} ${typeof description === 'string' ? description : ''}`.toLowerCase();

  // 1. Explicit variant check
  if (variant === 'destructive' || variant === 'error') {
    return {
      resolvedVariant: 'destructive' as const,
      icon: (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
          <AlertCircle className="w-4.5 h-4.5" />
        </div>
      ),
    };
  }
  if (variant === 'warning') {
    return {
      resolvedVariant: 'warning' as const,
      icon: (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
          <AlertTriangle className="w-4.5 h-4.5" />
        </div>
      ),
    };
  }
  if (variant === 'success') {
    return {
      resolvedVariant: 'success' as const,
      icon: (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-4.5 h-4.5" />
        </div>
      ),
    };
  }
  if (variant === 'info') {
    return {
      resolvedVariant: 'info' as const,
      icon: (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
          <Info className="w-4.5 h-4.5" />
        </div>
      ),
    };
  }

  // 2. Automatic semantic detection based on keywords in title/description
  const isError = /ผิดพลาด|ไม่สำเร็จ|ล้มเหลว|error|fail|ไม่ได้|ระงับ|ปฏิเสธ/i.test(text);
  if (isError) {
    return {
      resolvedVariant: 'destructive' as const,
      icon: (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
          <AlertCircle className="w-4.5 h-4.5" />
        </div>
      ),
    };
  }

  const isWarning = /คำเตือน|ระวัง|warning|หมดอายุ|โปรดตรวจ/i.test(text);
  if (isWarning) {
    return {
      resolvedVariant: 'warning' as const,
      icon: (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
          <AlertTriangle className="w-4.5 h-4.5" />
        </div>
      ),
    };
  }

  const isSuccess = /สำเร็จ|เรียบร้อย|ยินดีต้อนรับ|success|บันทึก|สร้าง|เพิ่ม|เสร็จสิ้น/i.test(text);
  if (isSuccess) {
    return {
      resolvedVariant: 'success' as const,
      icon: (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-4.5 h-4.5" />
        </div>
      ),
    };
  }

  // Default
  return {
    resolvedVariant: 'default' as const,
    icon: (
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
        <Info className="w-4.5 h-4.5" />
      </div>
    ),
  };
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={5000}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const { resolvedVariant, icon } = getToastMeta(variant as string, title, description)

        return (
          <Toast key={id} variant={resolvedVariant} duration={5000} {...props}>
            <div className="flex items-start gap-3 w-full pr-3">
              {icon}
              <div className="flex-1 min-w-0 pt-0.5">
                {title && (
                  <ToastTitle className="text-[14.5px] font-semibold leading-tight tracking-tight">
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription className="text-[13px] leading-relaxed mt-1 opacity-90">
                    {description}
                  </ToastDescription>
                )}
                {action && <div className="mt-2">{action}</div>}
              </div>
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
