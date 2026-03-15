import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WalletConnect } from "@/components/common/WalletConnect";

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock("@/providers/WalletProvider", () => ({
  useWallet: vi.fn(() => ({
    connected: false,
    stxAddress: null,
    connect: mockConnect,
    disconnect: mockDisconnect,
  })),
}));

vi.mock("@radix-ui/react-dropdown-menu", () => ({
  Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Trigger: ({
    children,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <div>{children}</div>,
  Portal: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Content: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [k: string]: unknown;
  }) => <div>{children}</div>,
  Item: ({
    children,
    onSelect,
  }: {
    children: React.ReactNode;
    onSelect?: () => void;
    [k: string]: unknown;
  }) => (
    <button onClick={onSelect}>
      {children}
    </button>
  ),
}));

describe("WalletConnect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Connect Wallet button when not connected", () => {
    render(<WalletConnect />);
    expect(
      screen.getByRole("button", { name: /Connect Wallet/i })
    ).toBeInTheDocument();
  });

  it("calls connect on button click when disconnected", () => {
    render(<WalletConnect />);
    fireEvent.click(
      screen.getByRole("button", { name: /Connect Wallet/i })
    );
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it("shows truncated address when connected", async () => {
    const { useWallet } = await import("@/providers/WalletProvider");
    vi.mocked(useWallet).mockReturnValue({
      connected: true,
      stxAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
      connect: mockConnect,
      disconnect: mockDisconnect,
    });

    render(<WalletConnect />);
    expect(screen.getByText("ST1PQH…GZGM")).toBeInTheDocument();
  });

  it("shows Connected fallback when stxAddress is null", async () => {
    const { useWallet } = await import("@/providers/WalletProvider");
    vi.mocked(useWallet).mockReturnValue({
      connected: true,
      stxAddress: null,
      connect: mockConnect,
      disconnect: mockDisconnect,
    });

    render(<WalletConnect />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("shows Disconnect option when connected", async () => {
    const { useWallet } = await import("@/providers/WalletProvider");
    vi.mocked(useWallet).mockReturnValue({
      connected: true,
      stxAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
      connect: mockConnect,
      disconnect: mockDisconnect,
    });

    render(<WalletConnect />);
    const disconnectBtn = screen.getByText("Disconnect");
    expect(disconnectBtn).toBeInTheDocument();
    fireEvent.click(disconnectBtn);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });
});
