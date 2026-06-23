# Mod Workflow Tool — User Guide

## Navigation

The header contains three mode tabs: **Weapons**, **Ammo**, and **Firemodes** (pill-style tab switcher). The active mode determines which assets are shown in the sidebar list and what editor is available. A search filter above the asset list lets you filter by ID or English name. An **Options** button in the top-right opens a sliding panel for tool configuration.

---

## Projects

### Creating a Project
Click **+ New** in the Projects sidebar. Type a name and press Enter. This creates a project folder with all asset category subfolders pre-built, including `Images/Weapons/`, `Images/Firemodes/`, and `Images/Ammo/`.

### Project Settings
Click the **✎** pencil icon on any project card to open Project Settings:

- **Project Name** — rename the project (renames the folder on disk). Cannot be empty. Cannot duplicate an existing project name (case-insensitive). Invalid names highlight red with a tooltip.
- **Bundle Path** — the default asset bundle path used when creating new weapon descriptors (e.g., `Bundles/efa_assets`). Defaults to `Bundles/`. Changing this does **not** update existing descriptors — only new weapons pick up the value.
- **Skip Manifest on Export** — toggle. When enabled, the export ZIP will not include a `modmanifest.json` and only contains the Assets folder.
- **Assemblies** — dynamic entry list. Each entry is a DLL filename (e.g., `QM_ImporterAPI.dll`). Used when generating `modmanifest.json` during export.
- **Steam Tags** — dynamic entry list. Each entry is a tag string (e.g., `0.9.9`, `New Content`). Used when generating `modmanifest.json` during export.
- **Weapon Image Folders** — manage subfolders under `Images/Weapons/` for organizing weapon sprites by faction or category (e.g., `chu`, `cor`, `civ`). Folders with images inside cannot be removed. Duplicate folder names are highlighted red with a tooltip and block saving.

The **Save** button is disabled whenever the project name or folder names have validation errors.

### Exporting a Project
Click the **folder-arrow** icon on a project card. A confirmation dialog appears. The export generates a downloadable ZIP named after the project, containing:

