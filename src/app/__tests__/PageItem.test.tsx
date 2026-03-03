import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PageItem } from "../components/PageItem";

describe("PageItem", () => {
  const mockPage = {
    id: "test-page-1",
    pageIndex: 0,
    sourceFileName: "test.pdf",
    rotation: 0,
    pdfBytes: new Uint8Array([]),
  };

  const mockCallbacks = {
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    onDelete: vi.fn(),
    onRotateClockwise: vi.fn(),
    onRotateCounterClockwise: vi.fn(),
  };

  it("should render page information", () => {
    render(
      <PageItem page={mockPage} index={0} totalPages={3} {...mockCallbacks} />,
    );

    expect(screen.getByText(/test.pdf/)).toBeInTheDocument();
    expect(screen.getByText("ページ 1")).toBeInTheDocument();
  });

  it("should call onMoveUp when move up button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <PageItem page={mockPage} index={1} totalPages={3} {...mockCallbacks} />,
    );

    const moveUpButton = screen.getByLabelText("Move page up");
    await user.click(moveUpButton);

    expect(mockCallbacks.onMoveUp).toHaveBeenCalled();
  });

  it("should call onMoveDown when move down button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <PageItem page={mockPage} index={0} totalPages={3} {...mockCallbacks} />,
    );

    const moveDownButton = screen.getByLabelText("Move page down");
    await user.click(moveDownButton);

    expect(mockCallbacks.onMoveDown).toHaveBeenCalled();
  });

  it("should call onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <PageItem page={mockPage} index={0} totalPages={3} {...mockCallbacks} />,
    );

    const deleteButton = screen.getByLabelText("Delete page");
    await user.click(deleteButton);

    expect(mockCallbacks.onDelete).toHaveBeenCalled();
  });

  it("should call onRotateCounterClockwise when counter-clockwise button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <PageItem page={mockPage} index={0} totalPages={3} {...mockCallbacks} />,
    );

    const rotateButton = screen.getByText(/左回転/);
    await user.click(rotateButton);

    expect(mockCallbacks.onRotateCounterClockwise).toHaveBeenCalled();
  });

  it("should call onRotateClockwise when clockwise button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <PageItem page={mockPage} index={0} totalPages={3} {...mockCallbacks} />,
    );

    const rotateButton = screen.getByText(/右回転/);
    await user.click(rotateButton);

    expect(mockCallbacks.onRotateClockwise).toHaveBeenCalled();
  });

  it("should disable move up button when first", () => {
    render(
      <PageItem page={mockPage} index={0} totalPages={3} {...mockCallbacks} />,
    );

    const moveUpButton = screen.getByLabelText("Move page up");
    expect(moveUpButton).toBeDisabled();
  });

  it("should disable move down button when last", () => {
    render(
      <PageItem page={mockPage} index={2} totalPages={3} {...mockCallbacks} />,
    );

    const moveDownButton = screen.getByLabelText("Move page down");
    expect(moveDownButton).toBeDisabled();
  });

  it("should show rotation indicator", () => {
    const rotatedPage = { ...mockPage, rotation: 90 };
    render(
      <PageItem
        page={rotatedPage}
        index={0}
        totalPages={3}
        {...mockCallbacks}
      />,
    );

    expect(screen.getByText(/回転: 90°/)).toBeInTheDocument();
  });
});
