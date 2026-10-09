import { useToast } from "@/hooks/use-toast"
import { useAlertCountdown } from "@/hooks/use-alert-countdown"
import { AlertTimeoutProgress } from "@/components/ui/alert-timeout-progress"
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

type ToastItem = ReturnType<typeof useToast>["toasts"][number]

const progressColors = {
  default: "text-blue-500 dark:text-blue-400",
  info: "text-blue-500 dark:text-blue-400",
  success: "text-emerald-500 dark:text-emerald-400",
  destructive: "text-rose-500 dark:text-rose-400",
  warning: "text-amber-500 dark:text-amber-400",
}

function TimedToast({
  item,
  dismiss,
}: {
  item: ToastItem
  dismiss: (id: string) => void
}) {
  const { id, title, description, action, variant, duration, ...props } = item
  const resolvedDuration =
    typeof duration === "number" && !Number.isNaN(duration) ? duration : 5000
  const remaining = useAlertCountdown({
    active: item.open !== false,
    duration: resolvedDuration,
    resetKey: id,
    onExpire: () => dismiss(id),
  })
  const { resolvedVariant, icon } = getToastMeta(variant as string, title, description)

  return (
    <Toast {...props} variant={resolvedVariant} duration={Infinity}>
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
      <AlertTimeoutProgress
        remaining={remaining}
        className={progressColors[resolvedVariant]}
      />
    </Toast>
  )
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider duration={Infinity}>
      {toasts.map((item) => (
        <TimedToast key={item.id} item={item} dismiss={dismiss} />
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
