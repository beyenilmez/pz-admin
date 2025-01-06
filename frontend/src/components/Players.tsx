"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Check, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "./ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { main } from "@/wailsjs/go/models";
import { useState } from "react";
import { BanUserDialog } from "./Dialogs/BanUserDialog";
import { useRcon } from "@/contexts/rcon-provider";
import { UnbanUserDialog } from "./Dialogs/UnbanUserDialog";
import { KickUserDialog } from "./Dialogs/KickUserDialog";
import { GodMode } from "@/wailsjs/go/main/App";
import { TeleportDialog } from "./Dialogs/TeleportDialog";
import { SetAccessLevelDialog } from "./Dialogs/SetAccessLevelDialog";
import { Badge } from "./ui/badge";
import { AddPlayerDialog } from "./Dialogs/AddPlayerDialog";
import { CreateHordeDialog } from "./Dialogs/CreateHordeDialog";
import { LightningDialog } from "./Dialogs/LightningDialog";
import { ThunderDialog } from "./Dialogs/ThunderDialog";
import { AddPlayerToWhitelistDialog } from "./Dialogs/AddPlayerToWhitelistDialog";
import { RemovePlayerFromWhitelistDialog } from "./Dialogs/RemovePlayerFromWhitelistDialog";
import { AddXpDialog } from "./Dialogs/AddXpDialog";
import { AddVehicleDialog } from "./Dialogs/AddVehicleDialog";
import { AddItemDialog } from "./Dialogs/AddItemDialog";
import { useConfig } from "@/contexts/config-provider";

