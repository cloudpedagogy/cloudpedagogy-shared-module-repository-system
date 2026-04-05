# SMRS User Instructions

This document provides a detailed guide on how to use the **Shared Module Repository System (SMRS)** to manage and inspect reusable curriculum assets.

## Core Navigation

The application is divided into two primary views:
1.  **Module Registry**: The central library of all versioned modules.
2.  **Programme Composition**: A view of how modules are sequenced and reused across different academic programmes.

---

## 1. Module Registry

The Registry allows you to browse the entire curriculum portfolio.

### **Filtering & Search**
-   **Search Bar**: Search for modules by name, code (e.g., `PH101`), or description keywords.
-   **Level Filter**: Narrow down modules by academic level (Level 1–4).
-   **Reset Filters**: Quickly clear all active filters to see the full registry.

### **Module Cards**
Each card provides a high-level summary:
-   **Badge: Level**: Indicates the academic level.
-   **Badge: Independent/Shared**: Shows if the module has dependencies or is reused across programmes.
-   **Badge: Versions**: Shows the number of historical releases available.

---

## 2. Module Inspector (Side Drawer)

Clicking any module card opens the **Module Inspector**, which provides a holistic view of the curriculum asset.

### **Overview Tab**
-   **Metadata**: Credits, level, and code.
-   **Learning Outcomes**: A list of what students will achieve.
-   **Assessment Structure**: Weighting and types of assessments (e.g., 60% Exam, 40% Coursework).

### **Version History & Comparison**
-   **Select Version**: Use the dropdown to view metadata for historical releases.
-   **Comparison Mode**: Toggle "Compare" to perform a structural diff between any two versions. This highlights **Added**, **Removed**, or **Changed** outcomes and assessments.

### **Dependency Tracking**
-   **Used by Programmes**: Lists every programme currently referencing this module, including whether they are on the **Current Version** or an **Older Version**.
-   **Depends on Modules**: Lists prerequisite or corequisite modules required by this asset.

---

## 3. Programme Composition

Switch to the **Programme Composition** view to see how modules are assembled into full degrees or pathways.

-   **Programme List**: Select a programme (e.g., *BSc Public Health*) from the sidebar.
-   **Module Sequence**: See the ordered list of modules.
-   **Reuse Signals**: Modules marked as **Shared Asset** are used in multiple programmes across the repository.
-   **Version Lag**: If a programme uses an older version of a module, an **"Update Available"** badge will appear.

---

## 4. Repository Integrity (Principles & Integrity)

The **Principles & Integrity** drawer (top right) provides architectural documentation and structural safeguards.

### **Methodology & Scope**
-   Explains the **"Module as Atom"** architecture.
-   Reinforces the tool's role as a **Repository Layer** (Registry) rather than an analysis or simulation engine.

### **Integrity Signals**
The system performs a real-time audit for:
-   **Duplicate IDs**: Overlapping module or programme codes.
-   **Invalid Version Links**: References to module releases that do not exist in the registry.
-   **Missing References**: References to modules that have been archived or removed.

---

## 5. Data Management

-   **Export JSON**: Download the entire repository state for backup or external review.
-   **Reset Data**: Restore the repository to the original Healthcare/Public Health demo dataset.
