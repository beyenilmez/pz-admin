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
import { Button } from "../ui/button";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";
import { Card } from "../ui/card";
import { Combobox } from "../ui/combobox";

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

interface VehicleSpawnerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
  initialNames?: string[];
}

export function VehicleSpawnerDialog({ isOpen, onClose, names, initialNames = [] }: VehicleSpawnerDialogProps) {
  const [path, setPath] = useState<Vehicle[]>([]);
  const [vehicles, setVehicles] = useState<VehicleData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedNames, setSelectedNames] = useState<string[]>(initialNames);

  const handleAddVehicle = () => {
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

  // Reset path when dialog state changes
  useEffect(() => {
    //setPath([]);
  }, [isOpen]);

  const currentLevel = path.length === 0 ? vehicles : path[path.length - 1]?.children || [];
  const selectedId = path.length > 0 ? path[path.length - 1].id : null;
  const selectedCar = selectedId ? path[path.length - 1] : null;
  const selectedModel =
    selectedId && path.length > 1 && path[path.length - 2].type === "model" ? path[path.length - 2] : null;

  const handleBack = () => {
    if (path.length > 0) setPath(path.slice(0, -1));
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[80vw] h-[40vh] flex items-center justify-center">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[80vw] h-[40vh] flex items-center justify-center">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{error}</DialogDescription>
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
        <Breadcrumb className="mb-2.5">
          <BreadcrumbList>
            <BreadcrumbItem
              onClick={handleBack}
              className={`${path.length === 0 ? "pointer-events-none opacity-50" : ""}`}
            >
              <BreadcrumbLink className="flex items-center gap-1 cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                Back
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>

            <BreadcrumbItem className="items-center gap-0.5">
              <BreadcrumbLink className="cursor-pointer" onClick={() => setPath([])}>
                Vehicles
              </BreadcrumbLink>
              {path.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 cursor-pointer transition-colors hover:text-foreground">
                    <ChevronDown className="h-5 w-5 mt-0.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {vehicles.map((vehicle) => (
                      <DropdownMenuItem
                        key={vehicle.name}
                        onClick={() => setPath([vehicle])}
                        className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                      >
                        {vehicle.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </BreadcrumbItem>

            {path.map((item, index) => (
              <Fragment key={item.name}>
                <BreadcrumbSeparator>/</BreadcrumbSeparator>
                <BreadcrumbItem className="items-center gap-0.5">
                  {index === path.length - 1 ? (
                    <BreadcrumbPage className="pointer-events-none">{item.name}</BreadcrumbPage>
                  ) : (
                    <>
                      {item.children && item.children.length > 0 && hasUniformType(item.children) ? (
                        <>
                          <BreadcrumbLink className="cursor-pointer" onClick={() => setPath(path.slice(0, index + 1))}>
                            {item.name}
                          </BreadcrumbLink>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1 cursor-pointer transition-colors hover:text-foreground">
                              <ChevronDown className="h-5 w-5 mt-0.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {item.children.map((child) => (
                                <DropdownMenuItem
                                  key={child.name}
                                  onClick={() => setPath(path.slice(0, index + 1).concat(child))}
                                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                >
                                  {child.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      ) : (
                        <BreadcrumbLink className="cursor-pointer" onClick={() => setPath(path.slice(0, index + 1))}>
                          {item.name}
                        </BreadcrumbLink>
                      )}
                    </>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
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
                <div>
                  <Combobox
                    elements={names.map((name) => ({ value: name, label: name }))}
                    initialValue={selectedNames}
                    multiSelect={true}
                    placeholder="Select players"
                    onChange={setSelectedNames}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 mr-4">
                {currentLevel.map((item, index) => (
                  <Card
                    key={index}
                    onClick={() => setPath(path.concat(item))}
                    className="cursor-pointer relative overflow-clip aspect-[3/2]"
                  >
                    <div className="relative w-full h-full hover:scale-105 transition-transform">
                      {item.images ? (
                        <>
                          {item.images.length > 1 ? (
                            <ItemImage images={item.images} name={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <img src={item.images?.[0]} alt={item.name} className="w-full h-full object-cover" />
                          )}
                        </>
                      ) : (
                        <>
                          {item.thumbnails && item.thumbnails.length > 0 && (
                            <div className="grid grid-cols-2">
                              {item.thumbnails.map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={item.name}
                                  className="w-full h-full object-cover aspect-[3/2]"
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 w-full text-center font-semibold bg-black bg-opacity-40 text-background dark:text-foreground py-1">
                      {item.name}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button onClick={handleAddVehicle}>Add Vehicle</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const hasUniformType = (children: Vehicle[] | undefined): boolean => {
  if (!children || children.length === 0) return false; // No children or empty array
  const firstType = children[0].type; // Get the type of the first child
  return children.every((child) => child.type === firstType);
};

interface ItemImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  images: string[];
  interval?: number; // Interval duration in milliseconds
  name: string; // Alt text or fallback
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