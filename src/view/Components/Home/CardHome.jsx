import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import React from "react";
import { useNavigate } from "react-router-dom";

export default function CardHome({ title, icon, amount, subtitle, click }) {
  const navigate = useNavigate();
  return (
    <div className={`
      group
      bg-white 
      hover:bg-accent
      rounded-xl w-full
      p-6 flex flex-col items-center justify-between 
      cursor-pointer shadow-premium hover:scale-105 
      transition-all duration-300
    `}
      onClick={() => { navigate(click) }}
    >
      <div className="flex justify-between w-full mb-4">
        <div className="flex items-center gap-3">
          {/* Botón del ícono */}
          <div
            className={`
              p-2.5 rounded-full 
              bg-main-bg
              group-hover:bg-white/20
              transition-all
            `}
          >
            {React.cloneElement(icon, {
              className: `
                w-5 h-5
                text-accent
                group-hover:text-white 
                transition-all
              `,
            })}
          </div>

          {/* Título */}
          <span
            className={`
              text-xs font-bold tracking-widest uppercase
              text-text-secondary
              group-hover:text-white 
              transition-all
            `}
          >
            {title}
          </span>
        </div>

        {/* Flecha */}
        <div
          className={`
            p-2 rounded-full 
            bg-header-bg
            group-hover:bg-white 
            transition-all
          `}
        >
          <ArrowUpRightIcon
            className={`
              w-5 h-5
              text-white 
              group-hover:text-accent
              transition-all
            `}
          />
        </div>
      </div>

      <div className="flex flex-col w-full text-left">
        <span className="font-display text-3xl text-text-primary group-hover:text-white transition-colors">{amount}</span>
        <span className="text-xs text-text-secondary group-hover:text-white/80 transition-colors uppercase mt-1 tracking-wider">{subtitle}</span>
      </div>
    </div>
  );
}
