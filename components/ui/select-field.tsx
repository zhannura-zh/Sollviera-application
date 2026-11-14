import React, { useRef, useState } from 'react';
import { Modal, Pressable, Text, View, FlatList, Dimensions } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface SelectFieldProps<T extends string | number> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  // 'soft': the beige full-width field used inside filter panels (web design's <select>).
  variant?: 'pill' | 'soft';
}

interface Anchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Lightweight native replacement for a web <select>: a pill trigger that opens
// a small dropdown menu anchored directly below it (not a full bottom sheet).
export function SelectField<T extends string | number>({
  value,
  options,
  onChange,
  className,
  variant = 'pill',
}: SelectFieldProps<T>) {
  const soft = variant === 'soft';
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const current = options.find((o) => o.value === value);
  const open = anchor !== null;

  const openDropdown = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
    });
  };

  const close = () => setAnchor(null);

  // Keep the dropdown on-screen: flip above the trigger if there isn't
  // room below, and clamp its width/position within the viewport.
  const screen = Dimensions.get('window');
  const dropdownWidth = Math.max(anchor?.width ?? 0, 160);
  const estimatedHeight = Math.min(options.length * 44 + 8, 280);
  const spaceBelow = anchor ? screen.height - (anchor.y + anchor.height) : 0;
  const openUpward = anchor ? spaceBelow < estimatedHeight && anchor.y > estimatedHeight : false;
  const left = anchor ? Math.min(anchor.x, screen.width - dropdownWidth - 8) : 0;
  const top = anchor ? (openUpward ? anchor.y - estimatedHeight - 6 : anchor.y + anchor.height + 6) : 0;

  return (
    <>
      <View ref={triggerRef} collapsable={false} className={className}>
        <Pressable
          onPress={openDropdown}
          className={`flex-row items-center justify-between gap-1 border border-border active:opacity-70 ${
            soft ? 'bg-background px-3 py-2.5 rounded-[12px]' : 'bg-white px-2.5 py-2 rounded-xl'
          }`}
        >
          <Text className={`flex-shrink text-text-primary font-jost ${soft ? 'text-[12px]' : 'text-[13px]'}`} numberOfLines={1}>
            {current?.label ?? ''}
          </Text>
          <ChevronDown size={14} color={soft ? '#241E1A' : '#8A8177'} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable className="flex-1" onPress={close}>
          {anchor && (
            <View
              className="absolute bg-white rounded-xl border border-border shadow-lg overflow-hidden"
              style={{ left, top, width: dropdownWidth, maxHeight: estimatedHeight }}
            >
              <FlatList
                data={options}
                keyExtractor={(item) => String(item.value)}
                renderItem={({ item, index }) => (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      close();
                    }}
                    className={`px-3.5 py-2.5 active:bg-background ${
                      index < options.length - 1 ? 'border-b border-border-light' : ''
                    } ${item.value === value ? 'bg-background-subtle' : ''}`}
                  >
                    <Text
                      className={`text-sm font-jost ${item.value === value ? 'text-primary font-jost-semibold' : 'text-text-primary'}`}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          )}
        </Pressable>
      </Modal>
    </>
  );
}
