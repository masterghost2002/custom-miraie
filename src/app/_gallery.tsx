// Design: design/boards/Style.dc.html — dev-only gallery of every primitive in every state (CHILL-003)
import { Redirect } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  Ellipsis,
  House,
  LayoutGrid,
  Minus,
  Plus,
  Power,
  Settings,
  Snowflake,
} from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { ThemeProvider, useTheme } from '@/theme/theme-provider';
import { AcDisplay } from '@/ui/ac-display';
import { AcUnit } from '@/ui/ac-unit';
import { AcUnitTile } from '@/ui/ac-unit-tile';
import { AirParticles } from '@/ui/air-particles';
import { Chip } from '@/ui/chip';
import { FanIcon } from '@/ui/fan-icon';
import { Glass } from '@/ui/glass';
import { ModeButton } from '@/ui/mode-button';
import { PowerPill } from '@/ui/power-pill';
import { SegmentedPill } from '@/ui/segmented-pill';
import { Toggle } from '@/ui/toggle';
import { IconButton } from '@/ui/icon-button';
import { PowerButton } from '@/ui/power-button';
import { PrimaryButton } from '@/ui/primary-button';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';

const tabs = [
  { key: 'index', label: 'Home', icon: House },
  { key: 'devices', label: 'All devices', icon: LayoutGrid },
  { key: 'schedules', label: 'Schedules', icon: Clock },
  { key: 'settings', label: 'Settings', icon: Settings },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Glass className="mt-3 gap-3 rounded-card p-4">
      <Text variant="card">{title}</Text>
      {children}
    </Glass>
  );
}

