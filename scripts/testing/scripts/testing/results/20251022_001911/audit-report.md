# Audit Report - Dashboard StabilSafe V3

**Generated:** 2025-10-21T22:19:11Z

---

## Summary

- **Total Tests:** 5
- **Passed:** 2 âœ…
- **Failed:** 3 âŒ
- **Warnings:** 0 âš ï¸

**Success Rate:** 40%

---

## Services Status

### âœ… Frontend

- **Status:** running
- **Port:** 5174

### âœ… Backend

- **Status:** running
- **Port:** 9998

---

## Endpoint Tests

| Endpoint | Method | Status | Time (ms) | Result |
|----------|--------|--------|-----------|--------|
| /api/summary | GET | 404 | 23.25 | âŒ |
| /api/devices/status | GET | 200 | 3096.31 | âŒ |
| /api/sessions | GET | 500 | 123.65 | âŒ |
| /api/events | GET | 200 | 3261.36 | âœ… |

---

## Upload Test

_No upload test performed_

---

## Performance Metrics

- **avg_other_endpoints_ms**: 1626.14
- **frontend_initial_load_ms**: N/A
- **avg_summary_time_ms**: 23.25

---

## End of Report

