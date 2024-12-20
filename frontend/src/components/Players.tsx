// @ts-nocheck
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
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
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
  DropdownMenuLabel,
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

export function PlayersTab() {
  const { players } = useRcon();

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
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold select-none ${
                online ? "bg-success" : "bg-destructive"
              }`}
            >
              {online ? "Online" : "Offline"}
            </span>

            {banned ? (
              <span className="px-2 py-1 rounded-full text-xs font-semibold select-none bg-warning text-warning-foreground">
                Banned
              </span>
            ) : (
              ""
            )}
          </div>
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
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {!player.banned && <DropdownMenuItem onClick={() => handleBan(player.name)}>Ban</DropdownMenuItem>}
                {player.banned && <DropdownMenuItem onClick={() => handleUnban(player.name)}>Unban</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => handleKick(player.name)}>Kick</DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Teleport</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => handleTeleportToPlayer(player.name)}>
                          To Player
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTeleportPlayerToCoords(player.name)}>
                          To Coordinates
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Control</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => handleGodMode(player.name)}>God Mode</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleInvisible(player.name)}>Invisible</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNoClip(player.name)}>No Clip</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Events</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => handleCreateHorde(player.name)}>Create Horde</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChopperEvent(player.name)}>Helicopter</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleGunshotEvent(player.name)}>Gunshot</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleLightning(player.name)}>Lightning</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleThunder(player.name)}>Thunder</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
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

  const [isBanDialogOpen, setBanDialogOpen] = useState(false);
  const handleBan = (name?: string) => {
    handleSelect(name);
    setBanDialogOpen(true);
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
  const handleTeleportToPlayer = (name?: string) => {
    handleSelect(name);
    setTeleportDialogOpen(true);
  };

  const handleTeleportPlayerToCoords = (name?: string) => {
    handleSelect(name);
    // Open a dialog for inputting coordinates if needed
  };

  const [isGodModeDialogOpen, setGodModeDialogOpen] = useState(false);
  const handleGodMode = (name?: string) => {
    handleSelect(name);
    setGodModeDialogOpen(true);
  };

  const [isInvisibleDialogOpen, setInvisibleDialogOpen] = useState(false);
  const handleInvisible = (name?: string) => {
    handleSelect(name);
    setInvisibleDialogOpen(true);
  };

  const [isNoClipDialogOpen, setNoClipDialogOpen] = useState(false);
  const handleNoClip = (name?: string) => {
    handleSelect(name);
    setNoClipDialogOpen(true);
  };

  const handleCreateHorde = (name?: string) => {
    handleSelect(name);
    // Trigger a dialog or direct action for creating a horde
  };

  const handleChopperEvent = (name?: string) => {
    handleSelect(name);
    // Trigger a chopper event for the selected user(s)
  };

  const handleGunshotEvent = (name?: string) => {
    handleSelect(name);
    // Trigger a gunshot event for the selected user(s)
  };

  const handleLightning = (name?: string) => {
    handleSelect(name);
    // Trigger a lightning event for the selected user(s)
  };

  const handleThunder = (name?: string) => {
    handleSelect(name);
    // Trigger a thunder event for the selected user(s)
  };

  return (
    <>
      <div className="w-full h-[calc(100vh-5.5rem)] dark:bg-black/20 bg-white/20 p-2">
        <ScrollArea className="h-full w-full overflow-auto">
          <div className="w-[calc(100%-1rem)]">
            <div className="flex items-center mb-2 space-x-2">
              <Input
                placeholder="Filter by name..."
                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
                className="max-w-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                onClick={() => {
                  handleBan();
                }}
                disabled={Object.keys(rowSelection).length === 0}
              >
                Ban Selected
              </Button>

              <Button
                onClick={() => {
                  handleUnban();
                }}
                disabled={Object.keys(rowSelection).length === 0}
              >
                Unban Selected
              </Button>
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
            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
                selected.
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      <BanUserDialog isOpen={isBanDialogOpen} onClose={() => setBanDialogOpen(false)} names={selectedUsers} />
      <UnbanUserDialog isOpen={isUnbanDialogOpen} onClose={() => setUnbanDialogOpen(false)} names={selectedUsers} />
    </>
  );
}
