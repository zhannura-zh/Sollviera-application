import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Design ManagerScreens `actionAlert`: a dark bar at the top of the screen that hides itself
// after 3 s (4 s for exports) and can be closed with ✕.

type ShowToast = (text: string, ms?: number) => void;

const ToastContext = createContext<ShowToast>(() => {});

export const useManagerToast = () => useContext(ToastContext);

export function ManagerToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ShowToast>((next, ms = 3000) => {
    if (timer.current) clearTimeout(timer.current);
    setText(next);
    timer.current = setTimeout(() => setText(null), ms);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      <View className="flex-1">
        {children}
        {text !== null && (
          <View
            pointerEvents="box-none"
            className="absolute left-4 right-4 bg-dark rounded-xl px-4 py-2.5 flex-row items-center justify-between gap-3"
            style={{ top: insets.top + 12, elevation: 8, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}
          >
            <Text className="flex-1 text-xs font-jost text-white">{text}</Text>
            <Pressable onPress={() => setText(null)} hitSlop={10} className="active:opacity-60">
              <Text className="text-xs text-white/60">✕</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ToastContext.Provider>
  );
}
