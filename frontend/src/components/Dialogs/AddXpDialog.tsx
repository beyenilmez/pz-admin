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

// Static imports for images
import Fitness from "@/assets/perks/Fitness.png";
import Strength from "@/assets/perks/Strength.png";

import Sprinting from "@/assets/perks/Sprinting.png";
import Lightfoot from "@/assets/perks/Lightfoot.png";
import Nimble from "@/assets/perks/Nimble.png";
import Sneak from "@/assets/perks/Sneak.png";

import Axe from "@/assets/perks/Axe.png";
import Blunt from "@/assets/perks/Blunt.png";
import SmallBlunt from "@/assets/perks/SmallBlunt.png";
import LongBlade from "@/assets/perks/LongBlade.png";
import SmallBlade from "@/assets/perks/SmallBlade.png";
import Spear from "@/assets/perks/Spear.png";
import Maintenance from "@/assets/perks/Maintenance.png";

import Woodwork from "@/assets/perks/Woodwork.png";
import Cooking from "@/assets/perks/Cooking.png";
import Farming from "@/assets/perks/Farming.png";
import Doctor from "@/assets/perks/Doctor.png";
import Electricity from "@/assets/perks/Electricity.png";
import MetalWelding from "@/assets/perks/MetalWelding.png";
import Mechanics from "@/assets/perks/Mechanics.png";
import Tailoring from "@/assets/perks/Tailoring.png";

import Aiming from "@/assets/perks/Aiming.png";
import Reloading from "@/assets/perks/Reloading.png";

import Fishing from "@/assets/perks/Fishing.png";
import Trapping from "@/assets/perks/Trapping.png";
import PlantScavenging from "@/assets/perks/PlantScavenging.png";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import { AddXp } from "@/wailsjs/go/main/App";

// Mapping for perkName to image
const images = {
  Fitness,
  Strength,

  Aiming,
  Reloading,

  Fishing,
  Trapping,
  PlantScavenging,

  Axe,
  Blunt,
  SmallBlunt,
  LongBlade,
  SmallBlade,
  Spear,
  Maintenance,

  Sprinting,
  Nimble,
  Lightfoot,
  Sneak,

  Woodwork,
  Cooking,
  Farming,
  Doctor,
  Electricity,
  MetalWelding,
  Mechanics,
  Tailoring,
};

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

interface AddXpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
}

export function AddXpDialog({ isOpen, onClose, names }: AddXpDialogProps) {
  const [count, setCount] = useState("");
  const [selectedPerks, setSelectedPerks] = useState<string[]>([]);

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

  useEffect(() => {
    setSelectedPerks([]);
    setCount("");
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[60rem] max-w-full">
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
              <ToggleGroup type="multiple" size="sm" className="flex flex-wrap gap-2 justify-start">
                {category.perks.map((perk) => (
                  <ToggleGroupItem
                    key={perk.perkName}
                    value={perk.perkName}
                    aria-label={`Toggle ${perk.name}`}
                    className="border p-2 rounded flex gap-1"
                    onClick={() => handleTogglePerk(perk.perkName)}
                  >
                    <img
                      src={images[perk.perkName as keyof typeof images]}
                      alt={perk.name}
                      className="h-5 w-5 object-cover"
                    />
                    {perk.name}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          ))}
        </div>

        <DialogFooter className="flex items-end w-full gap-6">
          <div className="space-y-1 w-full">
            <Label htmlFor="xp-amount" className="text-right">
              XP Amount
            </Label>
            <Input
              value={count}
              onChange={(e) => setCount(e.target.value)}
              min={0}
              id="xp-amount"
              type="number"
              placeholder="2"
            />
          </div>
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
