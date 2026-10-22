# SMRS User Instructions & Authoring Guide

This guide provides practical step-by-step instructions for using the **Shared Module Repository System (SMRS)** to author modules, govern version lifecycles, and assemble programmes with version pins.

---

## 1. Initial Workspace Setup

When launching SMRS for the first time without saved data:
- **Create Blank Repository:** Click this to begin with an empty repository ready for new curriculum design.
- **Explore Demonstration Repository:** Click this to explore pre-populated sample modules and programmes (featuring intentional reference signals for illustration).
- **Import Existing Repository:** Click to upload a `.json` repository file previously exported from SMRS.

You can switch or reset your repository at any time via the top navigation bar.

---

## 2. Authoring & Managing Modules

SMRS utilizes **progressive disclosure** to present essential information first while keeping advanced controls readily accessible.

### Module Authoring Sequence:
1. **Basic Module Details:**
   - In the **Module Registry**, click **+ New Module**.
   - Enter **Module Code**, **Module Title**, **Academic Level**, **Credits**, and **Description**.
   - Optional departmental ownership and subject tags are neatly tucked into a collapsible **Optional Details** section.
   - Click **Next: Initial Outcomes (Optional) →** or click **Create Module** immediately.
2. **Initial Learning Outcomes & Assessments (Optional):**
   - Enter preliminary intended learning outcomes and initial assessment components, or leave blank to author them directly in the Draft Editor.
   - Click **Create Module**. An editable draft version (`v1.0.0`) is initialized automatically.
3. **Draft Curriculum Content Authoring:**
   - Click on the module card to open the **Module Inspector** drawer.
   - Click **✎ Edit Draft Content** directly in the Governance banner.
   - SMRS organizes draft authoring into 4 dedicated, staged tabs:
     - **Tab 1 — Learning Outcomes (ILOs):** Add and refine specific student competencies (minimum 1 required for publishing).
     - **Tab 2 — Assessments & Weighting:** Configure assessment methods and component weights (must total 100% to publish).
     - **Tab 3 — Prerequisites & Dependencies (Optional):** Declare prerequisites or corequisites with other modules in the repository.
     - **Tab 4 — Version Snapshot & Outline (Advanced):** Review or override frozen historical metadata (title, credits, level), release change summary, and syllabus units.
   - At the bottom of the editor, a real-time **Draft Progress & Readiness Strip** confirms when the draft satisfies all publishing rules.
   - Click **Save Draft Content** from any tab at any time. Drafts can be freely saved and resumed.
4. **Pre-flight Check & Publishing:**
   - In the Module Inspector, click **Check Readiness** to preview validation status.
   - Click **Publish Release** to review the frozen snapshot summary, verify immutability consequences, and formalize the release.

---

## 3. Version Lifecycle Governance

SMRS enforces a strict academic lifecycle:
$$\text{Draft} \longrightarrow \text{Published} \longrightarrow \text{Deprecated} \longrightarrow \text{Archived}$$

### Publishing a Version
1. Open the draft version in the Module Inspector.
2. Click **Publish Version**.
3. SMRS performs pre-flight checks:
   - Total assessment weights must equal exactly 100%.
   - At least one learning outcome must be specified.
   - A substantive description must be provided.
   - No self-dependencies or duplicate dependencies.
4. Confirm publication. Once published, the version snapshot becomes **permanently immutable**.

### Creating a Successor Draft
1. From a published module in the Inspector, click **Create Successor Draft**.
2. Select the SemVer release type:
   - **Patch:** Typo fixes, minor clarifications.
   - **Minor:** Revised learning outcomes, adjusted reading lists, updated syllabus.
   - **Major:** Structural redesign, substantial assessment restructuring, prerequisite changes.
3. Enter release notes and confirm. SMRS copies the previous version's curriculum content into the new draft while preserving historical snapshots.

### Deprecating and Archiving
- **Deprecate:** Mark a version as scheduled for phase-out. Programmes using it receive a warning advisory, but existing pins remain valid.
- **Archive:** Retire an obsolete version completely. SMRS prevents archived versions from being assigned or repinned to programmes.

---

## 4. Programme Composition & Version Pinning

### Creating Programmes
1. Switch to the **Programme Composition** tab.
2. Click **+ New Programme**.
3. Enter a unique Programme Code (e.g., `BSC-PH`) and Programme Title.
4. Click **Create Programme**.

### Adding Modules & Pinning Versions
1. Select the programme from the sidebar.
2. Click **+ Add Module**.
3. Select an available module from the dropdown. Only published or deprecated releases can be added (drafts and archived versions are disallowed).
4. Choose the specific version pin.
5. Click **Add to Programme**.

### Reordering Programme Modules
- Use the **Move Up** and **Move Down** arrow buttons on any module row to sequence modules in the intended pedagogical pathway.

### Independent Version Re-pinning
- If a newer published version of a module becomes available, an **Update Available** badge appears next to the pinned version.
- Click **Re-pin Version** on that module row to upgrade the reference.
- **Isolation Guarantee:** Re-pinning updates only the active programme. Other programmes referencing that module remain pinned to their selected versions.

---

## 5. Dependency & Relationship Integrity

- **Safe Deletion:** SMRS blocks the deletion of any module currently referenced in a programme or required as a prerequisite by another module.
- **Circular Prerequisite Detection:** The system flags any direct or indirect circular loops (e.g. Module A requiring Module B which requires Module A).
- **Integrity Signals:** The **Principles & Integrity** drawer in the header audits the entire repository for duplicate codes, broken pins, and missing targets in real time.

---

## 6. Data Portability, Backups & Recovery

- **Export JSON:** Click **Export JSON** in the header to download your entire repository to a local file on your computer.
- **Import JSON:** Click **Import JSON** to restore a repository. SMRS validates syntax, schema, and reference consistency before applying changes.
- **Persistence Error Recovery:** In the unlikely event of browser storage corruption, SMRS protects your workspace, initializes safely in-memory, and presents options to export the raw data or restore from a backup.
- **Regular Backups:** Because SMRS operates locally in your web browser, always export regular JSON backups of your curriculum repositories.
