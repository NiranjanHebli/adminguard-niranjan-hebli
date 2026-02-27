# Admin Guard

[![React](https://img.shields.io/badge/React-17.0.2-blue?logo=react)](https://reactjs.org/)
[![Formik](https://img.shields.io/badge/Formik-2.4.5-orange?logo=npm)](https://formik.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)](https://nodejs.org/)[![Eligibility Engine](https://img.shields.io/badge/Eligibility%20Rule%20Engine-JSON%20Config-purple)](https://your-repo-or-docs-link)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-lightblue?logo=postgresql)](https://www.postgresql.org/)




## Problem Statement

**The Bottleneck**: Candidate data entry via Google Sheets/Excel operates without validation or eligibility rule enforcement, allowing unqualified applicants to progress through expensive recruitment stages undetected.

### Core Issues
- **No data validation** at entry - salespeople/ops enter free-form data without restrictions
- **Complex eligibility rules** (degree type, CGPA thresholds, work exp, age limits, documents) unknown to data entry staff
- **Silent error propagation** - ineligible candidates advance to costly interview stages before document verification rejection
- **Untracked exceptions** - borderline cases (59.8% vs 60% cutoff) lack documented rationale/audit trail
- **Static rules** - Excel cannot adapt when IIT eligibility criteria change between cohorts

### Business Impact
- **Wasted resources** - counselor/interview panel time spent on ineligible candidates
- **Inconsistent decisions** - no standardized exception handling
- **Audit gaps** - cannot trace borderline approvals
- **Candidate frustration** - false expectations set before late-stage rejection

## Proposed Solution

**Web-based Enrollment Form with Built-in Intelligence**

Replace Google Sheets entry with a **multi-step validation form** (11 fields → 3 logical steps) that enforces eligibility rules in real-time.

### Key Features
- **Step 1: Basic Info** (Name, Email, Degree Type, CGPA %) → **Auto-eligibility check** flags immediate rejects
- **Step 2: Experience/Age** → **Conditional fields** (show work exp only if degree < cutoff)
- **Step 3: Documents** → **Only shown to eligible candidates** + exception request form
- **Smart Exception Handling** → Dropdown rationale + manager approval workflow
- **Admin Dashboard** → Rule updates (no code changes), audit trail, rejection analytics

### Techstack 


Frontend:
React + Formik (validation)

Backend:
Node.js + Eligibility Rule Engine (JSON config)

Database:
PostgreSQL (audit trail)

Deployment:
Vercel/Netlify (zero server management)


### Expected Results
- **80% reduction** in interview-stage rejections
- **3x faster** data entry with auto-validation
- **Full audit trail** for borderline cases
- **Rule changes** deploy in 5 minutes vs 2 days

**MVP in 2 weeks**: Form + 3 core eligibility rules + exception logging.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
