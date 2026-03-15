import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { COLLEGES } from "@/lib/colleges";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface CollegeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CollegeSelector({ value, onChange }: CollegeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      COLLEGES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.short.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const selectedCollege = COLLEGES.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal text-left h-10"
        >
          <span className="truncate">
            {selectedCollege ? selectedCollege.short : "Select your college"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search colleges..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3 text-center">No college found.</p>
          ) : (
            filtered.map((college) => (
              <button
                key={college.id}
                onClick={() => {
                  onChange(college.id);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2 hover:bg-muted transition-colors",
                  value === college.id && "bg-primary/10 text-primary"
                )}
              >
                <Check
                  className={cn("h-4 w-4 shrink-0", value === college.id ? "opacity-100" : "opacity-0")}
                />
                <div className="min-w-0">
                  <p className="font-medium truncate">{college.short}</p>
                  <p className="text-xs text-muted-foreground truncate">{college.name}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
