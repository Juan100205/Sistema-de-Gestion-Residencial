import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import React from "react";

export default function CardTables({ name, icon, onClick, isActive = false }) {
  const activeClass = isActive
    ? "bg-accent scale-[1.03] text-white"
    : "bg-white hover:scale-[1.03] hover:bg-accent hover:text-white";

  const iconBgClass = isActive ? "bg-white/20" : "bg-main-bg group-hover:bg-white/20";
  const iconColorClass = isActive ? "text-white" : "text-accent group-hover:text-white";

  const arrowBgClass = isActive ? "bg-white" : "bg-header-bg group-hover:bg-white";
  const arrowColorClass = isActive ? "text-accent" : "text-white group-hover:text-accent";

  const titleColorClass = isActive ? "text-white" : "text-text-primary group-hover:text-white";
  const lineColorClass = isActive ? "bg-white" : "bg-accent group-hover:bg-white";
  const decorClass = isActive ? "bg-white/10 scale-150" : "bg-main-bg/50 group-hover:bg-white/10 group-hover:scale-150";

  return (
    <div
      className={`group relative rounded-xl w-full p-6 flex flex-col justify-between shadow-premium transition-all duration-300 cursor-pointer overflow-hidden ${activeClass}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-8">
        <div className={`p-3 rounded-full transition-colors ${iconBgClass}`}>
          {React.cloneElement(icon, { className: `w-6 h-6 transition-colors ${iconColorClass}` })}
        </div>
        <div className={`p-2 rounded-full transition-colors ${arrowBgClass}`}>
          <ArrowUpRightIcon className={`w-5 h-5 transition-colors ${arrowColorClass}`} />
        </div>
      </div>

      <div className="relative z-10">
        <h3 className={`font-display text-2xl transition-colors leading-tight ${titleColorClass}`}>
          {name}
        </h3>
        <div className={`w-8 h-1 mt-3 transition-colors ${lineColorClass}`} />
      </div>

      {/* Decorative background element */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl transition-all duration-300 transform ${decorClass}`} />
    </div>
  );
}
