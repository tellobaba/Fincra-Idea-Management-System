import { cn } from "@/lib/utils";

interface CustomIconProps extends React.HTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  className?: string;
}

export function CustomIcon({ src, alt = "", className, ...props }: CustomIconProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("w-5 h-5 object-contain", className)}
      {...props}
    />
  );
}