import { describe, expect, it } from "vitest";

import {
  AMOUNT_EPSILON,
  allocatedAmount,
  canTransitionWorkflow,
  isCancelledByUserReconciliation,
  isFullyAllocated,
  isRetryableWorkflowStatus,
  isTerminalWorkflowStatus,
  remainingAmount,
  type WorkflowStatus,
} from "@maille/core/workflows";

const ALL_STATUSES: WorkflowStatus[] = [
  "queued",
  "running",
  "pending",
  "succeeded",
  "failed",
  "cancelled",
];

describe("workflow status machine", () => {
  it("queued only moves to running or cancelled", () => {
    expect(canTransitionWorkflow("queued", "running")).toBe(true);
    expect(canTransitionWorkflow("queued", "cancelled")).toBe(true);
    expect(canTransitionWorkflow("queued", "succeeded")).toBe(false);
    expect(canTransitionWorkflow("queued", "pending")).toBe(false);
    expect(canTransitionWorkflow("queued", "failed")).toBe(false);
    expect(canTransitionWorkflow("queued", "queued")).toBe(false);
  });

  it("running ends in pending, succeeded or failed", () => {
    for (const to of ALL_STATUSES) {
      const allowed = ["pending", "succeeded", "failed", "cancelled"].includes(to);
      expect(canTransitionWorkflow("running", to as WorkflowStatus)).toBe(allowed);
    }
  });

  it("pending resumes through running", () => {
    expect(canTransitionWorkflow("pending", "running")).toBe(true);
    expect(canTransitionWorkflow("pending", "succeeded")).toBe(false);
    expect(canTransitionWorkflow("pending", "failed")).toBe(false);
  });

  it("succeeded is a dead end", () => {
    for (const to of ALL_STATUSES) {
      expect(canTransitionWorkflow("succeeded", to)).toBe(false);
    }
  });

  it("failed and cancelled can only be revived by a manual re-queue", () => {
    expect(canTransitionWorkflow("failed", "queued")).toBe(true);
    expect(canTransitionWorkflow("cancelled", "queued")).toBe(true);
    expect(canTransitionWorkflow("failed", "running")).toBe(false);
    expect(canTransitionWorkflow("cancelled", "running")).toBe(false);
  });

  it("terminal, retryable and user-cancellable status sets", () => {
    expect(isTerminalWorkflowStatus("succeeded")).toBe(true);
    expect(isTerminalWorkflowStatus("failed")).toBe(true);
    expect(isTerminalWorkflowStatus("cancelled")).toBe(true);
    expect(isTerminalWorkflowStatus("queued")).toBe(false);
    expect(isTerminalWorkflowStatus("running")).toBe(false);
    expect(isTerminalWorkflowStatus("pending")).toBe(false);

    expect(isRetryableWorkflowStatus("failed")).toBe(true);
    expect(isRetryableWorkflowStatus("cancelled")).toBe(true);
    expect(isRetryableWorkflowStatus("succeeded")).toBe(false);
    expect(isRetryableWorkflowStatus("pending")).toBe(false);

    expect(isCancelledByUserReconciliation("queued")).toBe(true);
    expect(isCancelledByUserReconciliation("running")).toBe(true);
    expect(isCancelledByUserReconciliation("pending")).toBe(true);
    expect(isCancelledByUserReconciliation("failed")).toBe(false);
    expect(isCancelledByUserReconciliation("succeeded")).toBe(false);
  });
});

describe("movement allocation", () => {
  it("sums link amounts", () => {
    expect(allocatedAmount([])).toBe(0);
    expect(allocatedAmount([-12.99])).toBe(-12.99);
    expect(allocatedAmount([-5, -7.99])).toBeCloseTo(-12.99, 10);
  });

  it("computes the remaining amount to allocate", () => {
    expect(remainingAmount(-12.99, [])).toBe(-12.99);
    expect(remainingAmount(-12.99, [-5])).toBeCloseTo(-7.99, 10);
    expect(remainingAmount(1500, [1500])).toBe(0);
  });

  it("treats sub-epsilon remainders as fully allocated", () => {
    expect(remainingAmount(-10, [-9.999999])).toBe(0);
    expect(isFullyAllocated(-10, [-9.999999])).toBe(true);
    expect(AMOUNT_EPSILON).toBeLessThan(0.01);
  });

  it("detects partial allocation", () => {
    expect(isFullyAllocated(-20, [-15])).toBe(false);
    expect(isFullyAllocated(-20, [-15, -5])).toBe(true);
    expect(isFullyAllocated(-20, [-25])).toBe(false);
  });
});
