# Mod Workflow Tool — User Guide

## Navigation

The header contains five mode tabs: **Weapons**, **Ammo**, **Firemodes**, **Explosions**, and **Traits** (pill-style tab switcher). The active mode determines which assets are shown in the sidebar list and what editor is available. A search filter above the asset list lets you filter by ID or English name. An **Options** button in the top-right opens a sliding panel for tool configuration.

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

**Stats** — A live, read-only readout at the top of the tab showing the weapon's final computed stats: Damage (with damage type), Crit (chance / damage), Accuracy, Scatter, Range, Rate of fire, Reload, Magazine, Ammo (the resolved ammo ID), and Durability. Values recalculate as you edit any field on the tab.

- **Firemode switch** — when both firemodes are set, a switch next to the section title toggles which firemode's stats are shown (labeled with the firemode IDs).
- **Ammo resolution** — per firemode: that slot's override ammo if set, otherwise Default Ammo Id. The Ammo chip shows which one is in effect (hover reveals whether it's an override).
- **Calculations** — Damage: `base × (ammo DamageMult + firemode DamageMult − 1)`; if the ammo's BulletCastsPerShot > 1, damage is split per projectile (e.g. `5 × 2–4`). Accuracy: `(weapon BonusAccuracy + firemode Accuracy) × ammo AccuracyMult`, floored at 0%. Scatter: `(weapon BonusScatterAngle + firemode ScatterAngle) × ammo ScatterMult`. Range: weapon Range + ammo RangeBonus. Crit chance comes from the ammo, crit damage from the weapon. Rate of fire is the firemode's WeaponCastsCount. Values use game formatting (%, °) with standard .5-up rounding.
- **No-ammo weapons** — if there's no override and no default ammo, Reload, Magazine, Ammo, and crit chance show "–" (the game treats such weapons as never reloading or running out).
- Pulls from base reference data and project-created firemodes/ammo alike; project records take priority when IDs collide.

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

**Default Ammo filtering** — When RequiredAmmo holds a valid type, the DefaultAmmoId dropdown narrows to only ammo of that type (base + custom). With no required type set, the full ammo list is available — a default without a required type is legal. If a stored default no longer matches the selected required type, it stays visible flagged red as "(wrong type)" and blocks saving until resolved.

**RequiredAmmo and custom ammo types** — When you create an ammo record with a free-typed AmmoType that doesn't exist in the base game's ammo types enum, that type automatically appears as an option in the weapon editor's RequiredAmmo dropdown. This lets you define new ammo categories through your ammo records and immediately reference them from weapons. If all ammo records using a custom type are later deleted, any weapons still referencing that type will show it as "(missing)" with a red border and block saving until resolved.

**Traits** — Multi-select dropdown of WeaponTrait entries: base-game traits from the itemTraits TSV plus any project-local custom traits whose Item Trait Type is WeaponTrait (custom entries show a " - *Custom*" label; the saved value is the plain ID).

**Grenades** — DefaultGrenadeId (dropdown from base grenades, empty = `""`), AllowedGrenadeIds (multi-select from base grenades).

**Disassembly** — Dynamic entry list. (The former CanDisassembly toggle and JSON key are gone — the game derives it from whether the disassembly list has entries. Older weapon files carrying the key are cleaned automatically on their next save.) Each entry has an Item Id (combo box with suggestions from repairs + trash TSVs, `quest_` items filtered out, allows free text) and a Count (integer > 0). Click **+ Add Entry** to add rows, **×** to remove.

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

**Traits** — Multi-select dropdown of AmmoTrait entries: base-game traits plus project-local custom traits whose Item Trait Type is AmmoTrait (custom entries show a " - *Custom*" label; the saved value is the plain ID).

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

## Explosions

### Creating an Explosion
Switch to **Explosions** mode and click **+ New**. An explosion record is created with ID `explosion_tempid_1` (auto-increments), along with a blank descriptor. Explosions have no sprites, localization, datadisk, or faction-reward files — just the record at `Assets/Explosions/{id}.json` and its descriptor (see the Descriptor sub-tab section below).

