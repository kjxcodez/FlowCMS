"use client";

import React, { useState } from "react";
import { 
  Trash2, 
  Settings2, 
  Type, 
  FileText, 
  Image as ImageIcon, 
  Hash, 
  Calendar, 
  CheckSquare, 
  Link as LinkIcon,
  Plus
} from "lucide-react";
import { FieldDefinition, FieldType } from "@/types/cms";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface FieldBuilderProps {
  fields: FieldDefinition[];
  onChange: (fields: FieldDefinition[]) => void;
}

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ElementType }[] = [
  { type: "text", label: "Short Text", icon: Type },
  { type: "richtext", label: "Rich Text", icon: FileText },
  { type: "media", label: "Media", icon: ImageIcon },
  { type: "number", label: "Number", icon: Hash },
  { type: "date", label: "Date", icon: Calendar },
  { type: "boolean", label: "Boolean", icon: CheckSquare },
  { type: "reference", label: "Reference", icon: LinkIcon },
];

export function FieldBuilder({ fields, onChange }: FieldBuilderProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addField = (type: FieldType) => {
    const newField: FieldDefinition = {
      id: nanoid(),
      type,
      name: `New ${type}`,
      slug: `new-${type}-${nanoid(4)}`,
      required: false,
      multiple: false,
    };
    onChange([...fields, newField]);
    setEditingId(newField.id);
  };

  const updateField = (id: string, updates: Partial<FieldDefinition>) => {
    onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    onChange(fields.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {FIELD_TYPES.map((ft) => (
          <button
            key={ft.type}
            type="button"
            onClick={() => addField(ft.type)}
            className="flex items-center gap-3 p-3 bg-paper border border-border rounded-md hover:border-accent transition-all group cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded bg-canvas flex items-center justify-center text-ink-muted group-hover:text-accent">
              <ft.icon className="size-4" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink">
              {ft.label}
            </span>
            <Plus className="size-3.5 ml-auto text-ink-faint group-hover:text-accent" />
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {fields.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg text-ink-faint bg-black/2">
            <p className="text-sm">Select a field type above to start building your schema.</p>
          </div>
        )}

        {fields.map((field, index) => (
          <div 
            key={field.id}
            className={cn(
              "p-4 bg-paper border rounded-md transition-all",
              editingId === field.id ? "border-accent ring-1 ring-accent/20 shadow-sm" : "border-border"
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <span className="font-mono text-[10px] text-ink-faint shrink-0">{String(index + 1).padStart(2, '0')}</span>
                <div className="w-8 h-8 rounded bg-canvas flex items-center justify-center text-accent shrink-0">
                  {FIELD_TYPES.find(ft => ft.type === field.type)?.icon && 
                    React.createElement(FIELD_TYPES.find(ft => ft.type === field.type)!.icon, { className: "size-4" })}
                </div>
                
                {editingId === field.id ? (
                  <div className="flex items-center gap-4 flex-1">
                    <Input 
                      value={field.name}
                      onChange={(e) => updateField(field.id, { name: e.target.value })}
                      className="h-8 py-1 text-sm font-semibold border-none border-b border-border-strong rounded-none shadow-none focus-visible:ring-0 focus-visible:border-accent transition-colors w-1/3"
                      placeholder="Field Label"
                      autoFocus
                    />
                    <Input 
                      value={field.slug}
                      onChange={(e) => updateField(field.id, { slug: e.target.value })}
                      className="h-8 font-mono text-[11px] border-none border-b border-border-strong rounded-none shadow-none focus-visible:ring-0 focus-visible:border-accent transition-colors w-1/3"
                      placeholder="field_slug"
                    />
                  </div>
                ) : (
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink leading-tight">{field.name}</p>
                    <p className="font-mono text-[10px] text-ink-muted uppercase tracking-wider mt-0.5">{field.slug} • {field.type}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Button 
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditingId(editingId === field.id ? null : field.id)}
                  className={cn(
                    "transition-colors",
                    editingId === field.id ? "text-accent bg-accent/5" : "text-ink-muted"
                  )}
                >
                  <Settings2 className="size-4" />
                </Button>
                <Button 
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeField(field.id)}
                  className="text-ink-muted hover:text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {editingId === field.id && (
              <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted">Required Field</Label>
                    <Switch 
                      checked={field.required}
                      onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted">List / Multiple</Label>
                    <Switch 
                      checked={field.multiple}
                      onCheckedChange={(checked) => updateField(field.id, { multiple: checked })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted">Help Text</Label>
                   <Textarea 
                    className="w-full bg-canvas border-border p-2.5 text-xs text-ink min-h-[60px]"
                    placeholder="Describe this field for editors..."
                    rows={2}
                   />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
