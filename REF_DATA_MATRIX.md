# Reference Data — Source Relation Matrix

Documents where each `ref/base/` file sources its data from for the reference data update process.

## Update Policy

The origin config file is the **full source of truth**. When updating reference data:

1. **Full replacement** — the existing ref file is entirely replaced by the new extraction. No merging, no diffing, no preserving old values.
2. **New columns** from the source are automatically included.
3. **Removed columns** from the source are automatically dropped.
4. **New entries** are included.
5. **Modified entries** are overwritten with the new values.
6. **Removed entries** are dropped (they no longer exist in the source).

This is intentionally a destructive overwrite. The origin config file defines the schema and the data — the ref file is just a local cache of the relevant section.

## From `config_items.txt`

| Base Ref File | Section Header | Notes |
|---|---|---|
| ammo.txt | `#ammo` | Ammo records with stats, types, projectile IDs, status effects, traits |
| datadisks.txt | `#datadisks` | Blueprint unlock data with UnlockType and UnlockIds |
| grenades.txt | `#grenades` | Grenade items with damage, throw range, consume chance |
| pactcomponents.txt | `#pactcomponents` | Pact ritual components |
| repairs.txt | `#repairs` | Repair kit items |
| trash.txt | `#trash` | Junk/disassembly items |

## From `config_items_properties.txt`

| Base Ref File | Section Header | Notes |
|---|---|---|
| explosions.txt | `#explosions` | Explosion definitions |
| firemodes.txt | `#firemodes` | Firemode configurations (accuracy, scatter, damage mult, delay) |
| itemTraits.txt | `#itemtraits` | Trait definitions with type, context, parameters, tooltip |
| projectiles.txt | `#projectiles` | Projectile definitions |

## From `config_spacesandbox.txt`

| Base Ref File | Section Header | Notes |
|---|---|---|
| factions.txt | `#factions` | Faction definitions with type, alliance, tech level, spawn settings |

## From `config_wounds.txt`

| Base Ref File | Section Header | Notes |
|---|---|---|
| damageTypes.txt | `#damagetypes` | Damage type definitions with resist types, status effects, physical flag, modifiers |
| statusEffects.txt | `#statuseffects` | Status effect definitions with progression, renewal type, wound effects, modifiers |

## Summary

```
config_items.txt
├── #ammo           → ref/base/ammo.txt
├── #datadisks      → ref/base/datadisks.txt
├── #grenades       → ref/base/grenades.txt
├── #pactcomponents → ref/base/pactcomponents.txt
├── #repairs        → ref/base/repairs.txt
└── #trash          → ref/base/trash.txt

config_items_properties.txt
├── #explosions     → ref/base/explosions.txt
├── #firemodes      → ref/base/firemodes.txt
├── #itemtraits     → ref/base/itemTraits.txt
└── #projectiles    → ref/base/projectiles.txt

config_spacesandbox.txt
└── #factions       → ref/base/factions.txt

config_wounds.txt
├── #damagetypes    → ref/base/damageTypes.txt
└── #statuseffects  → ref/base/statusEffects.txt
```

---

## Enum Files (`ref/enums/`)

### Mutable — derived from config files

| Enum File | Source | Derivation Method |
|---|---|---|
| ammoTypes.txt | `config_items.txt` `#ammo` section | Extract unique values from `AmmoType` column across all ammo entries, plus the empty row (blank value). Output: single `Name` column. |
| categories.txt | `config_items.txt` all sections | Extract unique values from `Categories` column across essentially all item sections. Categories are space-delimited per entry, so each entry may contribute multiple values. Output: single `Name` column. |

Same update policy as base files: **full replacement** from source. ammoTypes and categories are value extractions (unique column values), not section copies.

### Immutable — sourced elsewhere, not updated by this process

| Enum File | Notes |
|---|---|
| ballisticTypes.txt | Static list |
| factionIdCodes.txt | Static list |
| handGrips.txt | Static list |
| itemClass.txt | Static list |
| languageCodes.txt | Static list |
| weaponClass.txt | Static list |
| weaponSubClass.txt | Static list |
