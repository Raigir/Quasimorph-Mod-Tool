# Mod Workflow Tool — Roadmap

## 1. Firemode Implementation
Full editor for firemode assets. Create, select, edit, and delete firemodes from the Firemodes mode tab. Sidebar list already renders — needs record template, editor form, validation, and save/delete lifecycle.

## 2. Ammo Implementation
Full editor for ammo assets. Create, select, edit, and delete ammo from the Ammo mode tab. Sidebar list already renders — needs record template, editor form, validation, and save/delete lifecycle.

## 3. Project Import
Receive a top-level named folder to import as a new project. The import process will read all files within and update them where necessary to match the app's expected structure and standards. Includes error checking that may block the import until problems are resolved (missing required fields, malformed JSON, naming mismatches, etc.).

## 4. Dirty State Tracking (Ammo / Firemodes)
Implemented for weapons — warns before navigating away from unsaved changes when switching weapons, modes, or projects. Ensure the same dirty state tracking works correctly for ammo and firemode editors once those are built.

## 5. Project Export
Export a project to a selectable location with possible zip support. Will generate the game's `modmanifest.json` file structure, potentially configurable through a dedicated area in project settings.

## 6. Backup Save
Automatic fallback for failed saves or I/O errors. Before writing, preserve prior file state so the tool can roll back if the current form produces an unsavable result. Primarily a safety net — not a full version history.

## 7. Asset Duplication (Ammo / Firemodes)
Weapon copying is implemented — duplicates the weapon and all linked files (localization, descriptor, recipe) with a new `{sourceId}_copy{n}` ID, and mirrors datadisk/faction reward assignments. Ammo and firemode copying needs to follow the same pattern once those editors are built.

## 8. Firemode / Ammo Stat Previews
When selecting a firemode or ammo in the weapon editor dropdowns, show a preview of the selected item's key statistics nearby. Saves alt-tabbing to reference data — especially useful for override ammo and firemode pairing decisions. Should pull from both base ref data and any project-local custom firemodes/ammo once those editors are implemented.
