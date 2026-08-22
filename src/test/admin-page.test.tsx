import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminReviewDashboardPage from "@/app/admin/page";
import { repository } from "@/lib/data/repository";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("Admin review status feedback", () => {
  it("reports a rejected CMS mutation as an error instead of success", async () => {
    vi.useFakeTimers();
    const update = vi.spyOn(repository, "updateLessonReviewStatus").mockReturnValue({
      ok: false,
      reasonCode: "missing-review-evidence",
    });
    const view = render(<AdminReviewDashboardPage />);

    const controls = screen.getAllByRole("combobox", { name: "තත්ත්වය වෙනස් කරන්න" });
    fireEvent.change(controls[0], { target: { value: "Published" } });

    expect(update).toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("සටහන් කළ නොහැකි විය");
    expect(screen.getByRole("status")).not.toHaveTextContent("සමාලෝචන පාරදත්ත");

    view.unmount();
    expect(update).toHaveBeenCalledTimes(1);
  }, 30_000);
});
