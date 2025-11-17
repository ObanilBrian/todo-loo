import { useEffect, useRef, useCallback } from "react";

export const useInfiniteScroll = (columnKey, onLoadMore, hasNextPage) => {
  const observerTarget = useRef(null);

  useEffect(() => {
    if (!hasNextPage) {
      return;
    }

    const target = observerTarget.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore(columnKey);
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
      }
    );

    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [columnKey, onLoadMore, hasNextPage]);

  return observerTarget;
};
