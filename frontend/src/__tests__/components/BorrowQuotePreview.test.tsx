import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BorrowQuotePreview } from "@/components/borrowing/BorrowQuotePreview";
import type { BorrowQuote } from "@/types/protocol";

describe("BorrowQuotePreview", () => {
  const baseProps = {
    collateralAsset: "sbtc" as const,
    isLoading: false,
    quote: null as BorrowQuote | null,
    amount: BigInt(0),
  };

  it("shows empty state when amount is 0", () => {
    render(<BorrowQuotePreview {...baseProps} amount={BigInt(0)} />);
    expect(
      screen.getByText("Enter collateral amount to see quote")
    ).toBeInTheDocument();
  });

  it("shows skeleton loaders when isLoading", () => {
    render(
      <BorrowQuotePreview
        {...baseProps}
        amount={BigInt(100000000)}
        isLoading={true}
      />
    );
    // Skeleton elements render as divs with the animate-pulse class
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows error state when quote is null and amount > 0", () => {
    render(
      <BorrowQuotePreview
        {...baseProps}
        amount={BigInt(100000000)}
        quote={null}
      />
    );
    expect(screen.getByText("Unable to fetch quote")).toBeInTheDocument();
  });

  it("renders quote data correctly", () => {
    const quote: BorrowQuote = {
      collateralValueUsd: BigInt(50000_000000),
      maxBorrowableUsdcx: BigInt(35000_000000),
      currentLtv: 70,
      healthFactor: 2,
      oraclePrice: BigInt(68000_000000),
      assetLtvLimit: 70,
    };

    render(
      <BorrowQuotePreview
        {...baseProps}
        amount={BigInt(100000000)}
        quote={quote}
      />
    );

    expect(screen.getByText("Collateral Value")).toBeInTheDocument();
    expect(screen.getByText("Oracle Price")).toBeInTheDocument();
    expect(screen.getByText("Max LTV")).toBeInTheDocument();
    expect(screen.getByText("Max Borrowable")).toBeInTheDocument();
  });

  it("displays formatted USD values for the quote", () => {
    const quote: BorrowQuote = {
      collateralValueUsd: BigInt(50000_000000),
      maxBorrowableUsdcx: BigInt(35000_000000),
      currentLtv: 70,
      healthFactor: 2,
      oraclePrice: BigInt(68000_000000),
      assetLtvLimit: 70,
    };

    render(
      <BorrowQuotePreview
        {...baseProps}
        amount={BigInt(100000000)}
        quote={quote}
      />
    );

    expect(screen.getByText("$50,000.00")).toBeInTheDocument();
    expect(screen.getByText("70.00%")).toBeInTheDocument();
  });

  it("shows sBTC symbol in oracle price for sbtc asset", () => {
    const quote: BorrowQuote = {
      collateralValueUsd: BigInt(50000_000000),
      maxBorrowableUsdcx: BigInt(35000_000000),
      currentLtv: 70,
      healthFactor: 2,
      oraclePrice: BigInt(68000_000000),
      assetLtvLimit: 70,
    };

    render(
      <BorrowQuotePreview
        {...baseProps}
        amount={BigInt(100000000)}
        quote={quote}
      />
    );

    expect(screen.getByText(/sBTC/)).toBeInTheDocument();
  });
});
