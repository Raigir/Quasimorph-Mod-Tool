# Mod Workflow Tool — User Guide

## Navigation

The header contains three mode buttons: **Weapons**, **Ammo**, and **Firemodes**. The active mode determines which assets are shown in the sidebar list and what editor is available. Ammo and Firemodes are currently stubs — they list and create assets but do not yet have full editors.

---

## Projects

### Creating a Project
Click **+ New** in the Projects sidebar. Type a name and press Enter. This creates a project folder with all asset category subfolders pre-built.

### Project Settings
Click the **✎** pencil icon on any project card to open Project Settings:

- **Project Name** — rename the project (renames the folder on disk). Cannot be empty. Cannot duplicate an existing project name (case-insensitive). Invalid names highlight red with a tooltip.
- **Bundle Path** — the default asset bundle path used when creating new weapon descriptors (e.g., `Bundles/efa_assets`). Defaults to `Bundles/`. Changing this does **not** update existing descriptors — only new weapons pick up the value.
- **Image Folders** — manage subfolders under `Images/` for organizing sprites by faction or category (e.g., `chu`, `cor`, `civ`). Folders with images inside cannot be removed. Duplicate folder names are highlighted red with a tooltip and block saving.

The **Save** button is disabled whenever the project name or folder names have validation errors.

### Deleting a Project
Click the **🗑** trash icon. A confirmation dialog warns that all assets within will be deleted.

---

## Weapons

### Creating a Weapon
Select a project, then click **+ New** in the asset list sidebar. A weapon is created with the ID `tempId1` (auto-increments if taken). This also creates blank localization, descriptor, and crafting recipe files. Rapid clicks are blocked — only one creation runs at a time.

### Weapon ID
The **Id** field in the editor is the weapon's filename and the key used across all linked files. IDs must contain only letters, numbers, underscores, and hyphens. Empty IDs and duplicate IDs are blocked on save with specific error messages.

Changing the ID and saving will:
- Rename the weapon JSON file
- Rename all linked files (localization, descriptor, recipe)
- Rename sprite images in the current folder
- Update the ID in any datadisk and faction reward files that reference it
- Update descriptor image paths, texture ID, and prefab ID

### Deleting a Weapon
Click the **🗑** trash icon on the weapon card. Deletes the weapon and **all** linked files (localization, descriptor, recipe, sprites). Also removes the weapon from any datadisk and faction reward files — cleaning up empty shared files automatically.

---

## Editor Tabs

The **Save** button appears on every tab but always saves all tabs at once. Concurrent saves are blocked — the button is disabled while a save is in progress.

### Weapon Config

The main weapon editor with these sections:

**Sprite** — Upload inventory icon (50×50 or 100×50 PNG), floor sprite (max 30×30), and shadow sprite (max 30×30). All displayed at 2× scale. A folder dropdown lets you choose which `Images/` subfolder to store sprites in — changing this moves existing sprites automatically. Descriptor image paths update to match.

**Identity** — Id, IsImplicit toggle, TechLevel (1–10), Price, Weight, inventory sort/width.

**Classification** — WeaponClass and WeaponSubClass (dropdowns from enums), Categories (searchable multi-select checkbox dropdown from enums), IsMelee toggle.

**Damage** — Min/Max damage (integer, non-negative, max ≥ min cross-validated), CritDmg.

**Range & Accuracy** — Range, Falloff, BonusAccuracy, BonusScatterAngle.

**Magazine & Reload** — ReloadDuration, MagazineCapacity, MinRandomAmmoCount.

**Durability** — MaxDurability, MinDurabilityAfterRepair (not cross-validated against each other), Unbreakable toggle, RepairItemIds (multi-select, max 3, filtered to Parts only from repairs TSV).

**Firemodes & Ammo** — Two paired rows:
- Firemode 1 → Override Ammo 1
- Firemode 2 → Override Ammo 2

Firemode 2 is **disabled until Firemode 1 is set**. Clearing Firemode 1 cascades: clears and disables Firemode 2, Override Ammo 1, and Override Ammo 2. Override ammo fields are disabled until their paired firemode is selected. Override ammo shows only `implicted_*` entries from the ammo TSV.

Also: RequiredAmmo (enum dropdown), DefaultAmmoId (from base ammo), OverrideProjectileId (from projectileIds enum).

**Traits** — Multi-select dropdown, filtered to WeaponTrait entries from itemTraits TSV.

**Grenades** — DefaultGrenadeId (dropdown from base grenades, empty = `""`), AllowedGrenadeIds (multi-select from base grenades).

**Disassembly** — CanDisassembly toggle, dynamic entry list. Each entry has an Item Id (combo box with suggestions from repairs + trash TSVs, `quest_` items filtered out, allows free text) and a Count (integer > 0). Click **+ Add Entry** to add rows, **×** to remove.

**Throwing & Melee** — ThrowRange, DurabilityLossOnThrow, MeleeCanAmputate, GetMeleeDamageFromCreature toggles.

**Wound Bonuses & Misc** — DotWoundsDmgBonus, FractureWoundDmgBonus, CanPutInVest toggle.

### Localization

Editable form for all 11 supported languages. Each row shows the language name, a **Name** field (30% width), and a **Short Desc** field (70% width). All three key blocks (name, desc, shortdesc) are initialized as empty strings on creation. The `desc` block (full description) is always saved as empty strings.

When the English name is filled in, it appears under the weapon ID in the sidebar.

### Descriptor

**Grip & HFG** — Grip (dropdown from handGrips enum), HasHFGOverlay toggle.

**Image Properties** — Auto-filled paths in the format `Images/{folder}/{id}_sprite_icon.png` (and floor/shadow). Updated automatically on sprite upload, folder change, or ID rename. Cleared if the weapon is deleted.

