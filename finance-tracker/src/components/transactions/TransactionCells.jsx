import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";

export function EditableCell({ value, type = "text", onSave, className }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { setTempValue(value); }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (tempValue !== value) onSave(tempValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  const displayValue = type === 'number' && !isNaN(parseFloat(value))
    ? parseFloat(value).toFixed(2)
    : value;

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`h-8 w-full bg-background ${className}`} 
      />
    );
  }

  return (
    <div className={`cursor-pointer hover:bg-muted p-1 rounded min-h-[24px] flex items-center transition-colors ${className}`} onClick={() => setIsEditing(true)}>
      {type === 'number' && '$'}{displayValue}
    </div>
  );
}

export function DateCell({ value, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const dateStr = value ? new Date(value).toISOString().split('T')[0] : '';
  const displayStr = value ? new Date(value).toLocaleDateString() : '-';

  const handleChange = (e) => {
    onSave(e.target.value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Input type="date" defaultValue={dateStr} onBlur={() => setIsEditing(false)} onChange={handleChange} autoFocus className="h-8 w-[140px] bg-background" />
    );
  }

  return (
    <div className="cursor-pointer hover:bg-muted p-1 rounded text-muted-foreground font-medium transition-colors" onClick={() => setIsEditing(true)}>
      {displayStr}
    </div>
  );
}