import { useEffect, useMemo, useRef } from "react";
import { PREWARM_DEBOUNCE_MS } from "@/lib/prewarm";

type PrewarmFn = () => void | Promise<void>;

type UsePrewarmIntentOptions = {
    debounceMs?: number;
};

type PrewarmIntentHandlers = {
    onMouseEnter: () => void;
    onFocus: () => void;
    onTouchStart: () => void;
    onMouseLeave: () => void;
    onBlur: () => void;
};

/**
 * Non-React factory for intent-based prewarming.
 * Debounces by default to 120ms — if the user hovers but
 * immediately moves away, no work is done.
 */
export function createPrewarmIntent(
    prewarmFn: PrewarmFn,
    options: UsePrewarmIntentOptions = {},
) {
    const debounceMs = options.debounceMs ?? PREWARM_DEBOUNCE_MS;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const cancel = () => {
        if (!timer) return;
        clearTimeout(timer);
        timer = undefined;
    };

    const schedule = () => {
        if (timer) return; // Already scheduled
        timer = setTimeout(() => {
            timer = undefined;
            Promise.resolve(prewarmFn()).catch((error) => {
                console.warn("Route prewarm intent failed", error);
            });
        }, debounceMs);
    };

    const handlers: PrewarmIntentHandlers = {
        onMouseEnter: schedule,
        onFocus: schedule,
        onTouchStart: schedule,
        onMouseLeave: cancel,
        onBlur: cancel,
    };

    return { handlers, cancel };
}

/**
 * React hook that returns stable event handlers for intent-based prewarming.
 *
 * Spread the returned handlers onto any element:
 *   `<div {...prewarmHandlers}>...</div>`
 *
 * The prewarm function is called 120ms after hover/focus/touch starts.
 * If the user leaves before the debounce window, no work is done.
 */
export function usePrewarmIntent(
    prewarmFn: PrewarmFn,
    options: UsePrewarmIntentOptions = {},
): PrewarmIntentHandlers {
    const prewarmRef = useRef(prewarmFn);
    prewarmRef.current = prewarmFn;

    const controller = useMemo(
        () => createPrewarmIntent(() => prewarmRef.current(), options),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [options.debounceMs],
    );

    useEffect(() => {
        return () => {
            controller.cancel();
        };
    }, [controller]);

    return controller.handlers;
}
