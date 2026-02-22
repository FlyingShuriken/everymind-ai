import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CourseCardProps {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  createdAt: string;
  progressPercent?: number;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PROCESSING: "Generating...",
  READY: "Ready",
  ERROR: "Error",
};

export function CourseCard({
  id,
  title,
  description,
  status,
  createdAt,
  progressPercent,
}: CourseCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">
            <Link
              href={`/dashboard/courses/${id}`}
              className="underline-offset-2 hover:underline"
            >
              {title}
            </Link>
          </CardTitle>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              status === "READY"
                ? "bg-green-100 text-green-800"
                : status === "PROCESSING"
                  ? "bg-yellow-100 text-yellow-800"
                  : status === "ERROR"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
            }`}
          >
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="mb-2 text-sm text-muted-foreground">{description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Created {new Date(createdAt).toLocaleDateString()}
        </p>
        {progressPercent !== undefined && status === "READY" && (
          <div className="mt-3">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progressPercent}% complete`}
            >
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
