import { describe, it, expect } from "vitest";
import type { Employee, EmployeeStatus } from "./lifecycle.js";
import { parseISODate } from "./lifecycle.js";

describe("EmployeeStatus", () => {
  it("includes all seven expected status literals", () => {
    const statuses: EmployeeStatus[] = [
      "prospective",
      "onboarding",
      "active",
      "on_leave",
      "suspended",
      "terminated",
      "retired",
    ];
    expect(statuses).toHaveLength(7);
  });
});

describe("Employee interface", () => {
  it("accepts a fully-populated employee object", () => {
    const emp: Employee = {
      id: "emp-001",
      name: "Alice Smith",
      hireDate: "2020-01-15",
      birthDate: "1985-03-22",
      status: "active",
      baseAnnualSalary: 80_000,
      ptoBalanceDays: 15,
    };
    expect(emp.id).toBe("emp-001");
    expect(emp.name).toBe("Alice Smith");
    expect(emp.hireDate).toBe("2020-01-15");
    expect(emp.birthDate).toBe("1985-03-22");
    expect(emp.status).toBe("active");
    expect(emp.baseAnnualSalary).toBe(80_000);
    expect(emp.ptoBalanceDays).toBe(15);
  });

  it("allows every EmployeeStatus value in the status field", () => {
    const statuses: EmployeeStatus[] = [
      "prospective",
      "onboarding",
      "active",
      "on_leave",
      "suspended",
      "terminated",
      "retired",
    ];
    for (const status of statuses) {
      const emp: Employee = {
        id: "x",
        name: "Test",
        hireDate: "2000-01-01",
        birthDate: "1990-01-01",
        status,
        baseAnnualSalary: 0,
        ptoBalanceDays: 0,
      };
      expect(emp.status).toBe(status);
    }
  });
});

describe("parseISODate", () => {
  it("returns a Date for a valid YYYY-MM-DD string", () => {
    const d = parseISODate("2024-06-15");
    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(15);
  });

  it("parses the edge case 2000-01-01 correctly", () => {
    const d = parseISODate("2000-01-01");
    expect(d.getFullYear()).toBe(2000);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it("throws an Error for a non-date string", () => {
    expect(() => parseISODate("not-a-date")).toThrow(Error);
  });

  it("throws for MM/DD/YYYY format", () => {
    expect(() => parseISODate("06/15/2024")).toThrow(Error);
  });

  it("throws for a partial date (YYYY-MM only)", () => {
    expect(() => parseISODate("2024-06")).toThrow(Error);
  });

  it("throws for an empty string", () => {
    expect(() => parseISODate("")).toThrow(Error);
  });

  it("throws for an invalid day (Feb 30)", () => {
    expect(() => parseISODate("2024-02-30")).toThrow(Error);
  });

  it("throws for an invalid month (month 13)", () => {
    expect(() => parseISODate("2024-13-01")).toThrow(Error);
  });

  it("throws for day zero", () => {
    expect(() => parseISODate("2024-01-00")).toThrow(Error);
  });

  it("error message includes the offending input value", () => {
    expect(() => parseISODate("bad-input")).toThrowError(/bad-input/);
  });

  it("error message includes the offending input for a wrong-format date", () => {
    expect(() => parseISODate("06/15/2024")).toThrowError(/06\/15\/2024/);
  });
});