**Audio Properties** — ShootSound, ReloadSound, DryShotSound, FailedAttackSound (free text fields).

**Model Properties** — AssetBundlePath (initialized from project settings bundle path on creation only — never auto-updated after), TextureIdOrPath (initialized as `{id}_texture`, updates on ID rename), MuzzleId, PrefabId (initialized as `{id}_prefab`, updates on ID rename), PrefabScale (default 0.05, must be positive, info icon tooltip: "Suggested values between 0.04 and 0.065").

### Crafting Recipe

**Production Settings** — ProduceTimeInHours (integer > 0), plus a Required Items entry list (max 5). Each entry has an Item Id combo box (repairs + trash + pactcomponents TSVs, `quest_` items filtered out, free text allowed) and Count (integer > 0).

**Workshop Settings** — ModifyStartCost (integer > 0, info icon: "Starts cost formula as though at a later step when not 1."), ModifyStep (positive number, info icon: "Scales cost per step."), ModifyLevelLimit (integer > 0, info icon: "Max upgradable level in workshop (before magnum upgrade)."). Plus a Modify Items entry list (max 4) with Item Id combo box (repairs + trash + pactcomponents + datadisks TSVs, `quest_` items filtered out) and Value (integer > 0).

### Datadisk Assignment

Multi-select dropdown of all datadisk IDs from the reference TSV. Check which datadisks should include this weapon.

Datadisk files (`{diskId}_diskData.json`) are **shared across all weapons** — checking a disk adds this weapon's ID to the disk's UnlockIds array without affecting other weapons. Unchecking removes only this weapon. If a disk file would end up with an empty UnlockIds, it's deleted automatically.

Datadisk JSON fields are always saved in a fixed canonical order: Id, ItemClass, UnlockType, TechLevel, Price, Weight, InventorySortOrder, InventoryWidthSize, Categories, UnlockIds.

### Faction Rewards

Entry list for assigning the weapon to faction reward pools. Each entry has:
- **Faction** — dropdown from factions TSV. Factions already selected in other entries are dynamically filtered out to prevent duplicates.
- **Tech Level** — integer 1–10 (default 1)
- **Weight** — positive number (default 15)
- **Points** — positive integer (default 150)

Like datadisks, faction reward files (`{factionId}_factionData.json`) are **shared**. Each weapon's entries are added/removed independently. Empty files are cleaned up.

---

## Validation

All validated fields show a **red border** when invalid and are checked live on input.

When saving, if any fields are invalid, a **validation error popup** appears listing every issue grouped by tab and section — making it easy to find and fix problems across tabs. The popup replaces the generic error toast with specific, actionable messages.

### Weapon ID Validation
- Cannot be empty
- Must match `[a-zA-Z0-9_-]+` (letters, numbers, underscores, hyphens only)
- Cannot duplicate an existing weapon ID (checked on save when the ID has changed)

### Field Rules

| Field | Rule |
|-------|------|
| TechLevel | Integer, 1–10 |
| Price | Integer, ≥ 0 |
| Min/Max Damage | Integer, ≥ 0, max ≥ min |
| Range, Reload, MagazineCap, MinRandAmmo | Integer, ≥ 0 |
| ThrowRange, DurabilityLossOnThrow | Integer, ≥ 0 |
| Wound bonuses | Integer, ≥ 0 |
| MaxDurability, MinDurabilityAfterRepair | Integer, ≥ 0 |
| Disassembly Count | Integer, > 0 |
| Recipe Required Item Count | Integer, > 0 |
| Grade Value | Integer, > 0 |
| PrefabScale | Positive number |
| ProduceTimeInHours, ModifyStartCost, ModifyLevelLimit | Integer, > 0 |
| ModifyStep | Positive number |
| Faction Tech Level | Integer, 1–10 |
| Faction Weight | Positive number |
| Faction Points | Positive integer |

### Entry List Limits
- Required Items: max 5
- Modify Items: max 4

---

## Multi-Select Dropdowns

Used for Categories, Traits, RepairItemIds, AllowedGrenadeIds, Datadisks. Features:
- Click to open, click outside to close
- **Search bar** at top — filters the list as you type
- **Clear button** — unchecks all selections
- Outlined checkbox style with gold checkmark
- Some have max selection limits (shown in the label)

---

## Combo Boxes

Used for Disassembly ItemId, Recipe Required Items, and Modify Items. Features:
- Dropdown with suggestions from reference data
- Type to filter, click to pick
- **Allows free text** — you can type any value even if it's not in the list
- Closes on outside click
- Items containing `quest_` are filtered out of all combo box lists

---

## Info Icons

Some fields have a **?** icon to the right of the input. Hover over it to see a tooltip with guidance on suggested or expected values. Currently used on:
- Prefab Scale — "Suggested values between 0.04 and 0.065"
- Modify Start Cost — "Starts cost formula as though at a later step when not 1."
- Modify Step — "Scales cost per step."
- Modify Level Limit — "Max upgradable level in workshop (before magnum upgrade)."

---

## Tips

- **Double-click** any text or number field to select all contents for quick editing.
- **Sidebar thumbnails** show the weapon's inventory sprite and update on upload.
- **English name** from localization appears under the weapon ID in the sidebar once filled in.
- **The Save button** on any tab saves everything across all tabs at once. Concurrent saves are prevented.
- **Price, Weight, and Points** fields are always saved with a `.0` decimal suffix in JSON (e.g., `150.0`) for game parser compatibility.
- Sprite images auto-detect their folder on weapon load — you can move files manually and the tool picks them up.
- The startup screen appears if you open `index.html` directly — use the Node.js server instead.
