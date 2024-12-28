import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import { AddXp } from "@/wailsjs/go/main/App";

const perks_default = [
  {
    category: "Passive",
    perks: [
      { name: "Fitness", perkName: "Fitness" },
      { name: "Strength", perkName: "Strength" },
    ],
  },
  {
    category: "Firearm",
    perks: [
      { name: "Aiming", perkName: "Aiming" },
      { name: "Reloading", perkName: "Reloading" },
    ],
  },
  {
    category: "Survivalist",
    perks: [
      { name: "Fishing", perkName: "Fishing" },
      { name: "Trapping", perkName: "Trapping" },
      { name: "Foraging", perkName: "PlantScavenging" },
    ],
  },
  {
    category: "Combat",
    perks: [
      { name: "Axe", perkName: "Axe" },
      { name: "Long Blunt", perkName: "Blunt" },
      { name: "Short Blunt", perkName: "SmallBlunt" },
      { name: "Long Blade", perkName: "LongBlade" },
      { name: "Short Blade", perkName: "SmallBlade" },
      { name: "Spear", perkName: "Spear" },
      { name: "Maintenance", perkName: "Maintenance" },
    ],
  },
  {
    category: "Agility",
    perks: [
      { name: "Sprinting", perkName: "Sprinting" },
      { name: "Nimble", perkName: "Nimble" },
      { name: "Lightfooted", perkName: "Lightfoot" },
      { name: "Sneaking", perkName: "Sneak" },
    ],
  },

  {
    category: "Crafting",
    perks: [
      { name: "Carpentry", perkName: "Woodwork" },
      { name: "Cooking", perkName: "Cooking" },
      { name: "Farming", perkName: "Farming" },
      { name: "First Aid", perkName: "Doctor" },
      { name: "Electrical", perkName: "Electricity" },
      { name: "Metalworking", perkName: "MetalWelding" },
      { name: "Mechanics", perkName: "Mechanics" },
      { name: "Tailoring", perkName: "Tailoring" },
    ],
  },
];

const regularSkillXp = [75, 150, 300, 750, 1500, 3000, 4500, 6000, 7500, 9000];
const passiveSkillXp = [1500, 3000, 6000, 9000, 18000, 30000, 60000, 90000, 120000, 150000];

interface AddXpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
}

export function AddXpDialog({ isOpen, onClose, names }: AddXpDialogProps) {
  const [count, setCount] = useState("");
  const [selectedPerks, setSelectedPerks] = useState<string[]>([]);

  const [selectedRegularXp, setSelectedRegularXp] = useState<string[]>([]);
  const [selectedPassiveXp, setSelectedPassiveXp] = useState<string[]>([]);

  const handleTogglePerk = (perkName: string) => {
    setSelectedPerks((prev) =>
      prev.includes(perkName) ? prev.filter((perk) => perk !== perkName) : [...prev, perkName]
    );
  };

  const handleAddXp = () => {
    // Check if count is a number
    if (isNaN(parseInt(count))) {
      return;
    }

    AddXp(names, selectedPerks, parseInt(count));

    onClose();
  };

  const handleRegularXpChange = (values: string[]) => {
    setSelectedRegularXp(values);
    setSelectedPassiveXp([]);
    setCount(values.reduce((total, xp) => total + parseInt(xp), 0).toString());
  };

  const handlePassiveXpChange = (values: string[]) => {
    setSelectedPassiveXp(values);
    setSelectedRegularXp([]);
    setCount(values.reduce((total, xp) => total + parseInt(xp), 0).toString());
  };

  useEffect(() => {
    setSelectedPerks([]);
    setCount("");
    setSelectedRegularXp([]);
    setSelectedPassiveXp([]);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[60rem] max-w-full max-h-full">
        <DialogHeader>
          <DialogTitle>Add XP</DialogTitle>
          <DialogDescription>
            <p>{"You will add XP to " + names.join(", ") + "."}</p>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 grid-cols-2">
          {perks_default.map((category) => (
            <div key={category.category} className="space-y-2">
              <h3 className="text-lg font-semibold">{category.category}</h3>
              <ToggleGroup
                type="multiple"
                size="sm"
                className="flex flex-wrap gap-2 justify-start"
                value={selectedPerks}
              >
                {category.perks.map((perk) => (
                  <ToggleGroupItem
                    key={perk.perkName}
                    value={perk.perkName}
                    aria-label={`Toggle ${perk.name}`}
                    className="border flex gap-1 hover:bg-accent hover:text-accent-foreground hover:backdrop-brightness-75"
                    onClick={() => handleTogglePerk(perk.perkName)}
                  >
                    <img src={`/perks/${perk.perkName}.png`} alt={perk.name} className="h-5 w-5 object-cover" />
                    {perk.name}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 ml-[7.3rem]">
            {Array.from({ length: 10 }).map((_: any, i: number) => (
              <div className="w-[3.9rem]">{`Lvl ${i + 1}`}</div>
            ))}
          </div>

          {/* Regular Skill XP Buttons */}
          <div className="flex items-center gap-2">
            <h4 className="text-md font-medium w-24">Regular Skill</h4>
            <ToggleGroup
              type="multiple"
              size="sm"
              className="flex flex-wrap gap-2 justify-start"
              value={selectedRegularXp}
              onValueChange={handleRegularXpChange}
            >
              {regularSkillXp.map((xp) => (
                <ToggleGroupItem
                  key={`regular-${xp}`}
                  value={xp.toString()}
                  className="border text-xs w-[3.9rem] hover:bg-accent hover:text-accent-foreground hover:backdrop-brightness-75"
                >
                  +{xp}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Passive Skill XP Buttons */}
          <div className="flex items-center gap-2">
            <h4 className="text-md font-medium w-24">Passive Skill</h4>
            <ToggleGroup
              type="multiple"
              size="sm"
              className="flex flex-wrap gap-2 justify-start"
              value={selectedPassiveXp}
              onValueChange={handlePassiveXpChange}
            >
              {passiveSkillXp.map((xp) => (
                <ToggleGroupItem
                  key={`passive-${xp}`}
                  value={xp.toString()}
                  className="border text-xs w-[3.9rem] hover:bg-accent hover:text-accent-foreground hover:backdrop-brightness-75"
                >
                  +{xp}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <DialogFooter className="flex items-end w-full">
          <div className="space-y-1 w-full">
            <Label htmlFor="xp-amount" className="text-right">
              XP Amount
            </Label>
            <Input
              value={count}
              onChange={(e) => setCount(e.target.value)}
              min={0}
              max={487500}
              id="xp-amount"
              type="number"
              placeholder="2"
            />
          </div>
          <Button
            onClick={() => {
              setSelectedPerks(perks_default.flatMap((category) => category.perks.map((perk) => perk.perkName)));
              setCount("487500");
            }}
          >
            Max all
          </Button>
          <Button
            type="submit"
            onClick={handleAddXp}
            disabled={selectedPerks.length === 0 || count === "" || isNaN(parseInt(count)) || parseInt(count) < 0}
          >
            Add XP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
