import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TopicFiltersProps {
  filterType: 'recent' | 'likes' | 'comments';
  onFilterTypeChange: (type: 'recent' | 'likes' | 'comments') => void;
  likesRange: { min: number; max: number };
  onLikesRangeChange: (range: { min: number; max: number }) => void;
  commentsRange: { min: number; max: number };
  onCommentsRangeChange: (range: { min: number; max: number }) => void;
}

export default function TopicFilters({
  filterType,
  onFilterTypeChange,
  likesRange,
  onLikesRangeChange,
  commentsRange,
  onCommentsRangeChange,
}: TopicFiltersProps) {
  const [tempLikesRange, setTempLikesRange] = useState(likesRange);
  const [tempCommentsRange, setTempCommentsRange] = useState(commentsRange);

  const handleLikesRangeApply = () => {
    onLikesRangeChange(tempLikesRange);
  };

  const handleCommentsRangeApply = () => {
    onCommentsRangeChange(tempCommentsRange);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium text-gray-600">Ordenar por:</Label>
        <Select value={filterType} onValueChange={onFilterTypeChange}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="likes">Mais likes</SelectItem>
            <SelectItem value="comments">Mais comentários</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filterType === 'likes' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              {likesRange.min} - {likesRange.max} likes
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Filtrar por likes</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Mínimo</Label>
                    <Input
                      type="number"
                      value={tempLikesRange.min}
                      onChange={(e) =>
                        setTempLikesRange({
                          ...tempLikesRange,
                          min: parseInt(e.target.value) || 0,
                        })
                      }
                      className="h-8"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Máximo</Label>
                    <Input
                      type="number"
                      value={tempLikesRange.max}
                      onChange={(e) =>
                        setTempLikesRange({
                          ...tempLikesRange,
                          max: parseInt(e.target.value) || 1000,
                        })
                      }
                      className="h-8"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleLikesRangeApply} className="w-full h-8">
                Aplicar filtro
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {filterType === 'comments' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              {commentsRange.min} - {commentsRange.max} comentários
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Filtrar por comentários</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Mínimo</Label>
                    <Input
                      type="number"
                      value={tempCommentsRange.min}
                      onChange={(e) =>
                        setTempCommentsRange({
                          ...tempCommentsRange,
                          min: parseInt(e.target.value) || 0,
                        })
                      }
                      className="h-8"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Máximo</Label>
                    <Input
                      type="number"
                      value={tempCommentsRange.max}
                      onChange={(e) =>
                        setTempCommentsRange({
                          ...tempCommentsRange,
                          max: parseInt(e.target.value) || 100,
                        })
                      }
                      className="h-8"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleCommentsRangeApply} className="w-full h-8">
                Aplicar filtro
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
