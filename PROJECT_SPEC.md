# PROJECT_SPEC: cloudpedagogy-shared-module-repository-system

## 1. Repo Name
`cloudpedagogy-shared-module-repository-system`

## 2. One-Sentence Purpose
A module-level repository system with robust version control for sharing validated curriculum units across multiple institutional programmes.

## 3. Problem the App Solves
"Duplication of Effort" in curriculum design; provides a way for institutions to manage a central library of "Published" modules that can be reused reliably while maintaining version integrity.

## 4. Primary User / Audience
Resource managers, curriculum designers, and programme leads.

## 5. Core Role in the CloudPedagogy Ecosystem
The "Library Layer"; provides the reliable, versioned building blocks that tools like the `personalisation-engine` and `mapping-engine` use to assemble complex curricula.

## 6. Main Entities / Data Structures
- **Module**: The base entity representing a persistent educational unit.
- **ModuleVersion**: A specific snapshot of a module containing version-status (Draft/Published), content, outcomes, and assessments.
- **Dependency**: Explicit links between module versions (Prerequisite, Corequisite).
- **Programme**: A collection of specific module-version snapshots defining an award-level award.

## 7. Main User Workflows
1. **Module Creation**: Initialize a new shared module in the registry.
2. **Versioning**: Author and iterate on module content, outcomes, and dependencies within a version snapshot.
3. **Publishing**: Promote a version from "Draft" to "Published" for ecosystem use.
4. **Programme Assembly**: Map specific module-version pins to a programme structure.

## 8. Current Features
- Robust version control at the module level.
- Multi-status lifecycle (Draft, Published, Deprecated, Archived).
- Explicit version-aware module dependencies.
- Programme-level version pinning.

## 9. Stubbed / Partial / Incomplete Features
- "Learning Units" content is listed as a structured JSON placeholder in the current model.

## 10. Import / Export and Storage Model
- **Storage**: Browser `localStorage` (`smrs_repository_data`).
- **Import/Export**: Full JSON `RepositoryDataset` export/import supported.

## 11. Relationship to Other CloudPedagogy Apps
The source of stable module data for the ecosystem; provides the foundational entities that the `programme-governance-dashboard` aggregates.

## 12. Potential Overlap or Duplication Risks
Functionally overlaps with mapping engines; distinguished by its focus on *Lifecycle Management* and *Versioning* rather than just *Alignment Mapping*.

## 13. Distinctive Value of This App
The only tool in the ecosystem with a first-class "Version Control" system for curriculum units.

## 14. Recommended Future Enhancements
(Inferred) Conflict detection for disparate module versions within a single programme; "Impact Analysis" reporting when a foundational module is deprecated.

## 15. Anything Unclear or Inferred from Repo Contents
"ReleaseDate" and "Status" transitions are inferred to be the triggers for system-wide availability and retirement notifications.
