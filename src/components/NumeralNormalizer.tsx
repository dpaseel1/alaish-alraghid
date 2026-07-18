"use client";

import { useEffect } from "react";
import { normalizeDigits } from "@/lib/numbers";

const ARABIC_DIGIT_PATTERN = /[٠-٩۰-۹]/;

/** يعترض الكتابة في كل حقول الموقع ويحوّل أي رقم عربي/فارسي مكتوب إلى رقم إنجليزي فورًا */
export function NumeralNormalizer() {
  useEffect(() => {
    const handleInput = (e: Event) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) {
        return;
      }
      if (!ARABIC_DIGIT_PATTERN.test(target.value)) return;

      const selectionStart = target.selectionStart;
      const selectionEnd = target.selectionEnd;
      const before = target.value.slice(0, selectionStart ?? 0);
      const convertedBefore = normalizeDigits(before);
      const cursorShift = convertedBefore.length - before.length;

      target.value = normalizeDigits(target.value);

      if (selectionStart !== null && selectionEnd !== null) {
        const newStart = selectionStart + cursorShift;
        const newEnd = selectionEnd + cursorShift;
        target.setSelectionRange(newStart, newEnd);
      }

      target.dispatchEvent(new Event("input", { bubbles: true, cancelable: false }));
    };

    document.addEventListener("input", handleInput, true);
    return () => document.removeEventListener("input", handleInput, true);
  }, []);

  return null;
}