### Explosion ID
IDs must be unique across both the project and the base game explosions (`ref/base/explosions.txt`). Same character rules as other assets (letters, numbers, underscores, hyphens). Changing the ID and saving renames the record file (new file written first, old deleted after) — there are no linked files to update.

### Explosion Editor
Single-panel layout. Fields are grouped into sections by what they relate to (the JSON is always written in the game's config column order regardless of on-screen grouping):

- **Identity** — Id.
- **Core Blast** — Visual Explosion (toggle), Radius, Damage, Damage Type (dropdown from base damageTypes), Distance Damage Falloff, Wound Chance.
- **Damage Targets** — Gain Dmg To Creature, Self Damaging, Gain Dmg To Location, Gain Dmg To Monolith, Disintegrate (toggles).
- **Throwback** — Throwback (toggle), Throwback Chance, Throwback Depend On Radius (toggle).
- **Stun** — Stun (toggle), Stun Chance, Stun Duration, Stun Depend On Radius (toggle).
- **Fire** — Propagate Fire (toggle), Propagate Fire Chance, Large Fire Chance, Fire Depend On Radius (toggle).
- **Liquid** — Propagate Liquid (toggle), Liquid Type (dropdown from liquidType enum).
- **Gas** — Propagate Gas (toggle), Gas Type (dropdown from gasType enum), Gas Strength (dropdown from gasStrength enum).
- **Misc** — Ignore Mines (toggle). Note: `IsPlayerFire` also exists in the record but has no UI — new explosions initialize it to `false`, and any value in an existing file is preserved through edits.

The four dropdowns (Damage Type, Liquid Type, Gas Type, Gas Strength) have no empty option — every explosion sets them concretely.

Sidebar cards show the explosion ID with a `{Damage} {DamageType}` subtitle (e.g. "100 explosion").

### Copying an Explosion
Click the copy icon on an explosion card. Creates `{sourceId}_copy{n}` — copies both the explosion record and its descriptor.

### Explosion Descriptor (sub-tab)
The explosion editor has two sub-tabs: **Explosion Config** and **Descriptor**. The descriptor holds the visual/sound presentation and is saved as a separate record at `Assets/Descriptors/Explosions/{id}_descriptor.json` (record type `CustomExplosionDescriptor`). It's created, renamed, copied, and deleted automatically alongside the explosion record.

Descriptor fields: Explosion Visual ID, Explosion Sound ID/Path (new records default to `Sounds/` as a starting path), Visual Explosion Delay (float ≥ 0), Visual Reach Cell Duration (float ≥ 0), Clear Gibs Radius in Pixels (int ≥ 0), Shake Camera On Explosion (toggle), and Visual Explosion Offset X/Y/Z (float, negatives allowed). Both sub-tabs share the Save button; saving validates and writes both records together. Projects also scaffold an `Assets/Sounds` folder for sound files the descriptor can reference.

## Traits

### Creating a Trait
Switch to **Traits** mode and click **+ New**. A trait record is created with ID `trait_tempid_1` (auto-increments) and one blank effect entry. Traits are saved as a single JSON at `Assets/Traits/{id}.json` (record type `MGSC.ItemTraitRecord`) — no linked files.

### Trait ID
IDs must be unique across both the project and the base game traits (`ref/base/itemTraits.txt`). Same character rules as other assets (letters, numbers, underscores, hyphens). Changing the ID and saving renames the record file (new written first, old deleted after).

### Trait Editor
Single-panel editor:

- **Identity** — Id.
- **Trait Config** — Item Trait Type (dropdown from the itemTraitTypes enum, defaults WeaponTrait) | Is Negative (toggle). Tooltip Icon Tag (dropdown from the tooltipIconTags enum, defaults empty). `TraitContext` is always written as `Passive` and has no field.
- **Effects** — a repeater of effect entries (see below).

### Effects
Each effect entry has three fields plus a remove (×) button:

- **Effect Name** — a combobox: type freely or pick from the traitEffects enum. The suggestion list is dependency-aware — the first entry only offers independent effects; later entries also offer dependent effects once their required primary is selected in another entry. An effect name already used in another entry is never offered again, and a duplicate name blocks saving.
- **Val Type** — Boolean, Int, Float, or String. When you pick an effect from the list, the type is set automatically from the effect's leading letter (B/F/I/S). Typing a name manually leaves the type for you to set.
- **Value** — the control matches the type: a false/true dropdown for Boolean, a whole-number input for Int, a decimal-number input for Float, and free text for String. Changing the Val Type clears the value and swaps the control. On save the value is written to the matching value field (blank numeric values save as 0; blank String saves as null). All four value fields are always written to the file; only the one matching the type carries your value.

When the first effect is picked from the list, if it maps to a tooltip icon (via the icon's associated effects) the Tooltip Icon Tag is set for you. Only the first entry's list-selection does this, and only that action — you can freely change the icon afterward.

Custom traits become selectable in the weapon or ammo editors (matched by Item Trait Type — WeaponTrait shows in weapons, AmmoTrait in ammo) with a " - *Custom*" label. Changing a custom trait's type moves which editor it appears in. If you delete a custom trait (or change its type) that a weapon or ammo record still references, the reference is not silently removed — on next open that record's Traits field is outlined red and the trait shows inside the dropdown as a red "(missing)" checkbox that stays checked and blocks saving until you uncheck it, so a dangling reference can't reach the exported mod unnoticed.

### Copying a Trait
Click the copy icon on a trait card. Creates `{sourceId}_copy{n}` — a straight record copy.

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
| DefaultAmmoId | Orphan check, plus type check — must match RequiredAmmo's type when one is set |
| OverrideAmmo 1/2 | Orphan check — must exist in base or project |
| RequiredAmmo | Orphan check — must exist in base ammo types or project ammo records |

### Firemode Field Rules

| Field | Rule |
|-------|------|
| AmmoPerShot | Integer, ≥ 0 |
| WeaponCastsCount | Integer, > 0 |
| DamageMult | Positive number |
| DelayBetweenShots | ≥ 0 |

### Explosion Field Rules

| Field | Rule |
|-------|------|
| Radius | Integer, ≥ 0 |
| Damage | Integer, ≥ 0 |
| StunDuration | Integer, ≥ 0 |
| DistanceDamageFalloff | Integer, ≥ 0 |
| WoundChance | Number, ≥ 0 (base data exceeds 1.0 — not clamped) |
| ThrowbackChance, StunChance, PropagateFireChance | Number, 0–1 |
| LargeFireChance | Integer, 0–100 (helper icon: "Uses values between 0-100") |
| DamageType, LiquidType, GasType, GasStrength | Dropdown, no empty → always valid |

### Trait Field Rules

| Field | Rule |
|-------|------|
| Id | Non-empty; letters, numbers, `_`, `-`; unique vs project + base game |
| Effects | At least one entry with a name required |
| Effect Name | No duplicates across entries |
| Float value | Must parse as a number (blank = 0) |
| Int value | Must parse as a whole number (blank = 0) |
| Boolean / String value | Always valid (dropdown / free text) |
| Item Trait Type | Dropdown, no empty → always valid |

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
- Ammo Per Shot (firemode) — "Amount of ammo consumed in 1 shot in a turn. Usually matched with weapon casts count."
- Weapon Casts Count (firemode) — "Determines number of times the weapon fires (rate of fire)"
- Large Fire Chance (explosion) — "Uses values between 0-100"

---

## Options Panel

Click the **Options** button in the top-right corner of the header to open the options panel. It slides in from the right, sharing space with the main content area. Click Options again or the × button to close.

### Reference Data Update

Update the tool's reference data files from the game's config files. This rebuilds all `ref/base/` files and mutable `ref/enums/` files (ammoTypes, categories, tooltipIconTags, traitEffects). Immutable enum files are not affected.

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

**Change summary** — A modal opens after every successful update showing exactly what changed, per file: entries added, entries removed, and modified entries with each changed field as `old → new`. Column additions/removals are called out separately. Files with no changes are omitted; if nothing changed at all, the modal says so. Panels are collapsible per file, and the full list is shown (scrollable — nothing is truncated). Note: the first-ever update reports every entry as "added" since it's establishing the baseline; subsequent updates show only real changes.

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
