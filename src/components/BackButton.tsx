import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { getBackNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/store/userStore";

type BackButtonProps = Omit<ButtonProps, "children" | "asChild">;

export default function BackButton({ className, ...props }: BackButtonProps) {
  const language = useUser((state) => state.language);
  const { direction, label } = getBackNavigation(language);
  const Icon = direction === "right" ? ArrowRight : ArrowLeft;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      {...props}
      aria-label={label}
      title={label}
      className={cn("h-10 w-10 shrink-0 rounded-xl text-foreground active:scale-95 transition-transform [&_svg]:size-5", className)}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}