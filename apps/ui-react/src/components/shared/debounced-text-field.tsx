import * as React from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_COMMIT_DELAY = 500;

interface DebouncedFieldProps {
  /** Value owned by the store; the field starts (and re-syncs) from it. */
  value: string;
  /** Called with the final text after the user pauses, blurs, or the field
   * goes away — never once per keystroke. */
  onCommit: (value: string) => void;
  /** Commit delay in milliseconds (500 by default). */
  delay?: number;
}

/**
 * Local state for a text field bound to a server value: typing updates
 * immediately, the mutation is debounced, and pending edits are flushed on
 * blur and unmount so nothing is lost.
 *
 * Render these with a `key` on the entity id wherever the same page can
 * switch entities without remounting (movement hotkeys, focused asset or
 * counterparty): the flush then runs with the commit function of the entity
 * the edit belongs to.
 */
function useDebouncedField({ value, onCommit, delay }: DebouncedFieldProps) {
  const [text, setText] = React.useState(value);
  const [dirty, setDirty] = React.useState(false);
  const [syncedValue, setSyncedValue] = React.useState(value);

  // Adopt external changes (rename from a dialog, a sync event) whenever
  // there is no pending local edit. Adjusted during render instead of in an
  // effect so the new value lands in the same paint.
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (!dirty) {
      setText(value);
    }
  }

  const timerRef = React.useRef<number | undefined>(undefined);
  const pendingRef = React.useRef<string | null>(null);
  const onCommitRef = React.useRef(onCommit);
  React.useEffect(() => {
    onCommitRef.current = onCommit;
  });

  const commit = (committed: string) => {
    timerRef.current = undefined;
    pendingRef.current = null;
    setDirty(false);
    onCommitRef.current(committed);
  };

  const handleChange = (event: { currentTarget: { value: string } }) => {
    const next = event.currentTarget.value;
    setText(next);
    setDirty(true);
    pendingRef.current = next;
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(
      () => commit(next),
      delay ?? DEFAULT_COMMIT_DELAY,
    );
  };

  const flush = () => {
    if (pendingRef.current === null) return;
    window.clearTimeout(timerRef.current);
    commit(pendingRef.current);
  };

  // Flush pending edits when the field unmounts (navigation, entity switch
  // through a key change) even if the blur or the delay never happened.
  React.useEffect(() => {
    return () => {
      if (pendingRef.current !== null) {
        window.clearTimeout(timerRef.current);
        onCommitRef.current(pendingRef.current);
      }
    };
  }, []);

  return { text, handleChange, flush };
}

export function DebouncedInput({
  value,
  onCommit,
  delay,
  onBlur,
  ...props
}: React.ComponentProps<typeof Input> & DebouncedFieldProps) {
  const field = useDebouncedField({ value, onCommit, delay });

  return (
    <Input
      {...props}
      value={field.text}
      onChange={field.handleChange}
      onBlur={(event) => {
        onBlur?.(event);
        field.flush();
      }}
    />
  );
}

export function DebouncedTextarea({
  value,
  onCommit,
  delay,
  onBlur,
  ...props
}: React.ComponentProps<typeof Textarea> & DebouncedFieldProps) {
  const field = useDebouncedField({ value, onCommit, delay });

  return (
    <Textarea
      {...props}
      value={field.text}
      onChange={field.handleChange}
      onBlur={(event) => {
        onBlur?.(event);
        field.flush();
      }}
    />
  );
}
