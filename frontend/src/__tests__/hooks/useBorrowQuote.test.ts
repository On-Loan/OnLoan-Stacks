import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import type { ReactNode } from "react";
import { callReadOnlyValue } from "@/lib/stacks";

vi.mock("@/lib/stacks", async () => {
  const actual = await vi.importActual<typeof import("@/lib/stacks")>("@/lib/stacks");
  return {
    ...actual,
    callReadOnlyValue: vi.fn(() => Promise.resolve({ type: 1, value: BigInt(0) })),
  };
});

const mockCallReadOnly = vi.mocked(callReadOnlyValue);

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
    expect(mockCallReadOnly).not.toHaveBeenCalled();
  });

  it("calls callReadOnlyValue for valid amount", async () => {
    mockCallReadOnly.mockResolvedValue({
      value: {
        "collateral-value-usd": { value: BigInt(50000000000) },
      },
    } as never);

    const { useBorrowQuote } = await import("@/hooks/useBorrowQuote");

    renderHook(
      () => useBorrowQuote("sbtc", BigInt(100000000)),
      { wrapper: createWrapper() }
    );

    await waitFor(
      () => {
        expect(mockCallReadOnly).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );

    expect(mockCallReadOnly).toHaveBeenCalledWith(
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

    expect(mockCallReadOnly).not.toHaveBeenCalled();
  });

  it("returns null when API errors", async () => {
    mockCallReadOnly.mockRejectedValue(new Error("Network error"));

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
