import React, { useEffect, useRef } from "react";

interface TableCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  title?: string;
  id?: string;
  ariaLabel?: string;
  className?: string;
  stopPropagation?: boolean;
}

export const TableCheckbox: React.FC<TableCheckboxProps> = ({
  checked,
  indeterminate = false,
  onChange,
  title,
  id,
  ariaLabel,
  className = "",
  stopPropagation = true,
}) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  return (
    <div
      className="inline-flex items-center justify-center p-0.5"
      onClick={(e) => {
        if (stopPropagation) {
          e.stopPropagation();
        }
      }}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        checked={checked}
        title={title}
        aria-label={ariaLabel || title}
        onClick={(e) => {
          if (stopPropagation) {
            e.stopPropagation();
          }
        }}
        onChange={onChange}
        className={`w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 cursor-pointer transition-all accent-indigo-600 ${className}`}
      />
    </div>
  );
};