export function PlayersTab() {
  const { players } = useRcon();
  const { config } = useConfig();
  const debug = config?.debugMode;

  const columns: ColumnDef<main.Player>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="ml-4"
        />
      ),

      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          className="hover:no-underline hover:text-foreground"
          variant="link"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="w-4 h-4 ml-1" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "online",
      header: ({ column }) => (
        <Button
          className="hover:no-underline hover:text-foreground"
          variant="link"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="w-4 h-4 ml-1" />
        </Button>
      ),
      cell: ({ row }) => {
        const online = row.getValue("online");
        const banned = row.getValue("banned");
        return (
          <div className="space-x-1">
            <Badge
              className={`${
                online ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
              }`}
            >
              {online ? "Online" : "Offline"}
            </Badge>

            {banned ? <Badge className="bg-warning text-warning-foreground">Banned</Badge> : ""}
          </div>
        );
      },
    },
    {
      accessorKey: "accessLevel",
      header: ({ column }) => (
        <Button
          className="hover:no-underline hover:text-foreground"
          variant="link"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Access Level
          <ArrowUpDown className="w-4 h-4 ml-1" />
        </Button>
      ),
      cell: ({ row }) => {
        //Admin, Moderator, Overseer, GM, Observer
        const accessLevel: String = row.getValue("accessLevel") || "unknown";
        const accessLevelBgClass =
          accessLevel === "admin"
            ? "dark:bg-rose-700 bg-rose-500"
            : accessLevel === "moderator"
            ? "dark:bg-emerald-700 bg-emerald-500"
            : accessLevel === "overseer"
            ? "dark:bg-sky-700 bg-sky-500"
            : accessLevel === "gm"
            ? "dark:bg-amber-700 bg-amber-500"
            : accessLevel === "observer"
            ? "dark:bg-slate-700 bg-slate-500"
            : "";
        return (
          <Badge
            className={`${accessLevelBgClass} ${
              accessLevel !== "unknown" && accessLevel !== "player" ? "dark:text-foreground" : ""
            }`}
            variant={accessLevel === "unknown" ? "outline" : "default"}
          >
            {accessLevel[0].toUpperCase() + accessLevel.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "banned",
      enableHiding: true, // Makes the column hidden from view
      cell: () => null, // Prevents it from rendering in the table body
      header: () => null, // Prevents it from rendering in the table header
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const player = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="w-full flex items-end justify-end">
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted hover:text-foreground">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal />
                </Button>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => handleSetAccessLevel(player.name)}>
                    Set Access Level
                  </DropdownMenuItem>
                  {!player.banned && <DropdownMenuItem onClick={() => handleBan(player.name)}>Ban</DropdownMenuItem>}
                  {player.banned && <DropdownMenuItem onClick={() => handleUnban(player.name)}>Unban</DropdownMenuItem>}
                  {player.online && <DropdownMenuItem onClick={() => handleKick(player.name)}>Kick</DropdownMenuItem>}
                  <DropdownMenuItem
                    disabled={player.banned}
                    onClick={() => handleRemovePlayerFromWhitelist(player.name)}
                  >
                    Remove from Whitelist
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                {player.online && (
                  <>
                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        disabled={!player.online}
                        className="flex justify-between"
                        onClick={() => handleCheat(!player.godmode, player.name)}
                      >
                        God Mode
                        {player.godmode && <Check />}
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={!player.online} onClick={() => handleTeleport(player.name)}>
                        Teleport
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuItem disabled={!player.online} onClick={() => handleAddXp(player.name)}>
                        Add XP
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={!player.online} onClick={() => handleAddItem(player.name)}>
                        Add Item
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={!player.online} onClick={() => handleAddVehicle(player.name)}>
                        Add Vehicle
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger
                        disabled={!player.online}
                        className="data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        Events
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => handleCreateHorde(player.name)}>
                            Create Horde
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleLightning(player.name)}>Lightning</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleThunder(player.name)}>Thunder</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        );
      },
    },
  ];

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const table = useReactTable({
    data: players,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleSelect = (name?: string) => {
    if (name) {
      setSelectedUsers([name]);
    } else {
      setSelectedUsers(table.getSelectedRowModel().rows.map((row) => row.original.name));
    }
  };

  const [isAddPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false);

  const [isBanDialogOpen, setBanDialogOpen] = useState(false);
  const handleBan = (name?: string) => {
    handleSelect(name);
    setBanDialogOpen(true);
  };

  const [isSetAccessLevelDialogOpen, setSetAccessLevelDialogOpen] = useState(false);
  const handleSetAccessLevel = (name?: string) => {
    handleSelect(name);
    setSetAccessLevelDialogOpen(true);
  };

  const [isUnbanDialogOpen, setUnbanDialogOpen] = useState(false);
  const handleUnban = (name?: string) => {
    handleSelect(name);
    setUnbanDialogOpen(true);
  };

  const [isKickDialogOpen, setKickDialogOpen] = useState(false);
  const handleKick = (name?: string) => {
    handleSelect(name);
    setKickDialogOpen(true);
  };

  const [isTeleportDialogOpen, setTeleportDialogOpen] = useState(false);
  const handleTeleport = (name?: string) => {
    handleSelect(name);
    setTeleportDialogOpen(true);
  };

  const handleCheat = (value: boolean, name?: string) => {
    handleSelect(name);
    GodMode(selectedUsers, value);
  };

  const [isCreateHordeDialogOpen, setCreateHordeDialogOpen] = useState(false);
  const handleCreateHorde = (name?: string) => {
    handleSelect(name);
    setCreateHordeDialogOpen(true);
  };

  const [isLightningDialogOpen, setLightningDialogOpen] = useState(false);
  const handleLightning = (name?: string) => {
    handleSelect(name);
    setLightningDialogOpen(true);
  };

  const [isThunderDialogOpen, setThunderDialogOpen] = useState(false);
  const handleThunder = (name?: string) => {
    handleSelect(name);
    setThunderDialogOpen(true);
  };

  const [isAddPlayerToWhitelistDialogOpen, setAddPlayerToWhitelistDialogOpen] = useState(false);

  const [isRemovePlayerFromWhitelistDialogOpen, setRemovePlayerFromWhitelistDialogOpen] = useState(false);
  const handleRemovePlayerFromWhitelist = (name?: string) => {
    handleSelect(name);
    setRemovePlayerFromWhitelistDialogOpen(true);
  };

  const [isAddXpDialogOpen, setAddXpDialogOpen] = useState(false);
  const handleAddXp = (name?: string) => {
    handleSelect(name);
    setAddXpDialogOpen(true);
  };

  const [isAddVehicleDialogOpen, setAddVehicleDialogOpen] = useState(false);
  const handleAddVehicle = (name?: string) => {
    handleSelect(name);
    setAddVehicleDialogOpen(true);
  };

  const [isAddItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const handleAddItem = (name?: string) => {
    handleSelect(name);
    setAddItemDialogOpen(true);
  };

  return (
    <>
      <div className="w-full h-[calc(100vh-5.5rem)] dark:bg-black/20 bg-white/20 p-2">
        <ScrollArea className="h-full w-full overflow-auto">
          <div className="w-[calc(100%-1rem)]">
            <div className="flex mb-2 space-x-2">
              <div className="shrink-0 w-72 space-y-2">
                <Input
                  placeholder="Filter by name..."
                  value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                  onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
                  className="w-full focus-visible:ring-0 focus-visible:ring-offset-0 shrink-0"
                />
                <div className="space-x-2">
                  <Button
                    onClick={() => {
                      setAddPlayerToWhitelistDialogOpen(true);
                    }}
                  >
                    Add Player
                  </Button>
                  <Button
                    onClick={() => {
                      handleRemovePlayerFromWhitelist();
                    }}
                    disabled={!debug && Object.keys(rowSelection).length === 0}
                  >
                    Remove Players
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    handleSetAccessLevel();
                  }}
                  disabled={!debug && Object.keys(rowSelection).length === 0}
                >
                  Set Access Level
                </Button>

                <Button
                  onClick={() => {
                    handleBan();
                  }}
                  disabled={!debug && Object.keys(rowSelection).length === 0}
                >
                  Ban
                </Button>

                <Button
                  onClick={() => {
                    handleUnban();
                  }}
                  disabled={!debug && Object.keys(rowSelection).length === 0}
                >
                  Unban
                </Button>

                <Button
                  onClick={() => {
                    handleKick();
                  }}
                  disabled={
                    !debug &&
                    (Object.keys(rowSelection).length === 0 ||
                      !table
                        .getSelectedRowModel()
                        .rows.map((row) => row.original)
                        .some((player) => player.online))
                  }
                >
                  Kick
                </Button>

                <Button
                  onClick={() => {
                    handleTeleport();
                  }}
                  disabled={
                    !debug &&
                    (Object.keys(rowSelection).length === 0 ||
                      !table
                        .getSelectedRowModel()
                        .rows.map((row) => row.original)
                        .some((player) => player.online))
                  }
                >
                  Teleport
                </Button>

                <Button
                  onClick={() => {
                    handleCreateHorde();
                  }}
                  disabled={
                    !debug &&
                    (Object.keys(rowSelection).length === 0 ||
                      !table
                        .getSelectedRowModel()
                        .rows.map((row) => row.original)
                        .some((player) => player.online))
                  }
                >
                  Create Horde
                </Button>

                <Button
                  onClick={() => {
                    handleLightning();
                  }}
                  disabled={
                    !debug &&
                    (Object.keys(rowSelection).length === 0 ||
                      !table
                        .getSelectedRowModel()
                        .rows.map((row) => row.original)
                        .some((player) => player.online))
                  }
                >
                  Lightning
                </Button>

                <Button
                  onClick={() => {
                    handleThunder();
                  }}
                  disabled={
                    !debug &&
                    (Object.keys(rowSelection).length === 0 ||
                      !table
                        .getSelectedRowModel()
                        .rows.map((row) => row.original)
                        .some((player) => player.online))
                  }
                >
                  Thunder
                </Button>

                <Button
                  onClick={() => {
                    handleAddXp();
                  }}
                  disabled={
                    !debug &&
                    (Object.keys(rowSelection).length === 0 ||
                      !table
                        .getSelectedRowModel()
                        .rows.map((row) => row.original)
                        .some((player) => player.online))
                  }
                >
                  Add XP
                </Button>

                <Button
                  onClick={() => {
                    handleAddItem();
                  }}
                  disabled={
                    !debug &&
                    (Object.keys(rowSelection).length === 0 ||
                      !table
                        .getSelectedRowModel()
                        .rows.map((row) => row.original)
                        .some((player) => player.online))
                  }
                >
                  Add Item
                </Button>

                <Button
                  onClick={() => {
                    handleAddVehicle();
                  }}
                >
                  Add Vehicle
                </Button>
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="dark:hover:backdrop-brightness-105 hover:backdrop-brightness-90"
                    >
                      {headerGroup.headers
                        .filter((header) => header.column.id !== "banned")
                        .map((header) => {
                          return (
                            <TableHead key={header.id} className="p-0">
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                          );
                        })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="dark:hover:backdrop-brightness-105 hover:backdrop-brightness-90"
                      >
                        {row
                          .getVisibleCells()
                          .filter((cell) => cell.column.id !== "banned")
                          .map((cell) => (
                            <TableCell className="py-2" key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  console.log("Opening dialog");
                  setAddPlayerDialogOpen(true);
                }}
                variant="link"
                className="text-sky-600 dark:text-sky-400"
              >
                Missing a player? Add an offline player to the list.
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/*Dialogs*/}
      <BanUserDialog isOpen={isBanDialogOpen} onClose={() => setBanDialogOpen(false)} names={selectedUsers} />
      <SetAccessLevelDialog
        isOpen={isSetAccessLevelDialogOpen}
        onClose={() => setSetAccessLevelDialogOpen(false)}
        names={selectedUsers}
        defaultValue={
          selectedUsers.length === 1
            ? players.find((player) => player.name === selectedUsers[0])?.accessLevel
            : selectedUsers.every(
                (user) =>
                  players.find((player) => player.name === user)?.accessLevel ===
                  players.find((player) => player.name === selectedUsers[0])?.accessLevel
              )
            ? players.find((player) => player.name === selectedUsers[0])?.accessLevel
            : undefined
        }
      />
      <UnbanUserDialog isOpen={isUnbanDialogOpen} onClose={() => setUnbanDialogOpen(false)} names={selectedUsers} />
      <KickUserDialog isOpen={isKickDialogOpen} onClose={() => setKickDialogOpen(false)} names={selectedUsers} />
      <TeleportDialog
        isOpen={isTeleportDialogOpen}
        onClose={() => setTeleportDialogOpen(false)}
        names={selectedUsers}
      />
      <CreateHordeDialog
        isOpen={isCreateHordeDialogOpen}
        onClose={() => setCreateHordeDialogOpen(false)}
        names={selectedUsers}
      />
      <LightningDialog
        isOpen={isLightningDialogOpen}
        onClose={() => setLightningDialogOpen(false)}
        names={selectedUsers}
      />
      <ThunderDialog isOpen={isThunderDialogOpen} onClose={() => setThunderDialogOpen(false)} names={selectedUsers} />
      <AddXpDialog isOpen={isAddXpDialogOpen} onClose={() => setAddXpDialogOpen(false)} names={selectedUsers} />
      <AddVehicleDialog
        isOpen={isAddVehicleDialogOpen}
        onClose={() => setAddVehicleDialogOpen(false)}
        initialNames={selectedUsers}
        initialTab={selectedUsers.length > 0 ? "player" : "coordinates"}
      />
      <AddItemDialog isOpen={isAddItemDialogOpen} onClose={() => setAddItemDialogOpen(false)} names={selectedUsers} />
      <AddPlayerDialog
        isOpen={isAddPlayerDialogOpen}
        onClose={() => {
          setAddPlayerDialogOpen(false);
        }}
      />
      <AddPlayerToWhitelistDialog
        isOpen={isAddPlayerToWhitelistDialogOpen}
        onClose={() => setAddPlayerToWhitelistDialogOpen(false)}
      />
      <RemovePlayerFromWhitelistDialog
        isOpen={isRemovePlayerFromWhitelistDialogOpen}
        onClose={() => setRemovePlayerFromWhitelistDialogOpen(false)}
        names={selectedUsers}
        setRowSelection={setRowSelection}
      />
    </>
  );
}
