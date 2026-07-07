import { describe, it, expect } from "vitest";
import { canTransition, applyTransition } from "./lifecycle";
import type { Employee, EmployeeStatus } from "./lifecycle";

describe("canTransition", () => {
  it("allows prospective → onboarding", () => {
    expect(canTransition("prospective", "onboarding")).toBe(true);
  });

  it("allows onboarding → active", () => {
    expect(canTransition("onboarding", "active")).toBe(true);
  });

  it("allows active → on_leave", () => {
    expect(canTransition("active", "on_leave")).toBe(true);
  });

  it("allows active → suspended", () => {
    expect(canTransition("active", "suspended")).toBe(true);
  });

  it("allows active → terminated", () => {
    expect(canTransition("active", "terminated")).toBe(true);
  });

  it("allows active → retired", () => {
    expect(canTransition("active", "retired")).toBe(true);
  });

  it("allows on_leave → active", () => {
    expect(canTransition("on_leave", "active")).toBe(true);
  });

  it("allows on_leave → terminated", () => {
    expect(canTransition("on_leave", "terminated")).toBe(true);
  });

  it("allows suspended → active", () => {
    expect(canTransition("suspended", "active")).toBe(true);
  });

  it("allows suspended → terminated", () => {
    expect(canTransition("suspended", "terminated")).toBe(true);
  });

  it("rejects active → onboarding", () => {
    expect(canTransition("active", "onboarding")).toBe(false);
  });

  it("rejects active → prospective", () => {
    expect(canTransition("active", "prospective")).toBe(false);
  });

  it("rejects terminated → active (terminal state)", () => {
    expect(canTransition("terminated", "active")).toBe(false);
  });

  it("rejects terminated → onboarding (terminal state)", () => {
    expect(canTransition("terminated", "onboarding")).toBe(false);
  });

  it("rejects terminated → retired (terminal state)", () => {
    expect(canTransition("terminated", "retired")).toBe(false);
  });

  it("rejects retired → active (terminal state)", () => {
    expect(canTransition("retired", "active")).toBe(false);
  });

  it("rejects retired → terminated (terminal state)", () => {
    expect(canTransition("retired", "terminated")).toBe(false);
  });

  it("rejects prospective → active (skipping onboarding)", () => {
    expect(canTransition("prospective", "active")).toBe(false);
  });

  it("rejects onboarding → on_leave", () => {
    expect(canTransition("onboarding", "on_leave")).toBe(false);
  });

  it("rejects on_leave → suspended", () => {
    expect(canTransition("on_leave", "suspended")).toBe(false);
  });

  it("rejects suspended → on_leave", () => {
    expect(canTransition("suspended", "on_leave")).toBe(false);
  });
});

describe("applyTransition", () => {
  it("returns a new object with updated status on legal transition", () => {
    const employee: Employee = { id: "1", name: "Alice", status: "active" };
    const result = applyTransition(employee, "retired");
    expect(result.status).toBe("retired");
  });

  it("does not mutate the original employee object", () => {
    const employee: Employee = { id: "1", name: "Alice", status: "active" };
    applyTransition(employee, "retired");
    expect(employee.status).toBe("active");
  });

  it("returns a spread copy (preserves other fields)", () => {
    const employee: Employee = { id: "42", name: "Bob", status: "on_leave" };
    const result = applyTransition(employee, "active");
    expect(result.id).toBe("42");
    expect(result.name).toBe("Bob");
    expect(result.status).toBe("active");
  });

  it("returns a new object reference (not the same object)", () => {
    const employee: Employee = { id: "1", name: "Alice", status: "active" };
    const result = applyTransition(employee, "terminated");
    expect(result).not.toBe(employee);
  });

  it("throws on illegal transition: terminated → active", () => {
    const employee: Employee = { id: "1", name: "Alice", status: "terminated" };
    expect(() => applyTransition(employee, "active")).toThrow();
  });

  it("throws with a descriptive message on illegal transition", () => {
    const employee: Employee = { id: "1", name: "Alice", status: "terminated" };
    expect(() => applyTransition(employee, "active")).toThrow(
      /terminated.*active/i
    );
  });

  it("throws on illegal transition: active → onboarding", () => {
    const employee: Employee = { id: "1", name: "Alice", status: "active" };
    expect(() => applyTransition(employee, "onboarding")).toThrow();
  });

  it("throws on illegal transition: retired → active", () => {
    const employee: Employee = { id: "1", name: "Alice", status: "retired" };
    expect(() => applyTransition(employee, "active")).toThrow();
  });

  it("handles prospective → onboarding legal transition", () => {
    const employee: Employee = { id: "1", name: "Carol", status: "prospective" };
    const result = applyTransition(employee, "onboarding");
    expect(result.status).toBe("onboarding");
  });

  it("handles suspended → active legal transition", () => {
    const employee: Employee = { id: "1", name: "Dave", status: "suspended" };
    const result = applyTransition(employee, "active");
    expect(result.status).toBe("active");
  });
});
