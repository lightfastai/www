// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { subscribeToNewsletter } from "../app/(site)/(marketing)/_actions/newsletter";
import { Newsletter } from "../app/(site)/(marketing)/_components/newsletter";
import { NewsletterSection } from "../app/(site)/(marketing)/_components/newsletter-section";

vi.mock("../app/(site)/(marketing)/_actions/newsletter", () => ({
  subscribeToNewsletter: vi.fn(),
}));
afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

for (const [name, Component, submitLabel] of [
  ["section", NewsletterSection, "Sign up"],
  ["footer", Newsletter, "Subscribe"],
] as const) {
  describe(`${name} newsletter`, () => {
    it("requires an email and exposes its help and consent", async () => {
      const user = userEvent.setup();
      render(<Component />);
      const email = screen.getByRole("textbox", { name: "Email address" });
      expect(email).toBeRequired();
      expect(email).toHaveAttribute("type", "email");
      expect(email).toHaveAccessibleDescription();
      await user.click(screen.getByRole("button", { name: submitLabel }));
      expect(subscribeToNewsletter).not.toHaveBeenCalled();
      if (name === "section") {
        const consent = screen.getByRole("checkbox");
        expect(consent).toHaveAccessibleName(/receive updates from Lightfast/);
        await user.type(email, "reader@example.test");
        await user.click(screen.getByRole("button", { name: submitLabel }));
        expect(subscribeToNewsletter).not.toHaveBeenCalled();
      }
    });

    it.each(["success", "error"] as const)(
      "announces pending then %s and permits a fresh attempt",
      async (status) => {
        const user = userEvent.setup();
        let finish!: (value: {
          status: "success" | "error";
          message: string;
        }) => void;
        vi.mocked(subscribeToNewsletter).mockImplementation(
          () =>
            new Promise((resolve) => {
              finish = resolve;
            })
        );
        const { container } = render(<Component />);
        const email = screen.getByRole("textbox", { name: "Email address" });
        await user.type(email, "reader@example.test");
        if (name === "section") {
          await user.click(screen.getByRole("checkbox"));
        }
        await user.click(screen.getByRole("button", { name: submitLabel }));
        expect(subscribeToNewsletter).toHaveBeenCalledTimes(1);
        expect(
          vi.mocked(subscribeToNewsletter).mock.calls[0]?.[1].get("email")
        ).toBe("reader@example.test");
        expect(container.querySelector("form")).toHaveAttribute(
          "aria-busy",
          "true"
        );
        expect(email).toBeDisabled();
        expect(
          screen.getByRole("button", { name: "Subscribing" })
        ).toBeDisabled();
        expect(
          screen.getByText("Submitting your email address.")
        ).toHaveAttribute("aria-live", "polite");
        const message =
          status === "success"
            ? "You're subscribed. Stay tuned for updates."
            : "We couldn't subscribe that address. Please try again.";
        await act(() => finish({ status, message }));
        const result = screen.getByRole(
          status === "success" ? "status" : "alert"
        );
        expect(result).toHaveAttribute("aria-atomic", "true");
        expect(result).toHaveAttribute(
          "aria-live",
          status === "success" ? "polite" : "assertive"
        );
        expect(result).toHaveTextContent(
          name === "section" && status === "success"
            ? "You're on the list"
            : message
        );
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
        await user.click(
          screen.getByRole("button", {
            name: status === "success" ? "Use another email" : "Try again",
          })
        );
        expect(
          screen.getByRole("textbox", { name: "Email address" })
        ).toHaveValue("");
        expect(screen.getByRole("button", { name: submitLabel })).toBeEnabled();
        if (name === "section") {
          expect(screen.getByRole("checkbox")).not.toBeChecked();
        }
      }
    );
  });
}
