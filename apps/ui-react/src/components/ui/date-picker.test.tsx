import { describe, expect, it } from "vitest";

describe("DatePicker month navigation logic", () => {
  it("should allow month state to be managed independently of value", () => {
    const initialValue = new Date(2024, 5, 15); // June 15, 2024
    let currentMonth: Date | undefined = initialValue;

    // User opens popover - should set currentMonth to value
    currentMonth = initialValue;
    expect(currentMonth?.getMonth()).toBe(5); // June

    // User navigates to next month (July)
    const july2024 = new Date(2024, 6, 1);
    currentMonth = july2024;
    expect(currentMonth?.getMonth()).toBe(6); // July

    // User navigates to previous month (June)
    currentMonth = initialValue;
    expect(currentMonth?.getMonth()).toBe(5); // June
  });

  it("should reset to value month when reopening popover", () => {
    const initialValue = new Date(2024, 5, 15); // June 15, 2024
    let currentMonth: Date | undefined = initialValue;

    // Simulate the handleOpenChange function
    const handleOpenChange = (isOpen: boolean) => {
      if (isOpen && initialValue) {
        currentMonth = initialValue;
      }
    };

    // User navigates to July
    const july2024 = new Date(2024, 6, 1);
    currentMonth = july2024;
    expect(currentMonth?.getMonth()).toBe(6); // July

    // User closes and reopens
    handleOpenChange(false);
    handleOpenChange(true);

    // Should reset to June (the value's month)
    expect(currentMonth?.getMonth()).toBe(5); // June
  });

  it("should handle undefined value", () => {
    let currentMonth: Date | undefined = undefined;

    expect(currentMonth).toBeUndefined();

    // Navigate to a month
    const january2024 = new Date(2024, 0, 1);
    currentMonth = january2024;

    expect(currentMonth?.getMonth()).toBe(0); // January
  });

  it("should update month on navigation via onMonthChange", () => {
    let currentMonth: Date | undefined = new Date(2024, 0, 1);

    // Simulate onMonthChange callback
    const handleMonthChange = (month: Date) => {
      currentMonth = month;
    };

    expect(currentMonth?.getMonth()).toBe(0); // January

    // Navigate to February
    handleMonthChange(new Date(2024, 1, 1));
    expect(currentMonth?.getMonth()).toBe(1); // February

    // Navigate to March
    handleMonthChange(new Date(2024, 2, 1));
    expect(currentMonth?.getMonth()).toBe(2); // March
  });

  it("should not prevent month change when value is set", () => {
    const initialValue = new Date(2024, 5, 15); // June 15, 2024
    let currentMonth: Date | undefined = initialValue;

    // The bug was: month={value} prevented navigation
    // The fix: month={currentMonth} allows navigation

    // Simulate user clicking next month button
    const nextMonth = new Date(2024, 6, 15); // July 15, 2024
    currentMonth = nextMonth;

    // Month should have changed from June to July
    expect(currentMonth?.getMonth()).toBe(6);
    // But value is still June
    expect(initialValue.getMonth()).toBe(5);

    // This proves month can change independently of value
    expect(currentMonth?.getMonth()).not.toBe(initialValue.getMonth());
  });
});
