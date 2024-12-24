import { useState, useEffect, Fragment, ImgHTMLAttributes } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "../ui/button";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";
import { Card } from "../ui/card";
import { Combobox } from "../ui/combobox";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { BrowserOpenURL } from "@/wailsjs/runtime/runtime";
import { main } from "@/wailsjs/go/models";
import { useRcon } from "@/contexts/rcon-provider";
import { AddVehicle } from "@/wailsjs/go/main/App";

// Define the Vehicle interface
interface Vehicle {
  name: string;
  type: "category" | "model" | "type";
  id?: string;
  images?: string[];
  children?: Vehicle[];
  thumbnails?: string[];
}

// Type for the JSON data
type VehicleData = Vehicle[];

// Async function to import vehicle data
const loadVehicleData = async (): Promise<VehicleData> => {
  try {
    const data = await import("@/assets/vehicles.json");
    return data.default as VehicleData;
  } catch (error) {
    console.error("Error loading vehicle data:", error);
    return [];
  }
};

interface AddVehicleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialNames?: string[];
  initialTab?: string;
}

export function AddVehicleDialog({
  isOpen,
  onClose,
  initialNames = [],
  initialTab = "coordinates",
}: AddVehicleDialogProps) {
  const { players } = useRcon();
  const onlinePlayers = players.filter((player) => player.online);
  //const onlinePlayers = players;

  const [path, setPath] = useState<Vehicle[]>([]);
  const [vehicles, setVehicles] = useState<VehicleData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedNames, setSelectedNames] = useState<string[]>(
    initialNames.filter((name) => onlinePlayers.some((player) => player.name === name))
  );
  const [tab, setTab] = useState(initialTab);
  const [coordinates, setCoordinates] = useState({} as main.Coordinates);

  const handleAddVehicle = () => {
    if (tab === "coordinates") {
      if (coordinates.x && coordinates.y && selectedId) {
        AddVehicle(selectedId, [], coordinates);
      }
    } else {
      if (selectedNames && selectedNames.length > 0 && selectedId) {
        AddVehicle(selectedId, selectedNames, {} as main.Coordinates);
      }
    }

    onClose();
  };

  // Load vehicle data when component mounts
  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      try {
        const data = await loadVehicleData();
        setVehicles(data);
      } catch (err) {
        setError("Failed to load vehicle data.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  useEffect(() => {
    setSelectedNames(initialNames.filter((name) => onlinePlayers.some((player) => player.name === name)));
    setTab(initialTab);
    setCoordinates({} as main.Coordinates);
    setPath([]);
  }, [isOpen, initialNames, initialTab]);

  const currentLevel = path.length === 0 ? vehicles : path[path.length - 1]?.children || [];
  const selectedId = path.length > 0 ? path[path.length - 1].id : null;
  const selectedCar = selectedId ? path[path.length - 1] : null;
  const selectedModel =
    selectedId && path.length > 1 && path[path.length - 2].type === "model" ? path[path.length - 2] : null;

  if (loading || error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[80vw] h-[40vh] flex items-center justify-center">
          <DialogHeader>
            <DialogTitle>{loading ? "Loading..." : "Error"}</DialogTitle>
            {error && <DialogDescription>{error}</DialogDescription>}
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <div className="fixed inset-0 bg-black bg-opacity-80" hidden={!isOpen} />{" "}
      <DialogContent className="max-w-[80vw] max-h-full gap-0">
        <DialogHeader className="pb-4">
          <DialogTitle>Add Vehicle</DialogTitle>
        </DialogHeader>

        <BreadcrumbNavigation path={path} setPath={setPath} vehicles={vehicles} />

        <ScrollArea className="w-full h-96">
          {selectedCar ? (
            <>
              <h1 className="text-2xl font-semibold leading-none tracking-tight mb-2.5">
                {selectedModel ? selectedModel.name + " - " : ""} {selectedCar.name}
              </h1>
              <div className="flex gap-3">
                <div>
                  <div className="aspect-[3/2] h-60 rounded overflow-clip">
                    {selectedCar.images && selectedCar.images.length > 1 ? (
                      <ItemImage
                        images={selectedCar.images}
                        name={selectedCar.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={selectedCar.images?.[0]}
                        alt={selectedCar.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedId}</p>
                </div>
                <div className="w-full flex justify-center">
                  <Tabs value={tab} className="w-3/4 max-w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="coordinates" onClick={() => setTab("coordinates")}>
                        To Coordinates
                      </TabsTrigger>
                      <TabsTrigger value="player" onClick={() => setTab("player")}>
                        To Player
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="coordinates" className="h-24">
                      <div className="grid grid-cols-3 gap-10 pt-6 pb-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="teleport_x">X</Label>
                          <Input
                            value={coordinates.x}
                            onChange={(e) => setCoordinates({ ...coordinates, x: parseInt(e.target.value) })}
                            id="teleport_x"
                            type="number"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="teleport_y">Y</Label>
                          <Input
                            value={coordinates.y}
                            onChange={(e) => setCoordinates({ ...coordinates, y: parseInt(e.target.value) })}
                            id="teleport_y"
                            type="number"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="teleport_z">Z</Label>
                          <Input
                            disabled
                            value={coordinates.z}
                            onChange={(e) => setCoordinates({ ...coordinates, z: parseInt(e.target.value) })}
                            placeholder="0"
                            id="teleport_z"
                            type="number"
                          />
                        </div>
                      </div>
                      <Button
                        variant={"link"}
                        onClick={() =>
                          BrowserOpenURL(
                            `https://map.projectzomboid.com/${
                              coordinates.x && coordinates.y ? "#" + coordinates.x + "x" + coordinates.y : ""
                            }`
                          )
                        }
                      >
                        Preview in map website
                      </Button>
                    </TabsContent>
                    <TabsContent value="player" className="h-24">
                      <div className="pt-6">
                        <Combobox
                          elements={onlinePlayers.map((player) => ({ value: player.name, label: player.name }))}
                          initialValue={selectedNames}
                          multiSelect={true}
                          placeholder={"Select target player..."}
                          searchPlaceholder={"Search player..."}
                          nothingFoundMessage={"No online players found"}
                          onChange={setSelectedNames}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 mr-4">
                {currentLevel.map((item, index) => (
                  <VehicleCard key={index} vehicle={item} onClick={() => setPath([...path, item])} />
                ))}
              </div>
            </>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button
            onClick={handleAddVehicle}
            disabled={
              !selectedCar ||
              (tab == "coordinates" && (!coordinates.x || !coordinates.y)) ||
              (tab == "player" && (!selectedNames || selectedNames.length === 0))
            }
          >
            Add Vehicle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Vehicle Card Component
const VehicleCard = ({ vehicle, onClick }: { vehicle: Vehicle; onClick: () => void }) => (
  <Card onClick={onClick} className="cursor-pointer relative overflow-clip aspect-[3/2]">
    <div className="relative w-full h-full hover:scale-105 transition-transform">
      {vehicle.images ? (
        <>
          {vehicle.images.length > 1 ? (
            <ItemImage images={vehicle.images} name={vehicle.name} className="w-full h-full object-cover" />
          ) : (
            <img src={vehicle.images?.[0]} alt={vehicle.name} className="w-full h-full object-cover" />
          )}
        </>
      ) : (
        <>
          {vehicle.thumbnails && vehicle.thumbnails.length > 0 && (
            <div className="grid grid-cols-2">
              {vehicle.thumbnails.map((image, index) => (
                <img key={index} src={image} alt={vehicle.name} className="w-full h-full object-cover aspect-[3/2]" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
    <div className="absolute bottom-0 left-0 w-full text-center font-semibold bg-black bg-opacity-40 text-background dark:text-foreground py-1">
      {vehicle.name}
    </div>
  </Card>
);

// Breadcrumb navigation
interface BreadcrumbNavigationProps {
  path: Vehicle[];
  setPath: (path: Vehicle[]) => void;
  vehicles: VehicleData;
}
const BreadcrumbNavigation = ({ path, setPath, vehicles }: BreadcrumbNavigationProps) => {
  // Handler for moving back in the path
  const handleBack = () => setPath(path.slice(0, path.length - 1));

  // Handler for resetting the path
  const handleResetPath = () => setPath([]);

  // Handler for navigating to a specific path
  const handleNavigateToPath = (newPath: Vehicle[]) => setPath(newPath);

  // Dropdown menu for vehicle list
  const VehicleDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 cursor-pointer transition-colors hover:text-foreground">
        <ChevronDown className="h-5 w-5 mt-0.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {vehicles.map((vehicle) => (
          <DropdownMenuItem
            key={vehicle.name}
            onClick={() => handleNavigateToPath([vehicle])}
            className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
          >
            {vehicle.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Breadcrumb item with optional dropdown for children
  const BreadcrumbItemWithDropdown = ({ item, isLast, index }: { item: Vehicle; isLast: boolean; index: number }) => {
    const hasUniformType = (children: Vehicle[] | undefined): boolean => {
      if (!children || children.length === 0) return false; // No children or empty array
      const firstType = children[0].type; // Get the type of the first child
      return children.every((child) => child.type === firstType);
    };

    const hasUniformChildren = item.children && item.children.length > 0 && hasUniformType(item.children);

    return (
      <BreadcrumbItem className="items-center gap-0.5">
        {isLast ? (
          <BreadcrumbPage className="pointer-events-none">{item.name}</BreadcrumbPage>
        ) : hasUniformChildren ? (
          <>
            <BreadcrumbLink className="cursor-pointer" onClick={() => handleNavigateToPath(path.slice(0, index + 1))}>
              {item.name}
            </BreadcrumbLink>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 cursor-pointer transition-colors hover:text-foreground">
                <ChevronDown className="h-5 w-5 mt-0.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {item.children?.map((child) => (
                  <DropdownMenuItem
                    key={child.name}
                    onClick={() => handleNavigateToPath(path.slice(0, index + 1).concat(child))}
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  >
                    {child.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <BreadcrumbLink className="cursor-pointer" onClick={() => handleNavigateToPath(path.slice(0, index + 1))}>
            {item.name}
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>
    );
  };

  return (
    <Breadcrumb className="mb-2.5">
      <BreadcrumbList>
        {/* Back Button */}
        <BreadcrumbItem onClick={handleBack} className={`${path.length === 0 ? "pointer-events-none opacity-50" : ""}`}>
          <BreadcrumbLink className="flex items-center gap-1 cursor-pointer">
            <ArrowLeft className="h-4 w-4 mt-0.5" />
            Back
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>

        {/* Root Vehicles Item */}
        <BreadcrumbItem className="items-center gap-0.5">
          <BreadcrumbLink
            className={`${path.length === 0 ? "text-foreground pointer-events-none" : "cursor-pointer"}`}
            onClick={handleResetPath}
          >
            Vehicles
          </BreadcrumbLink>
          {path.length > 0 && <VehicleDropdown />}
        </BreadcrumbItem>

        {/* Dynamic Path Items */}
        {path.map((item, index) => (
          <Fragment key={item.name}>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItemWithDropdown item={item} isLast={index === path.length - 1} index={index} />
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

interface ItemImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  images: string[];
  interval?: number;
  name: string;
}
const ItemImage: React.FC<ItemImageProps> = ({ images, interval = 1500, name, ...imgProps }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const imageInterval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(imageInterval);
  }, [images, interval]);

  return (
    <img
      src={images?.[currentIndex] || ""}
      alt={name}
      {...imgProps} // Pass all additional props
    />
  );
};
