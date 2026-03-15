import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "@/components/landing/Hero";

describe("Hero", () => {
  it("renders the heading text", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain("Lend");
    expect(heading.textContent).toContain("Borrow");
    expect(heading.textContent).toContain("on Bitcoin");
  });

  it("renders the subheading description", () => {
    render(<Hero />);
    expect(
      screen.getByText(/Earn yield on sBTC, STX, and USDCx/)
    ).toBeInTheDocument();
  });

  it("CTA button links to /dashboard", () => {
    render(<Hero />);
    const link = screen.getByRole("link", { name: /Launch App/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  it("renders the 'How It Works' link", () => {
    render(<Hero />);
    const link = screen.getByRole("link", { name: /How It Works/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "#how-it-works");
  });

  it("renders the 'Built on Bitcoin' badge", () => {
    render(<Hero />);
    expect(
      screen.getByText(/Built on Bitcoin via Stacks/)
    ).toBeInTheDocument();
  });
});
