"use client";

import { useCallback, useRef, useState } from "react";
import type React from "react";

function isInteractiveControl(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (
    target.closest(
      'input, textarea, select, [contenteditable="true"], [data-no-swipe="true"]'
    )
  ) {
    return true;
  }
  return false;
}

function hasScrolledAncestor(
  target: EventTarget | null,
  boundary: HTMLElement | null
): boolean {
  let el = target instanceof HTMLElement ? target : null;
  while (el && el !== boundary) {
    if (el.scrollTop > 2) return true;
    el = el.parentElement;
  }
  return false;
}

function hasHorizontalScroller(
  target: EventTarget | null,
  boundary: HTMLElement | null
): boolean {
  let el = target instanceof HTMLElement ? target : null;
  while (el && el !== boundary) {
    const style = window.getComputedStyle(el);
    if (
      (style.overflowX === "auto" || style.overflowX === "scroll") &&
      el.scrollWidth > el.clientWidth + 4
    ) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

export interface HorizontalSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  edgeOnly?: boolean;
  edgeWidth?: number;
  enabled?: boolean;
  stopPropagationOnTrigger?: boolean;
}

/**
 * Detecta gestos táctiles horizontales (deslizar izquierda/derecha) evitando
 * interferencias con scroll vertical, sliders e inputs de formulario.
 */
export function useHorizontalSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 56,
  edgeOnly = false,
  edgeWidth = 48,
  enabled = true,
  stopPropagationOnTrigger = false,
}: HorizontalSwipeOptions) {
  const startRef = useRef<{
    x: number;
    y: number;
    time: number;
    valid: boolean;
  } | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      if (!enabled || e.touches.length !== 1) {
        startRef.current = null;
        return;
      }
      if (
        isInteractiveControl(e.target) ||
        hasHorizontalScroller(e.target, e.currentTarget)
      ) {
        startRef.current = null;
        return;
      }

      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const fromEdge = touch.clientX - rect.left <= edgeWidth;
      if (edgeOnly && !fromEdge) {
        startRef.current = null;
        return;
      }

      startRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        valid: true,
      };
    },
    [enabled, edgeOnly, edgeWidth]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      const start = startRef.current;
      startRef.current = null;
      if (!enabled || !start?.valid || e.changedTouches.length === 0) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const elapsed = Date.now() - start.time;

      if (elapsed > 700) return;
      if (Math.abs(dx) < threshold) return;
      if (Math.abs(dx) <= Math.abs(dy) * 1.25) return;

      if (dx < 0 && onSwipeLeft) {
        if (stopPropagationOnTrigger) e.stopPropagation();
        onSwipeLeft();
      } else if (dx > 0 && onSwipeRight) {
        if (stopPropagationOnTrigger) e.stopPropagation();
        onSwipeRight();
      }
    },
    [enabled, threshold, onSwipeLeft, onSwipeRight, stopPropagationOnTrigger]
  );

  const onTouchCancel = useCallback(() => {
    startRef.current = null;
  }, []);

  return {
    onTouchStart,
    onTouchEnd,
    onTouchCancel,
  };
}

export interface BottomSheetDismissOptions {
  onClose: () => void;
  threshold?: number;
  enabled?: boolean;
}

/**
 * Permite cerrar un Bottom Sheet deslizando hacia abajo con feedback visual
 * en tiempo real y también tocando el fondo oscurecido exterior.
 */
export function useBottomSheetDragToDismiss({
  onClose,
  threshold = 84,
  enabled = true,
}: BottomSheetDismissOptions) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef<{
    x: number;
    y: number;
    canDrag: boolean;
  } | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      if (!enabled || e.touches.length !== 1) {
        startRef.current = null;
        return;
      }
      if (isInteractiveControl(e.target)) {
        startRef.current = null;
        return;
      }
      if (hasScrolledAncestor(e.target, e.currentTarget)) {
        startRef.current = null;
        return;
      }
      const touch = e.touches[0];
      startRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        canDrag: true,
      };
    },
    [enabled]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      const start = startRef.current;
      if (!enabled || !start?.canDrag || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;

      if (dy <= 6) {
        if (dragY !== 0) setDragY(0);
        return;
      }

      // Ignora gestos mayormente horizontales
      if (Math.abs(dx) > dy * 0.9 && !isDragging) {
        startRef.current = null;
        return;
      }

      setIsDragging(true);
      setDragY(Math.min(240, dy));
    },
    [enabled, dragY, isDragging]
  );

  const onTouchEnd = useCallback(() => {
    const shouldClose = dragY >= threshold;
    startRef.current = null;
    setIsDragging(false);
    setDragY(0);
    if (shouldClose) {
      onClose();
    }
  }, [dragY, threshold, onClose]);

  const onTouchCancel = useCallback(() => {
    startRef.current = null;
    setIsDragging(false);
    setDragY(0);
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const sheetStyle: React.CSSProperties = {
    transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
    transition: isDragging
      ? "none"
      : "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
  };

  return {
    dragY,
    isDragging,
    sheetTouchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
    },
    sheetStyle,
    handleBackdropClick,
  };
}
