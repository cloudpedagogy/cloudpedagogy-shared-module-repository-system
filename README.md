# CloudPedagogy Shared Module Repository System (SMRS)

The **CloudPedagogy Shared Module Repository System (SMRS)** is an open-source, local-first web application for authoring, versioning, and managing reusable curriculum modules and academic programmes.

Built with React, TypeScript, and Vite, SMRS provides educators, curriculum designers, and programme leaders with an intuitive, reliable system for governing shared learning assets, tracking version lifecycles, and assembling programmes with explicit version pinning.

---

## 🎯 Intended Users & Purpose

- **Curriculum Designers & Module Authors:** Create and refine module specifications, define learning outcomes, configure weighted assessments, and track curricular evolution over time.
- **Programme Leaders & Academic Teams:** Assemble programmes from shared modules, sequence curriculum pathways, and pin specific published versions to safeguard educational integrity.
- **Academic Quality & Governance Committees:** Review version diffs, inspect historical metadata snapshots, and audit prerequisite dependencies and integrity warnings.

---

## 🚀 Core Capabilities

### 1. Blank-First Operation & Optional Demonstration Data
- First-time users can choose to:
  - **Create Blank Repository:** Begin immediately with an empty, clean workspace.
  - **Explore Demonstration Repository:** Load an optional synthetic Public Health curriculum dataset featuring shared modules, version progressions, and intentional reference warnings.
  - **Import Existing Repository:** Restore previously exported native JSON datasets.
- Demonstration data is strictly optional and is never loaded automatically over user data.

### 2. Module Authoring & Progressive Disclosure
- **Staged Progressive Disclosure:** SMRS avoids cognitive overload by separating basic identification from detailed curriculum authoring.
  - *Module Creation:* Clear two-step staged workflow (`1. Basic Details & Credits`, `2. Initial Outcomes & Assessment`) with optional faculty and tags tucked into a collapsible section.
  - *Draft Content Editor:* Organised into 4 focused tabs (`1. Learning Outcomes`, `2. Assessments & Weighting`, `3. Prerequisites & Dependencies`, `4. Snapshot Metadata & Outline`), with real-time readiness feedback and non-linear navigation.
  - *Direct Drawer Actions:* The Module Inspector presents immediate draft actions (`✎ Edit Draft Content`, `Check Readiness`, `Publish Release`) in the top banner with zero scrolling required.
- Create modules with stable unique identifiers, academic codes, titles, descriptions, levels, credit values, and ownership tags.
- Full validation ensures module codes are non-empty and unique across the repository.
- Baseline metadata serves as canonical defaults while preserving historical version independence.

### 3. Version Lifecycle Governance
- Implements a rigorous four-stage lifecycle:
  $$\text{Draft} \longrightarrow \text{Published} \longrightarrow \text{Deprecated} \longrightarrow \text{Archived}$$
- **Draft Versioning:** Modules begin with an editable initial draft (v1.0.0). Curriculum content, learning outcomes, assessment components, and dependencies remain editable only while in draft status.
- **Publishing Pre-flight Verification:** Publishing locks the version into an immutable snapshot. Pre-flight checks verify that:
  - Assessment weightings total exactly 100%.
  - Assessments have non-empty types and valid percentage weights (0–100%).
  - At least one learning outcome is specified.
  - A substantive version description is provided.
  - No self-dependencies or duplicate dependencies exist.
- **Successor Drafts:** Authors can create successor drafts with valid SemVer increments (Major, Minor, Patch). A single active draft policy ensures clarity.
- **Historical Immutability & Snapshots:** Published versions preserve their exact academic metadata (title, code, level, credits, outcomes, assessments) as immutable snapshots. Subsequent edits to canonical module metadata do not alter historical records.
- **Deprecation & Archival:** Deprecate ageing versions with transition notes or retire them to Archived status. Archived versions are blocked from assignment or repinning to active programmes.
- **Visual Version Comparison:** Inspect structured side-by-side diffs showing added, removed, or modified learning outcomes, assessment weight changes, and dependency adjustments between any two versions.

### 4. Programme Composition & Independent Version Pinning
- Create and edit academic programmes with unique programme codes.
- Assemble programmes by selecting published or deprecated module versions. Drafts and archived versions are barred from assignment.
- Reorder modules deliberately within a programme using accessible controls.
- Prevent accidental duplicate assignments of the same module within a single programme.
- **Independent Version Pinning:** Re-pinning a module version in Programme A leaves all other programmes referencing that module completely unchanged.
- **Accurate Credit Totals:** Total programme credits are dynamically computed from each module's pinned version metadata. If unresolved module or version references exist, credit totals display an explicit warning indicator rather than misleading figures.

