import React from 'react';
import { View, Text, Image } from 'react-native';
import type { Language, MaintenanceRequest } from '@/types';
import { photoSource } from '@/lib/api-client';

// Read-only photos of a maintenance ticket: the defect photo from whoever reported it and
// the technician's before/after shots. Renders nothing when there are none.
export function TicketPhotos({ ticket, lang }: { ticket: MaintenanceRequest; lang: Language }) {
  const ru = lang === 'RU';
  const groups = [
    { key: 'defect', label: ru ? 'Поломка' : 'Defect', photos: ticket.photoUrl ? [ticket.photoUrl] : [] },
    { key: 'before', label: ru ? 'До ремонта' : 'Before repair', photos: ticket.photosBefore || [] },
    { key: 'after', label: ru ? 'После ремонта' : 'After repair', photos: ticket.photosAfter || [] },
  ].filter((g) => g.photos.length > 0);
  if (groups.length === 0) return null;

  return (
    <View className="gap-2">
      <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
        {ru ? 'ФОТООТЧЁТ' : 'PHOTO REPORT'}
      </Text>
      <View className="bg-white rounded-[14px] border border-border p-3.5 gap-3">
        {groups.map((g) => (
          <View key={g.key} className="gap-1.5">
            <Text className="text-xs font-jost text-text-secondary">{g.label}</Text>
            <View className="flex-row flex-wrap gap-2">
              {g.photos.map((uri, i) => (
                <Image key={`${uri}-${i}`} source={photoSource(uri)} className="w-24 h-24 rounded-xl border border-border bg-border" />
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
