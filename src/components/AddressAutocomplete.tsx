'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { searchAddress, type AddressSuggestion } from '@/lib/actions/places';
import { inputCx } from './form';

export default function AddressAutocomplete({
  name,
  defaultValue = '',
  placeholder,
  required,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const listboxId = useId();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const results = await searchAddress(q);
      setSuggestions(results);
      setActiveIdx(-1);
      setLoading(false);
    }, 250);
    return () => clearTimeout(handle);
  }, [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function pick(s: AddressSuggestion) {
    skipNextFetch.current = true;
    setValue(s.description);
    setSuggestions([]);
    setOpen(false);
    setActiveIdx(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      pick(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showDropdown =
    open && (loading || suggestions.length > 0) && value.trim().length >= 3;

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        name={name}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
        className={inputCx}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-autocomplete="list"
      />
      {showDropdown && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
        >
          {loading && suggestions.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-400">Searching…</li>
          )}
          {suggestions.map((s, i) => (
            <li
              key={`${s.description}-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === activeIdx ? 'bg-slate-100' : 'hover:bg-slate-50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <div className="text-slate-900">{s.mainText}</div>
              {s.secondaryText && (
                <div className="text-xs text-slate-500">{s.secondaryText}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