### 5. Safe Dependency & Relationship Management
- **Inbound Dependency Protection:** Modules referenced by active programmes or declared as prerequisites by other modules cannot be deleted until references are resolved.
- **Prerequisite Validation:** Self-dependencies and duplicate dependencies are rejected.
- **Circular Prerequisite Detection:** Cycle detection algorithms identify direct or indirect circular prerequisite chains across the curriculum graph.
- **Programme Conflict Signals:** Real-time diagnostics alert users to missing modules, unresolvable version pins, deprecated modules, or unsatisfied prerequisite dependencies.

### 6. Local Persistence, Data Portability & Error Recovery
- **100% Client-Side Local Storage:** All repository data is stored locally in the user's browser (`localStorage`). No data is sent to external servers or cloud services.
- **Native JSON Export/Import:** Export complete repository datasets (including all modules, historical version snapshots, programmes, and ordering).
- **Three-Tier Import Validation:**
  1. *Schema/Syntax Incompatibilities:* Malformed or invalid data is rejected without modifying the existing repository.
  2. *Integrity Warnings:* Valid data with missing reference warnings requires informed confirmation.
  3. *Clean Datasets:* Valid datasets import cleanly.
- **Legacy Migration:** Automatically detects and migrates legacy Schema 1 datasets to Schema 2 historical snapshot structures without fabricating synthetic academic data.
- **Storage Corruption Safeguard:** If stored data fails validation upon application boot, SMRS isolates the corruption, initializes a clean workspace, and provides an export recovery banner allowing users to extract raw data or restore a backup.

---

## 🛠️ Getting Started Locally

### Prerequisites
- Node.js (version 18+ or 20+ recommended)
- npm (version 9+)

### Installation & Execution
```bash
# Clone the repository
git clone https://github.com/cloudpedagogy/cloudpedagogy-shared-module-repository-system.git
cd cloudpedagogy-shared-module-repository-system

# Install dependencies
npm install

# Start local development server
npm run dev
```
Open your browser to `http://localhost:5173` (or the port indicated in your terminal).

### Automated Testing & Production Build
```bash
# Run Vitest automated test suite
npm test

# Run TypeScript typecheck
npm run typecheck

# Build optimized production bundle
npm run build
```

---

## 📖 Recommended Authoring Workflow

1. **Initialize Workspace:** Choose *Create Blank Repository* to start fresh or *Explore Demonstration Repository* to inspect sample structures.
2. **Author a Module:** Click **+ New Module** in the Module Registry. Fill in the module code, title, level, and credit value. An initial editable draft (v1.0.0) is created automatically.
3. **Draft Curriculum Content:** Click the module card to open the Inspector, then click **Edit Draft**. Add learning outcomes, define weighted assessment components, and add any prerequisites.
4. **Publish Version:** From the Inspector, click **Publish Version**. SMRS runs pre-flight validation (verifying 100% total assessment weight, valid descriptions, and dependencies). Upon confirmation, the version is published as an immutable snapshot.
5. **Create an Academic Programme:** Switch to the **Programme Composition** tab and click **+ New Programme**. Enter the programme code and title.
6. **Assign Modules & Pin Versions:** Click **+ Add Module** within the programme view. Select the published module and choose the desired version pin.
7. **Create Successor Versions:** When updating curriculum, open the module in the Inspector and click **Create Successor Draft** (e.g. v1.1.0 or v2.0.0). Update outcomes and assessments, then publish.
8. **Re-pin Programme Deliberately:** Return to the programme view. If an update is available, click **Re-pin Version** to update that programme's reference. All other programmes remain pinned to their existing versions.
9. **Export Backup:** Click **Export JSON** in the top navigation to download a local backup file of your curriculum repository.

---

## 🔒 Data Privacy & Storage Considerations

- **Local-First Architecture:** SMRS runs entirely within your web browser. No accounts, logins, telemetry, cookies, or remote database synchronisation are utilized.
- **Browser Storage Limitations:** Data is persisted in `localStorage`. Clearing browser caches or using incognito/private browsing mode will remove locally stored repository data.
- **Backup Best Practice:** Users are strongly advised to regularly use **Export JSON** to maintain persistent external backups of important curriculum repositories.

---

## ⚠️ Known Limitations & Scope Exclusions

- **Single-User Local Execution:** SMRS is designed as a standalone single-user workstation. It does not provide real-time concurrent multi-user collaboration or remote conflict resolution.
- **Enterprise Integrations:** SMRS does not include direct connections to student information systems (SIS), enterprise databases, or automated timetable scheduling systems.
- **Workload / Strain Simulation:** SMRS focuses on curriculum structural registry and version management; student workload modeling is outside its scope.

---

## 📜 Licensing

This software is released under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## ☁️ About CloudPedagogy

CloudPedagogy develops open, governance-credible resources for building confident, responsible AI capability and curriculum engineering across education, research, and public service.

- **Website:** [https://www.cloudpedagogy.com/](https://www.cloudpedagogy.com/)
- **Framework:** [CloudPedagogy AI Capability Framework](https://www.cloudpedagogy.com/framework)
