import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("@stacks/connect", () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  isConnected: vi.fn(() => false),
  getLocalStorage: vi.fn(() => null),
  request: vi.fn(),
}));

vi.mock("@stacks/transactions", async () => {
  const actual = await vi.importActual<typeof import("@stacks/transactions")>(
    "@stacks/transactions"
  );
  return {
    ...actual,
    fetchCallReadOnlyFunction: vi.fn(() =>
      Promise.resolve({ type: 7, value: { type: 1, value: BigInt(0) } })
    ),
  };
});

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => {
    const { createElement } = require("react");
    return createElement("a", { href, ...rest }, children);
  },
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop) => {
        const { forwardRef, createElement } = require("react");
        return forwardRef((props: Record<string, unknown>, ref: unknown) => {
          const {
            initial: _i,
            animate: _a,
            exit: _e,
            transition: _t,
            whileHover: _wh,
            whileInView: _wv,
            viewport: _vp,
            variants: _v,
            ...rest
          } = props;
          return createElement(prop as string, { ...rest, ref });
        });
      },
    }
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("lucide-react", () => {
  const { forwardRef, createElement } = require("react");
  return new Proxy(
    {},
    {
      get: (_target: unknown, prop: string) => {
        if (prop === "__esModule") return true;
        return forwardRef((props: Record<string, unknown>, ref: unknown) =>
          createElement("svg", { ...props, ref, "data-testid": `icon-${prop}` })
        );
      },
      has: () => true,
    }
  );
});

const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        parsed: [
          {
            price: {
              price: "6800000000000",
              expo: -8,
            },
          },
        ],
      }),
  })
) as unknown as typeof globalThis.fetch;

globalThis.fetch = mockFetch;