function Gallery({
  theme,
  setTheme,
}: {
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
}) {
  const { tokens } = useTheme();
  const [on, setOn] = useState(true);
  const [room, setRoom] = useState('Bedroom');
  const [eco, setEco] = useState(true);
  const [fan, setFan] = useState<string>('auto');
  const [swing, setSwing] = useState(3);
  const [mode, setMode] = useState<'cool' | 'dry' | 'fan' | 'heat' | 'auto'>('cool');
  return (
    <Screen variant="detail" scroll>
      <Text variant="title">Gallery</Text>
      <Text variant="support" tone="muted">
        Every primitive in every state
      </Text>
      <View className="mt-3">
        <SegmentedPill
          accessibilityLabel="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
          ]}
        />
      </View>
      <Section title="Type">
        <View className="flex-row items-start">
          <Text variant="reading">24</Text>
          <Text variant="degree" className="mt-2.5">
            °
          </Text>
        </View>
        <Text variant="title">Good evening</Text>
        <Text variant="card">Fan speed</Text>
        <Text variant="support" tone="muted">
          Cooling to 24°
        </Text>
      </Section>
      <Section title="Buttons">
        <View className="flex-row flex-wrap items-center gap-2.5">
          <IconButton icon={ArrowLeft} accessibilityLabel="Back" />
          <IconButton icon={Ellipsis} accessibilityLabel="More options" />
          <IconButton icon={Minus} iconSize={18} accessibilityLabel="Lower" />
          <IconButton icon={Plus} iconSize={18} accessibilityLabel="Raise" disabled />
          <IconButton
            icon={Snowflake}
            variant="pill"
            size={40}
            iconSize={16}
            accessibilityLabel="Pill"
          />
          <PowerButton on={on} onPress={() => setOn(!on)} accessibilityLabel="Power on" />
          <PowerButton on={false} onPress={() => {}} size={48} accessibilityLabel="Power off" />
          <PowerButton on={false} disabled onPress={() => {}} accessibilityLabel="Offline" />
        </View>
        <PrimaryButton label="Turn everything off" icon={Power} />
        <PrimaryButton label="Turn everything off" icon={Power} disabled />
      </Section>
      <Section title="Chips">
        <View className="flex-row flex-wrap gap-2">
          {['Bedroom', 'Living room', 'Study'].map((r) => (
            <Chip key={r} label={r} selected={room === r} onPress={() => setRoom(r)} />
          ))}
        </View>
        <View className="flex-row gap-2">
          <Chip label="Cool" variant="pill" />
          <Chip label="Cool" variant="header" icon={<Snowflake size={16} strokeWidth={2} />} />
        </View>
      </Section>
      <Section title="Controls">
        <View className="flex-row items-center gap-3">
          <Toggle value={eco} onChange={setEco} accessibilityLabel="Eco" />
          <Toggle value={false} onChange={() => {}} accessibilityLabel="Off" />
          <PowerPill
            on={on}
            onChange={setOn}
            accessibilityLabel="Bedroom power"
            onLabel="On"
            offLabel="Off"
          />
          <PowerPill
            on={false}
            disabled
            onChange={() => {}}
            accessibilityLabel="Study power"
            onLabel="On"
            offLabel="Off"
          />
        </View>
        <PowerPill
          fill
          on={on}
          onChange={setOn}
          accessibilityLabel="Power"
          onLabel="On"
          offLabel="Off"
        />
        <SegmentedPill
          accessibilityLabel="Fan speed"
          value={fan}
          onChange={setFan}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'quiet', label: 'Quiet' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Med', accessibilityLabel: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
        />
        <SegmentedPill
          accessibilityLabel="Up-down position"
          value={swing}
          onChange={setSwing}
          options={[0, 1, 2, 3, 4, 5].map((v) => ({
            value: v,
            label: v === 0 ? 'Auto' : String(v),
          }))}
        />
        <View className="flex-row gap-2.5">
          {(['cool', 'dry', 'fan', 'heat', 'auto'] as const).map((m) => (
            <ModeButton
              key={m}
              mode={m}
              label={m}
              selected={mode === m}
              onPress={() => setMode(m)}
            />
          ))}
        </View>
      </Section>
      <Section title="AC unit">
        <AcUnit
          size="lg"
          width={310}
          on={on}
          display={
            <AcDisplay
              size="lg"
              on={on}
              mode={mode}
              temp={24}
              fan={fan as 'auto'}
              preset={eco ? 'eco' : 'none'}
            />
          }
        />
        <View className="mt-4 flex-row items-end gap-4">
          <AcUnit
            size="md"
            on={on}
            display={<AcDisplay size="md" on={on} mode="cool" temp={24} />}
          />
        </View>
        <View className="h-30">
          <View style={{ position: 'absolute', left: 0, top: 0 }}>
            <AcUnit
              size="sm"
              on={on}
              display={<AcDisplay size="sm" on={on} mode="dry" temp={25} />}
            />
          </View>
          <View style={{ position: 'absolute', left: 0, top: 46, width: 150, height: 70 }}>
            <AirParticles
              boardWidth={150}
              boardHeight={70}
              durationMs={2400}
              dotSize={4}
              fadeIn={0.12}
              fadeOut={0.75}
              visible={on}
              curves={[
                { path: [30, 0, 30, 25, 22, 50, 14, 70], delays: [-0.3, -1.5] },
                { path: [75, 0, 75, 25, 75, 50, 75, 70], delays: [-0.9, -2.1] },
                { path: [120, 0, 120, 25, 128, 50, 136, 70], delays: [-0.6, -1.8] },
              ]}
            />
          </View>
          <View style={{ position: 'absolute', left: 180, top: 0 }}>
            <AcUnit size="xs" />
          </View>
        </View>
        <View className="flex-row items-center gap-4">
          <AcUnitTile on={on} />
          <AcUnitTile on={false} />
          <AcUnit size="side" />
          <AcUnit size="top" />
          <FanIcon spinning={on} speed={fan as 'auto'} color={tokens.ink} />
        </View>
      </Section>
      <Text variant="micro" tone="muted" className="mt-3">
        {tabs.length} tabs
      </Text>
    </Screen>
  );
}

export default function GalleryRoute() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <ThemeProvider name={theme}>
      <Gallery theme={theme} setTheme={setTheme} />
    </ThemeProvider>
  );
}
