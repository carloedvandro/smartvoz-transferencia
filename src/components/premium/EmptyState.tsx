import piggyImg from "@/assets/piggy-3d.png";
import receiptImg from "@/assets/receipt-3d.png";

export function EmptyState({
  message,
  variant = "piggy",
}: {
  message: string;
  variant?: "piggy" | "receipt";
}) {
  const src = variant === "piggy" ? piggyImg : receiptImg;
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 animate-sv-fade-up">
      <img
        src={src}
        alt=""
        width={120}
        height={120}
        loading="lazy"
        style={{ width: 120, height: 120, opacity: 0.5 }}
        className="mb-5"
      />
      <p className="text-[var(--sv-muted)] text-lg font-medium max-w-md">{message}</p>
    </div>
  );
}
