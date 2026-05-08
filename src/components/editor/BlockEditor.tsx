"use client";

import React from "react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  GripVertical, 
  Trash2, 
  Type, 
  FileText, 
  Image as ImageIcon, 
  MousePointer2, 
  Minus,
  Plus
} from "lucide-react";
import { Block, BlockType } from "@/types/cms";
import { 
  HeadingBlock, 
  TextBlock, 
  ImageBlock, 
  CtaBlock 
} from "./blocks";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ElementType }[] = [
  { type: "heading", label: "Heading", icon: Type },
  { type: "text", label: "Text Block", icon: FileText },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "cta", label: "Button / CTA", icon: MousePointer2 },
  { type: "divider", label: "Divider", icon: Minus },
];

function SortableBlock({ block, onUpdate, onRemove }: { block: Block; onUpdate: (props: Record<string, unknown>) => void; onRemove: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case "heading": return <HeadingBlock props={block.props} onChange={onUpdate} />;
      case "text": return <TextBlock props={block.props} onChange={onUpdate} />;
      case "image": return <ImageBlock props={block.props} onChange={onUpdate} />;
      case "cta": return <CtaBlock props={block.props} onChange={onUpdate} />;
      case "divider": return <div className="h-px bg-[var(--border)] w-full my-4" />;
      default: return null;
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "group relative bg-[var(--paper)] border rounded-sm transition-all",
        isDragging ? "border-[var(--accent)] shadow-xl scale-[1.02]" : "border-[var(--border)] hover:border-[var(--border-strong)]"
      )}
    >
      <div className="flex items-start gap-2 p-4">
        <button 
          {...attributes} 
          {...listeners}
          className="mt-1 p-1 text-[var(--ink-faint)] cursor-grab active:cursor-grabbing hover:text-[var(--ink)] transition-colors"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
             <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--ink-faint)]">
               {block.type}
             </span>
             <button 
                onClick={onRemove}
                className="opacity-0 group-hover:opacity-100 p-1 text-[var(--ink-faint)] hover:text-[var(--destructive)] transition-all"
             >
               <Trash2 className="w-3.5 h-3.5" />
             </button>
          </div>
          {renderBlockContent()}
        </div>
      </div>
    </div>
  );
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      onChange(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: nanoid(),
      type,
      props: {},
    };
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (id: string, props: Record<string, unknown>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, props } : b));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Canvas */}
      <div className="lg:col-span-3 space-y-4 min-h-[600px] pb-32">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={blocks.map(b => b.id)}
            strategy={verticalListSortingStrategy}
          >
            {blocks.map((block) => (
              <SortableBlock 
                key={block.id} 
                block={block} 
                onUpdate={(props) => updateBlock(block.id, props)}
                onRemove={() => removeBlock(block.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {blocks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-[var(--border)] rounded bg-[var(--canvas)] text-[var(--ink-faint)]">
            <Plus className="w-8 h-8 mb-4 opacity-20" />
            <p className="text-sm font-medium">Add your first block to start building the page.</p>
          </div>
        )}
      </div>

      {/* Palette */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 p-6 bg-[var(--paper)] border border-[var(--border)] rounded space-y-4">
          <h3 className="font-display text-lg font-semibold text-[var(--ink)] mb-4">Add Blocks</h3>
          <div className="space-y-2">
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.type}
                onClick={() => addBlock(bt.type)}
                className="flex items-center gap-3 w-full p-3 bg-[var(--canvas)] border border-transparent rounded hover:border-[var(--accent)] hover:bg-[var(--paper)] transition-all group"
              >
                <div className="w-8 h-8 rounded bg-[var(--paper)] border border-[var(--border)] flex items-center justify-center text-[var(--ink-muted)] group-hover:text-[var(--accent)] group-hover:border-[var(--accent)]">
                  <bt.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] group-hover:text-[var(--ink)]">
                  {bt.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
