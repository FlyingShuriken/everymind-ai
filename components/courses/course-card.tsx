import Link from "next/link";

interface CourseCardProps {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  createdAt: string;
  progressPercent?: number;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  READY: { label: "Ready", bg: "bg-[#C8F0D8]", text: "text-[#3D8A5A]" },
  PROCESSING: { label: "Processing", bg: "bg-[#FEF3E2]", text: "text-[#D4A64A]" },
  DRAFT: { label: "Draft", bg: "bg-[#F5F4F1]", text: "text-[#9C9B99]" },
  ERROR: { label: "Error", bg: "bg-red-100", text: "text-red-600" },
};

export function CourseCard({
  id,
  title,
  description,
  status,
  createdAt,
  progressPercent,
}: CourseCardProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;

  return (
    <Link
      href={`/dashboard/courses/${id}`}
      className="flex flex-col gap-3 rounded-2xl bg-white p-6 transition-shadow hover:shadow-sm"
    >
      <span
        className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}
      >
        {cfg.label}
      </span>
      <span className="text-base font-semibold leading-snug text-[#1A1918]">
        {title}
      </span>
      {description && (
        <span className="line-clamp-2 text-sm text-[#6D6C6A]">{description}</span>
      )}
      <span className="text-xs text-[#9C9B99]">
        {new Date(createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </span>
      {progressPercent !== undefined && status === "READY" && (
        <div className="mt-1 flex items-center gap-3">
          <div
            className="h-1 flex-1 overflow-hidden rounded-full bg-[#E5E4E1]"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progressPercent}% complete`}
          >
            <div
              className="h-full rounded-full bg-[#3D8A5A] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-medium text-[#9C9B99]">
            {progressPercent}%
          </span>
        </div>
      )}
    </Link>
  );
}
