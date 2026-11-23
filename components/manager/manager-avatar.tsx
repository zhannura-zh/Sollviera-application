import React from 'react';
import { Text, View } from 'react-native';

const initials = (name: string) => name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';

// The design shows a photo, but the API has no employee photo (cleanerProfile.avatarUrl is a mock
// stock image), so the manager's avatar is their initials.
export function ManagerAvatar({ name, size }: { name: string; size: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: 'rgba(229,222,201,0.7)' }}
      className="items-center justify-center border border-border"
    >
      <Text className={`${size >= 52 ? 'text-base' : 'text-xs'} font-jost-medium text-[#5C544D]`}>{initials(name)}</Text>
    </View>
  );
}
