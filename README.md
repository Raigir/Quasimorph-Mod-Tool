# Quasimorph Mod Tool

[![Author: Raigir](https://img.shields.io/badge/Author-Raigir-2f6f91)](https://github.com/Raigir)

A local workflow tool for managing Quasimorph game mod projects based on the Content Mod Creator (by Crynano) API — weapons, ammo, firemodes, sprites, localization, descriptors, crafting recipes, datadisks, and faction rewards.

## Requirements

- **Node.js** (any recent version) — zero npm dependencies

### Installing Node.js

**Windows:** Download the LTS installer from https://nodejs.org — run it, click Next a few times, done.

**macOS:**
```bash
brew install node
```

**Linux:**
```bash
sudo apt install nodejs    # Ubuntu/Debian
sudo dnf install nodejs    # Fedora
```

## Quick Start

**Double-click the launcher:**
- Windows: `start.bat`
- Mac/Linux: `start.sh`

**Or start manually:**
```bash
node server.js
# Open http://localhost:8080
```

If you open `index.html` directly as a file, a startup screen will guide you through setup.

## Folder Structure

```
mod-workflow/
├── start.bat / start.sh       # Launchers
├── server.js                  # Node.js backend (single file)
├── index.html                 # Complete UI (single file)
├── data/
│   └── {ProjectName}/
│       ├── settings.json              # Project settings (bundle path)
│       └── Assets/
│           ├── Weapons/               # Weapon records (.json)
│           ├── Ammo/                  # Ammo records
│           ├── Firemodes/             # Firemode records
│           ├── Localization/
│           │   ├── Weapons/           # {id}_localization.json
│           │   └── Ammo/             # {id}_localization.json
│           ├── Descriptors/
│           │   ├── Weapons/           # {id}_descriptor.json
│           │   ├── Firemodes/         # {id}_descriptor.json
│           │   └── Ammo/             # {id}_descriptor.json
│           ├── Crafting Recipes/      # {id}_receipt.json
│           ├── Datadisks/             # {diskId}_diskData.json (shared)
│           ├── FactionRewards/        # {factionId}_factionData.json (shared)
│           ├── Images/
│           │   ├── Weapons/           # Weapon sprites (root or subfolders)
│           │   │   └── {subfolder}/   # User-named (e.g., chu, cor)
│           │   ├── Firemodes/         # Firemode sprites
│           │   └── Ammo/             # Ammo sprites
│           ├── Bundles/               # Asset bundles
│           ├── Armors/
│           ├── Consumables/
│           ├── Explosions/
└── ref/
    ├── base/                          # Reference TSVs (game data)
    │   ├── ammo.txt
    │   ├── firemodes.txt
    │   ├── grenades.txt
    │   ├── itemTraits.txt
    │   ├── repairs.txt
    │   ├── trash.txt
    │   ├── datadisks.txt
    │   ├── explosions.txt
    │   ├── factions.txt
    │   ├── pactcomponents.txt
    │   └── statusEffects.txt
    └── enums/                         # Enum value lists
        ├── weaponClass.txt
        ├── weaponSubClass.txt
        ├── categories.txt
        ├── ammoTypes.txt
        ├── projectileIds.txt
        ├── projectiles.txt
        ├── ballisticTypes.txt
        ├── damageTypes.txt
        ├── factionIdCodes.txt
        ├── handGrips.txt
        ├── itemClass.txt
        └── languageCodes.txt
```

## Reference Data

The `ref/` folder contains TSV files extracted from the base game. These are **read-only reference data** — the tool uses them to populate dropdown selections and combo boxes. They are never modified by the application.

- **base/** — Full game records (ammo, firemodes, grenades, repairs, traits, etc.)
- **enums/** — Simple value lists (weapon classes, categories, damage types, etc.)

## Data Format

All asset files follow the standard format:
```json
{
  "RecordType": "MGSC.WeaponRecord",
  "Data": {
    "Id": "my_weapon_1",
    ...
  }
}
```

See `GUIDE.md` for detailed feature documentation.
