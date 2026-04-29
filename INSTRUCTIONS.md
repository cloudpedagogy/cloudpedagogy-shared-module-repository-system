# Shared Module Repository System — User Instructions

---
### 2. What This Tool Does
This system acts as a central, structured registry for reusable curriculum assets. It allows module leaders to publish well-defined, governance-compliant modules that can be discovered and adopted by other programmes across the institution.

---
### 3. Role in the Ecosystem
- **Phase:** Phase 4 — Curriculum Extensions
- **Role:** A structural registry for reusable curriculum assets.
- **Reference:** [../SYSTEM_OVERVIEW.md](../SYSTEM_OVERVIEW.md)

---
### 4. When to Use This Tool
- To browse and adopt existing modules into a new academic programme instead of designing from scratch.
- To publish a high-quality "anchor module" (e.g., an introductory AI literacy module) for institutional adoption.
- To ensure cross-departmental alignment of standard learning outcomes.

---
### 5. Inputs
- Structured JSON module definitions, usually exported after validation in the **Curriculum Alignment Mapping Engine**.

---
### 6. How to Use (Step-by-Step)
1. Use the search interface to find modules by professional capability, theme, or department.
2. Select a module to view its structural map (Outcomes, Assessments, Skills).
3. If suitable for your programme, export the module structure as a JSON snippet.
4. If you are a module owner, you can register a new module by uploading a compliant JSON schema.
5. Review the version history to ensure you are adopting the most current iterative update of a module.

---
### 7. Key Outputs
- Searchable directory of reusable, validated curriculum components.
- Portable JSON snippets ready for import into downsteam curriculum builders.

---
### 8. How It Connects to Other Tools
- **Upstream:** Modules are first designed and verified in the **Mapping Engine**.
- **Downstream:** The resulting JSON can be injected into a new structure in the **Mapping Engine** or optimized in the **Refactoring Tool**.

---
### 9. Limitations
- Does not store pedagogical content (like lecture slides or videos); it only stores structural metadata and alignment.
- Relies on institutional consensus to define standard naming conventions.

---
### 10. Tips
- When adopting a shared module, you shouldn't alter its core outcomes, or it ceases to be "shared" and becomes a distinct fork.

---
### 11. Capability and Governance
- **Capability:** The tool supports development of practical AI capability through structured interaction and workflow use.
- **Governance:** The tool includes lightweight, optional fields that make assumptions, risks, and decisions visible and reviewable.
- **Optional Fields:** You can use the optional 'Capability & Governance Notes' section at the bottom of the interface to document AI use rationale, risks, and assumptions without interrupting your main workflow.
