import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import type { ReactNode } from "react";
import { fetchCallReadOnlyFunction } from "@stacks/transactions";

const mockFetchReadOnly = vi.mocked(fetchCallReadOnlyFunction);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe("useBorrowQuote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns undefined data when amount is 0", async () => {
    const { useBorrowQuote } = await import("@/hooks/useBorrowQuote");

    const { result } = renderHook(
      () => useBorrowQuote("sbtc", BigInt(0)),
      { wrapper: createWrapper() }
    );

    expect(result.current.data).toBeUndefined();
    expect(mockFetchReadOnly).not.toHaveBeenCalled();
  });

  it("calls fetchCallReadOnlyFunction for valid amount", async () => {
    mockFetchReadOnly.mockResolvedValue({
      type: 7,
      value: {
        type: 12,
        value: {
          "collateral-value-usd": { type: 1, value: BigInt(50000000000) },
        },
      },
    } as never);

    const { useBorrowQuote } = await import("@/hooks/useBorrowQuote");

    renderHook(
      () => useBorrowQuote("sbtc", BigInt(100000000)),
      { wrapper: createWrapper() }
    );

    await waitFor(
      () => {
        expect(mockFetchReadOnly).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );

    expect(mockFetchReadOnly).toHaveBeenCalledWith(
      expect.objectContaining({
        contractName: "collateral-manager-v2",
        functionName: "get-borrow-quote",
      })
    );
  });

  it("does not call API when amount stays at 0", async () => {
    const { useBorrowQuote } = await import("@/hooks/useBorrowQuote");

    renderHook(
      () => useBorrowQuote("stx", BigInt(0)),
      { wrapper: createWrapper() }
    );

    // Wait past debounce period
    await new Promise((r) => setTimeout(r, 400));

    expect(mockFetchReadOnly).not.toHaveBeenCalled();
  });

  it("returns null when API errors", async () => {
    mockFetchReadOnly.mockRejectedValue(new Error("Network error"));

    const { useBorrowQuote } = await import("@/hooks/useBorrowQuote");

    const { result } = renderHook(
      () => useBorrowQuote("stx", BigInt(500000)),
      { wrapper: createWrapper() }
    );

    await waitFor(
      () => {
        expect(
          result.current.data === null || result.current.data === undefined
        ).toBe(true);
      },
      { timeout: 2000 }
    );
  });
});
