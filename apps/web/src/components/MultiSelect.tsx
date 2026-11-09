import { useId, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  unknown = false,
  error,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  unknown?: boolean;
  error?: string;
}) {
  const id = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const items = options.filter(
    (item) =>
      item !== "Not Given" &&
      item.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()),
  );
  return (
    <div className="multi-select">
      <span id={`${id}-label`} className="multi-label">
        {label} {!unknown && <small>Required</small>}
      </span>
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSearch("");
        }}
      >
        <Popover.Trigger
          type="button"
          className="multi-trigger"
          aria-labelledby={`${id}-label ${id}-count`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <span id={`${id}-count`}>
            {value.length
              ? `${value.length} selected`
              : unknown
                ? "Unknown"
                : "Select one or more"}
          </span>
          <span aria-hidden="true">＋</span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="multi-popover"
            sideOffset={6}
            collisionPadding={12}
            aria-label={`Choose ${label.toLowerCase()}`}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              searchRef.current?.focus();
            }}
          >
            <label htmlFor={`${id}-search`}>Search {label.toLowerCase()}</label>
            <input
              ref={searchRef}
              id={`${id}-search`}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoComplete="off"
            />
            <div
              className="multi-options"
              role="group"
              aria-label={`${label} options`}
            >
              {unknown && (
                <label className="multi-option">
                  <input
                    type="checkbox"
                    checked={!value.length}
                    onChange={() => onChange([])}
                  />
                  Unknown
                </label>
              )}
              {items.map((item) => (
                <label className="multi-option" key={item}>
                  <input
                    type="checkbox"
                    checked={value.includes(item)}
                    onChange={(event) =>
                      onChange(
                        event.target.checked
                          ? [...value, item]
                          : value.filter((selected) => selected !== item),
                      )
                    }
                  />
                  {item}
                </label>
              ))}
              {!items.length && <p role="status">No matching options.</p>}
            </div>
            <div className="multi-toolbar">
              <button type="button" onClick={() => onChange([])}>
                Clear {label.toLowerCase()}
              </button>
              <Popover.Close type="button">Done</Popover.Close>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {value.length > 0 && (
        <ul
          className="selected-chips"
          aria-label={`Selected ${label.toLowerCase()}`}
        >
          {value.map((item) => (
            <li key={item}>
              <span>{item}</span>
              <button
                type="button"
                aria-label={`Remove ${item} from ${label.toLowerCase()}`}
                onClick={() =>
                  onChange(value.filter((selected) => selected !== item))
                }
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <small className="field-error" id={`${id}-error`} role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
