import { cn } from '@lilog/ui';
import { Loader2 } from 'lucide-react';
import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from 'react';

const PULL_THRESHOLD = 64;
const MAX_PULL = 96;

function getScrollParent(el: HTMLElement | null): HTMLElement {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return document.documentElement;
}

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canPull = useCallback(() => {
    const scrollParent = getScrollParent(scrollRef.current);
    return scrollParent.scrollTop <= 0;
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (disabled || isRefreshing) return;
      if (!canPull()) return;
      touchStartY.current = e.touches[0]?.clientY ?? 0;
      isPulling.current = true;
      setIsDragging(true);
    },
    [canPull, disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (!isPulling.current || disabled || isRefreshing) return;
      if (!canPull()) {
        isPulling.current = false;
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0]?.clientY ?? 0;
      const delta = currentY - touchStartY.current;

      if (delta > 0) {
        e.preventDefault();
        const damped = Math.min(delta * 0.5, MAX_PULL);
        setPullDistance(damped);
      } else {
        setPullDistance(0);
      }
    },
    [canPull, disabled, isRefreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    setIsDragging(false);

    if (pullDistance >= PULL_THRESHOLD && !disabled && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [disabled, isRefreshing, onRefresh, pullDistance]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const showIndicator = pullDistance > 0 || isRefreshing;

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'pointer-events-none absolute left-0 right-0 z-30 flex justify-center transition-opacity duration-150',
          showIndicator ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          top: `calc(env(safe-area-inset-top, 0px) + ${Math.max(pullDistance - 24, 0)}px)`,
        }}
      >
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high shadow-md',
            isRefreshing && 'animate-spin'
          )}
          style={{
            transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
          }}
        >
          <Loader2
            className={cn(
              'h-5 w-5 text-secondary transition-opacity',
              progress >= 1 || isRefreshing ? 'opacity-100' : 'opacity-40'
            )}
          />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scroll-native"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 200ms ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => void handleTouchEnd()}
        onTouchCancel={() => {
          isPulling.current = false;
          setIsDragging(false);
          setPullDistance(0);
        }}
      >
        {children}
      </div>
    </div>
  );
}