- **Assets/** — the complete folder structure with all asset files
- **modmanifest.json** — generated from project settings:
  - `UniqueModName` — the project name
  - `Assemblies` — from the assemblies entry list
  - `Dependencies` — always an empty array
  - `SteamTags` — from the steam tags entry list

If **Skip Manifest on Export** is enabled in project settings, the `modmanifest.json` is omitted and only the Assets folder is included. The `settings.json` file is never included in exports.

### Deleting a Project
Click the **🗑** trash icon. A confirmation dialog warns that all assets within will be deleted.

---

## Weapons

### Creating a Weapon
Select a project, then click **+ New** in the asset list sidebar. A weapon is created with the ID `weapon_tempid_1` (auto-increments if taken). This also creates blank localization (in `Localization/Weapons/`), descriptor (in `Descriptors/Weapons/`), and crafting recipe files. Rapid clicks are blocked — only one creation runs at a time.

### Weapon ID
The **Id** field in the editor is the weapon's filename and the key used across all linked files. IDs must contain only letters, numbers, underscores, and hyphens. Empty IDs and duplicate IDs are blocked on save with specific error messages.

Changing the ID and saving will:
- Rename the weapon JSON file
- Rename all linked files (localization in `Localization/Weapons/`, descriptor in `Descriptors/Weapons/`, recipe)
- Rename sprite images in the current `Images/Weapons/` subfolder
- Update the ID in any datadisk and faction reward files that reference it
- Update descriptor image paths, texture ID, and prefab ID

### Deleting a Weapon
Click the **🗑** trash icon on the weapon card. Deletes the weapon and **all** linked files (localization, descriptor, recipe, sprites). Also removes the weapon from any datadisk and faction reward files — cleaning up empty shared files automatically.

---

## Editor Tabs

The **Save** button appears on every tab but always saves all tabs at once. Concurrent saves are blocked — the button is disabled while a save is in progress.

### Weapon Config

The main weapon editor with these sections:

**Sprite** — Upload inventory icon (50×50 or 100×50 PNG), floor sprite (max 30×30), and shadow sprite (max 30×30). All displayed at 2× scale. A folder dropdown lets you choose which `Images/Weapons/` subfolder to store sprites in — changing this moves existing sprites automatically. Descriptor image paths update to match.

**Identity** — Id, IsImplicit toggle, TechLevel (1–10), Price, Weight, inventory sort/width.

**Classification** — WeaponClass and WeaponSubClass (dropdowns from enums), Categories (searchable multi-select checkbox dropdown from enums), IsMelee toggle.

**Damage** — Min/Max damage (integer, non-negative, max ≥ min cross-validated), CritDmg.

**Range & Accuracy** — Range, Falloff, BonusAccuracy, BonusScatterAngle.

**Magazine & Reload** — ReloadDuration, MagazineCapacity, MinRandomAmmoCount.

**Durability** — MaxDurability, MinDurabilityAfterRepair (not cross-validated against each other), Unbreakable toggle, RepairItemIds (multi-select, max 3, filtered to Parts only from repairs TSV).

**Firemodes & Ammo** — Two paired rows:
- Firemode 1 → Override Ammo 1
- Firemode 2 → Override Ammo 2

Firemode 2 is **disabled until Firemode 1 is set**. Clearing Firemode 1 cascades: clears and disables Firemode 2, Override Ammo 1, and Override Ammo 2. Override ammo fields are disabled until their paired firemode is selected. Override ammo shows `implicted_*` entries from the base ammo TSV plus any project-created ammo.

Project-created firemodes and ammo appear in their respective dropdowns with a " - *Custom*" label (display only — the saved value is the plain ID). If a referenced firemode or ammo no longer exists, it shows as "(missing)" with a red border and blocks saving.

Also: RequiredAmmo (dropdown from base ammo types + any custom ammo types discovered in project ammo records — custom entries show " - *Custom*"), DefaultAmmoId (base + project ammo), OverrideProjectileId (from projectiles enum).

**RequiredAmmo and custom ammo types** — When you create an ammo record with a free-typed AmmoType that doesn't exist in the base game's ammo types enum, that type automatically appears as an option in the weapon editor's RequiredAmmo dropdown. This lets you define new ammo categories through your ammo records and immediately reference them from weapons. If all ammo records using a custom type are later deleted, any weapons still referencing that type will show it as "(missing)" with a red border and block saving until resolved.

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

**Image Properties** — Auto-filled paths in the format `Images/Weapons/{folder}/{id}_sprite_icon.png` (and floor/shadow). Updated automatically on sprite upload, folder change, or ID rename.

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

Like datadisks, faction reward files (`{factionId}_factionData.json`) are **shared**. Each faction has a single entry in `FactionRewardList` with multiple `contentRecords` — one per weapon. Entries are added/removed independently. Empty files are cleaned up.

---

## Firemodes

### Creating a Firemode
Switch to **Firemodes** mode and click **+ New**. A firemode is created with ID `firemode_tempid_1` (auto-increments). This also creates a blank descriptor file.

### Firemode ID
IDs must be unique across both the project and the base game firemodes (`ref/base/firemodes.txt`). Same character rules as weapons.

Changing the ID and saving will rename the firemode JSON, descriptor file, and sprite image. The descriptor's `ItemId` and `SpriteIdOrPath` update automatically.

### Firemode Editor
Single-panel layout with two sections:

**Firemode Config** — Id, Require All Ammo To Shoot (toggle), AmmoPerShot (integer ≥ 0), WeaponCastsCount (integer > 0), Accuracy, ScatterAngle, DamageMult (positive), DelayBetweenShots (≥ 0).

**Descriptor** — PNG sprite upload (36×26 only) stored in `Images/Firemodes/`, displayed at 2× in a 72×52 preview. Sprite Path/ID text field auto-fills on upload as `Images/Firemodes/{id}_sprite.png`.

### Copying a Firemode
Click the copy icon on a firemode card. Creates `{sourceId}_copy{n}` with all config values. Descriptor is copied with sprite path cleared.

---

## Ammo

### Creating an Ammo Record
Switch to **Ammo** mode and click **+ New**. An ammo record is created with ID `ammo_tempid_1` (auto-increments). This also creates blank descriptor and localization files.

### Ammo ID
IDs must be unique across both the project and the base game ammo (`ref/base/ammo.txt`). Same character rules as weapons.

Changing the ID and saving will rename the ammo JSON, descriptor, localization, and sprite images. Internal references (descriptor `ItemId`, localization keys, datadisk UnlockIds, faction reward ContentIds) update automatically.

### Ammo Editor Tabs

#### Ammo Config

**Sprite** — Upload inventory icon (50×50 or 100×50 PNG), floor sprite (max 30×30), and shadow sprite (max 30×30). Stored in `Images/Ammo/`. Uploading auto-fills the corresponding descriptor image path. Sidebar thumbnails show the inventory icon.

**Identity** — Id (info icon: "Add implicted_ to the front of this id to make this ammo an implicit ammo"), TechLevel (1–10), Price (integer ≥ 0), Weight (≥ 0), Inv Sort Order (integer ≥ 0, default 8), Inv Width (integer ≥ 0, default 1), Can Put In Vest (toggle, default true).

**Ammo Properties** — AmmoType (combobox from ammoTypes enum, allows free text — custom types automatically appear in weapon editor's RequiredAmmo dropdown), Damage Type (dropdown from damageTypes reference), Projectile Id (dropdown from projectiles reference), Ballistic Type (dropdown from ballisticTypes enum, default Ballistic). Max Stack (integer > 0), Min Ammo Amount (integer ≥ 0), Max Ammo Amount (integer ≥ 0, must be ≥ min).

**Categories** — Searchable multi-select checkbox dropdown from categories enum.

**Statistics** — DamageMult (no validation), CritChance (≥ 0), RangeBonus (integer, negatives allowed), AccuracyMult (≥ 0), ScatterMult (≥ 0), BulletCastsPerShot (integer > 0).

**Status Effects** — StatusEffectId (dropdown from base game status effects, filtered to Damage renewal types), ChanceToApply (≥ 0), StatusDamageModifier (negatives allowed), StatusResistModifier (negatives allowed).

**Traits** — Multi-select dropdown, filtered to AmmoTrait entries from itemTraits TSV.

**Hidden defaults** — ItemClass ("Ammo"), IsImplictedAmmo (false), IsChargeOnly (false). Always saved but not editable.

#### Descriptor

**Image Properties** — Icon Sprite Path/ID, Small Icon Sprite Path/ID, Shadow Sprite Path/ID. Auto-filled on sprite upload with paths like `Images/Ammo/{id}_sprite_icon.png`. Updated on ID rename.

**Gibs** — Bullet Sprites ID (dropdown from projectiles reference, default "pistol" — also sets BulletShadowsId to the same value in JSON). Hidden defaults: FlightDurationMsMin (0.25), FlightDurationMsMax (0.35), AnimationFramerate (10), MeleeMakeBlood (false).

#### Localization

Identical to weapon localization — 11 languages, Name + Short Desc per row. English name appears on ammo sidebar cards.

#### Datadisk Assignment

Identical to weapon datadisk assignment. Multi-select dropdown of all datadisk IDs from the reference TSV. Ammo and weapons share the same datadisk files — checking a disk adds this ammo's ID to the disk's UnlockIds array. Empty datadisk files are cleaned up automatically.

#### Faction Rewards

Identical to weapon faction rewards. Entry list with Faction, Tech Level (1–10), Weight (positive), Points (positive integer). Ammo and weapons share the same faction reward files. Validated on save with error modal.

### Copying an Ammo Record
Click the copy icon on an ammo card. Creates `{sourceId}_copy{n}` with all config values. Descriptor copied with image paths cleared. Localization copied with keys remapped to new ID. Datadisk and faction reward assignments copied.

---

## Validation

All validated fields show a **red border** when invalid and are checked live on input.

When saving, if any fields are invalid, a **validation error popup** appears listing every issue grouped by tab and section — making it easy to find and fix problems across tabs. The popup replaces the generic error toast with specific, actionable messages.

### ID Validation (All Asset Types)
- Cannot be empty
- Must match `[a-zA-Z0-9_-]+` (letters, numbers, underscores, hyphens only)
- Cannot duplicate an existing project ID of the same type
- Firemode IDs also checked against base game firemodes
- Ammo IDs also checked against base game ammo

### Weapon Field Rules

| Field | Rule |
|-------|------|
| TechLevel | Integer, 1–10 |
| Price | Integer, ≥ 0 |
| InventorySortOrder, InventoryWidthSize | Integer, ≥ 0 |
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
| Firemodes 1/2 | Orphan check — must exist in base or project |
| DefaultAmmoId, OverrideAmmo 1/2 | Orphan check — must exist in base or project |
| RequiredAmmo | Orphan check — must exist in base ammo types or project ammo records |

### Firemode Field Rules

| Field | Rule |
|-------|------|
| AmmoPerShot | Integer, ≥ 0 |
| WeaponCastsCount | Integer, > 0 |
| DamageMult | Positive number |
| DelayBetweenShots | ≥ 0 |

### Ammo Field Rules

| Field | Rule |
|-------|------|
| TechLevel | Integer, 1–10 |
| Price | Integer, ≥ 0 |
| Weight | ≥ 0 |
| InventorySortOrder, InventoryWidthSize | Integer, ≥ 0 |
| MaxStack | Integer, > 0 |
| MinAmmoAmount, MaxAmmoAmount | Integer, ≥ 0, max ≥ min |
| CritChance | ≥ 0 |
| RangeBonus | Integer (negatives allowed) |
| AccuracyMult, ScatterMult | ≥ 0 |
| BulletCastsPerShot | Integer, > 0 |
| ChanceToApply | ≥ 0 |
| Faction Tech Level | Integer, 1–10 |
| Faction Weight | Positive number |
| Faction Points | Positive integer |

### Entry List Limits
- Required Items: max 5
- Modify Items: max 4

---

## Multi-Select Dropdowns

Used for Categories, Traits, RepairItemIds, AllowedGrenadeIds, Datadisks (weapons), and Traits/Categories (ammo). Features:
- Click to open, click outside to close
- **Search bar** at top — filters the list as you type
- **Clear button** — unchecks all selections
- Outlined checkbox style with gold checkmark
- Some have max selection limits (shown in the label)

---

## Combo Boxes

Used for Disassembly ItemId, Recipe Required Items, Modify Items, and Ammo Type (ammo editor). Features:
- Dropdown with suggestions from reference data
- Type to filter, click to pick
- **Allows free text** — you can type any value even if it's not in the list
- Closes on outside click
- Items containing `quest_` are filtered out of all combo box lists

---

## Info Icons

Some fields have a **?** icon to the right of the input. Hover over it to see a tooltip with guidance on suggested or expected values. Currently used on:
- Ammo Id — "Add implicted_ to the front of this id to make this ammo an implicit ammo"
- Prefab Scale — "Suggested values between 0.04 and 0.065"
- Modify Start Cost — "Starts cost formula as though at a later step when not 1."
- Modify Step — "Scales cost per step."
- Modify Level Limit — "Max upgradable level in workshop (before magnum upgrade)."

---

## Options Panel

Click the **Options** button in the top-right corner of the header to open the options panel. It slides in from the right, sharing space with the main content area. Click Options again or the × button to close.

### Reference Data Update

Update the tool's reference data files from the game's config files. This rebuilds all `ref/base/` files and mutable `ref/enums/` files (ammoTypes, categories). Immutable enum files are not affected.

**Two workflows:**

- **Browse** — click Browse, select the folder containing the config files. The browser reads the files and sends them to the server.
- **Paste path** — type or paste the absolute folder path. The server reads the files directly from disk.

**Required files** (exact names, top-level only):
- `config_items.txt`
- `config_items_properties.txt`
- `config_spacesandbox.txt`
- `config_wounds.txt`

These must be extracted from the game's resources. If any are missing, an error modal lists the missing files and the update is aborted — no partial writes.

After a successful update, all reference data is reloaded and editor dropdowns repopulate automatically.

---

## Tips

- **Double-click** any text or number field to select all contents for quick editing.
- **Sidebar thumbnails** show the asset's inventory sprite (weapons and ammo) and update on upload.
- **English name** from localization appears under the asset ID in the sidebar once filled in (weapons and ammo).
- **Sidebar filter** searches by ID, English name, and record type.
- **The Save button** on any tab saves everything across all tabs at once. Concurrent saves are prevented.
- **Unsaved changes** — switching between assets, modes, or projects prompts a confirmation if you have unsaved edits.
- **Price, Weight, and Points** fields are always saved with a `.0` decimal suffix in JSON (e.g., `150.0`) for game parser compatibility.
- Weapon sprite images auto-detect their subfolder on load — you can move files manually and the tool picks them up.
- The startup screen appears if you open `index.html` directly — use the Node.js server instead.
