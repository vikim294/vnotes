import { twMerge } from "tailwind-merge";

type ButtonType = "primary";

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
