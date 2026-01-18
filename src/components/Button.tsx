import { twMerge } from "tailwind-merge";

type ButtonType = "primary" | "secondary" | "danger";

interface ButtonProps {
  children: React.ReactNode;
  type?: ButtonType;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export default function Button({
  children,
  type,
  className,
  onClick,
}: ButtonProps) {
  let cn = "";

  switch (type) {
    case "primary":
      cn = "bg-primary";

      break;

    case "secondary":
      cn = "bg-secondary";

      break;

    case "danger":
      cn = "bg-danger";

      break;

    default:
      cn = "bg-plain";
      break;
  }

  return (
    <button
      className={twMerge(
        cn,
        "inline-block cursor-pointer p-2 text-white",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
