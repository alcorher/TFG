import { MdWarning, MdCheckCircle, MdInfoOutline, MdError } from "react-icons/md";

export function Alert({ message, type = "info", onClose }) {
  const typeConfig = {
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      icon: MdError,
      iconColor: "text-red-500",
    },
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      icon: MdCheckCircle,
      iconColor: "text-emerald-500",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-700",
      icon: MdWarning,
      iconColor: "text-yellow-500",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      icon: MdInfoOutline,
      iconColor: "text-blue-500",
    },
  };

  const config = typeConfig[type] || typeConfig.info;
  const IconComponent = config.icon;

  return (
    <div
      className={`${config.bg} border ${config.border} ${config.text} rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-3`}
      role="alert"
    >
      <IconComponent className={`text-lg flex-shrink-0 ${config.iconColor}`} />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  );
}
