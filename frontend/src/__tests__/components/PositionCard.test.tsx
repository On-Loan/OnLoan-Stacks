import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PositionCard } from "@/components/positions/PositionCard";
import type { CollateralPosition } from "@/types/protocol";

const mockPosition: CollateralPosition = {
  user: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  collateralType: "sbtc",
  collateralAmount: BigInt(100000000),
  borrowedAmount: BigInt(35000_000000),
  depositBlock: 100,
  lastInterestBlock: 200,
  isActive: true,
  healthFactor: 2.5,
  ltvRatio: 0.55,
  collateralValueUsd: 68000,
};

describe("PositionCard", () => {
  const handlers = {
    onRepay: vi.fn(),
    onAddCollateral: vi.fn(),
    onWithdraw: vi.fn(),
  };

  it("renders asset name", () => {
    render(<PositionCard position={mockPosition} {...handlers} />);
    expect(screen.getByText("sBTC Collateral")).toBeInTheDocument();
  });

  it("renders Active Position label", () => {
    render(<PositionCard position={mockPosition} {...handlers} />);
    expect(screen.getByText("Active Position")).toBeInTheDocument();
  });

  it("displays LTV percentage", () => {
    render(<PositionCard position={mockPosition} {...handlers} />);
    expect(screen.getByText("55.0%")).toBeInTheDocument();
  });

  it("shows health factor badge with healthy status", () => {
    render(<PositionCard position={mockPosition} {...handlers} />);
    expect(screen.getByText(/Healthy/)).toBeInTheDocument();
    expect(screen.getByText(/2\.50/)).toBeInTheDocument();
  });

  it("shows caution health factor badge", () => {
    const cautionPosition = { ...mockPosition, healthFactor: 1.3 };
    render(<PositionCard position={cautionPosition} {...handlers} />);
    expect(screen.getByText(/Caution/)).toBeInTheDocument();
  });

  it("shows at-risk health factor badge", () => {
    const riskPosition = { ...mockPosition, healthFactor: 1.05 };
    render(<PositionCard position={riskPosition} {...handlers} />);
    expect(screen.getByText(/At Risk/)).toBeInTheDocument();
  });

  it("renders three action buttons", () => {
    render(<PositionCard position={mockPosition} {...handlers} />);
    expect(screen.getByRole("button", { name: "Repay" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Collateral" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Withdraw" })
    ).toBeInTheDocument();
  });

  it("calls onRepay when Repay button is clicked", () => {
    render(<PositionCard position={mockPosition} {...handlers} />);
    fireEvent.click(screen.getByRole("button", { name: "Repay" }));
    expect(handlers.onRepay).toHaveBeenCalledTimes(1);
  });

  it("calls onAddCollateral when button is clicked", () => {
    render(<PositionCard position={mockPosition} {...handlers} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Collateral" }));
    expect(handlers.onAddCollateral).toHaveBeenCalledTimes(1);
  });

  it("calls onWithdraw when button is clicked", () => {
    render(<PositionCard position={mockPosition} {...handlers} />);
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    expect(handlers.onWithdraw).toHaveBeenCalledTimes(1);
  });
});
