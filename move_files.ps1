$source = "d:\edu(1)\src\app\components"
$dest = "d:\edu(1)\aischool_backup"

Move-Item -Path "$source\Game*.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\*Game.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\Puzzle*.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\Match3*.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\ColorLink*.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\Tangram*.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\BubbleShooter.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\TileCollapse.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\CircuitLink.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\HexaConnect.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\GravityBlocks.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\NutsBolts.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\TicTacPro.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\SettingsPage.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\CreditsPage.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\NotificationsPage.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\MyProjects.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\Projects*.tsx" -Destination $dest -ErrorAction SilentlyContinue
Move-Item -Path "$source\AIProject*.tsx" -Destination $dest -ErrorAction SilentlyContinue

npm install --save-dev @types/three
