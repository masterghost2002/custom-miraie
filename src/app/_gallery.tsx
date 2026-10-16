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
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { ThemeProvider, useTheme } from '@/theme/theme-provider';
import { type ThemeName } from '@/theme/tokens';
import { AcDisplay, type DisplayFan, type DisplayPreset } from '@/ui/ac-display';
import { AcUnit } from '@/ui/ac-unit';
import { AcUnitTile } from '@/ui/ac-unit-tile';
import { AirParticles, PARTICLE_MS, type ParticleCurve } from '@/ui/air-particles';
import { Chip } from '@/ui/chip';
import { FanIcon } from '@/ui/fan-icon';
import { Glass } from '@/ui/glass';
import { IconButton } from '@/ui/icon-button';
import { ModeButton } from '@/ui/mode-button';
import { type AcModeName } from '@/ui/mode-icon';
import { PowerButton } from '@/ui/power-button';
import { PowerPill } from '@/ui/power-pill';
import { PrimaryButton } from '@/ui/primary-button';
import { Screen } from '@/ui/screen';
import { SegmentedPill } from '@/ui/segmented-pill';
import { TabBar } from '@/ui/tab-bar';
import { Text, type TextVariant } from '@/ui/text';
import { Toggle } from '@/ui/toggle';

// Dev-only labels; real screens take their words from their feature's copy.ts.
const TABS = [
  { key: 'index', label: 'Home', icon: House },
  { key: 'devices', label: 'All devices', icon: LayoutGrid },
  { key: 'schedules', label: 'Schedules', icon: Clock },
  { key: 'settings', label: 'Settings', icon: Settings },
];
const MODES: { mode: AcModeName; label: string }[] = [
  { mode: 'cool', label: 'Cool' },
  { mode: 'dry', label: 'Dry' },
  { mode: 'fan', label: 'Fan only' },
  { mode: 'heat', label: 'Heat' },
  { mode: 'auto', label: 'Auto' },
];
const FANS = [
  { value: 'auto', label: 'Auto' },
  { value: 'quiet', label: 'Quiet' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Med', accessibilityLabel: 'Medium' },
  { value: 'high', label: 'High' },
] as const;
const PRESETS = [
  { value: 'none', label: 'None' },
  { value: 'eco', label: 'Eco' },
  { value: 'boost', label: 'Powerchill' },
] as const;
const VARIANTS: TextVariant[] = [
  'reading',
  'reading-sm',
  'degree',
  'degree-sm',
  'hero',
  'title',
  'header',
  'card',
  'body',
  'intro',
  'chip',
  'support',
  'caption',
  'note',
  'micro',
];
const HOME_AIR: ParticleCurve[] = [
  { path: [30, 0, 30, 25, 22, 50, 14, 70], delays: [-0.3, -1.5] },
  { path: [75, 0, 75, 25, 75, 50, 75, 70], delays: [-0.9, -2.1] },
  { path: [120, 0, 120, 25, 128, 50, 136, 70], delays: [-0.6, -1.8] },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Glass className="mt-3 gap-3 rounded-card p-4">
      <Text variant="card">{title}</Text>
      {children}
    </Glass>
  );
}

function Gallery({ theme, setTheme }: { theme: ThemeName; setTheme: (t: ThemeName) => void }) {
  const { tokens } = useTheme();
  const [on, setOn] = useState(true);
  const [room, setRoom] = useState('Bedroom');
  const [eco, setEco] = useState(true);
  const [fan, setFan] = useState<DisplayFan>('auto');
  const [preset, setPreset] = useState<DisplayPreset>('eco');
  const [swing, setSwing] = useState(3);
  const [mode, setMode] = useState<AcModeName>('cool');
  const [tab, setTab] = useState('index');

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
        {VARIANTS.map((v) => (
          <Text key={v} variant={v}>
            {v.startsWith('reading') || v.startsWith('degree') ? '24' : v}
          </Text>
        ))}
        <Text variant="support" tone="muted">
          muted
        </Text>
      </Section>

      <Section title="Buttons">
        <View className="flex-row flex-wrap items-center gap-2.5">
          <IconButton icon={ArrowLeft} accessibilityLabel="Back" />
          <IconButton icon={Ellipsis} accessibilityLabel="More options" />
          <IconButton icon={Minus} iconSize={18} accessibilityLabel="Lower temperature" />
          <IconButton icon={Plus} iconSize={18} accessibilityLabel="Raise temperature" disabled />
          <IconButton
            icon={Snowflake}
            variant="pill"
            size={40}
            iconSize={16}
            accessibilityLabel="Pill"
          />
        </View>
        <View className="flex-row items-center gap-2.5">
          <PowerButton on={on} onPress={() => setOn(!on)} accessibilityLabel="Power 44" />
          <PowerButton on={on} size={48} onPress={() => setOn(!on)} accessibilityLabel="Power 48" />
          <PowerButton on={false} disabled onPress={() => {}} accessibilityLabel="Offline" />
        </View>
        <PrimaryButton label="Turn everything off" icon={Power} />
        <PrimaryButton label="Turn everything off" icon={Power} disabled />
        <PrimaryButton label="Signing in…" busy />
      </Section>

      <Section title="Chips">
        <View className="flex-row flex-wrap gap-2">
          {['Bedroom', 'Living room', 'Study'].map((r) => (
            <Chip key={r} label={r} selected={room === r} onPress={() => setRoom(r)} />
          ))}
        </View>
        <View className="flex-row gap-2">
          <Chip label="Cool" variant="pill" />
          <Chip label="Cool" variant="header" icon={Snowflake} />
        </View>
      </Section>

      <Section title="Controls">
        <View className="flex-row items-center gap-3">
          <Toggle value={eco} onChange={setEco} accessibilityLabel="Eco" />
          <Toggle value={false} disabled onChange={() => {}} accessibilityLabel="Disabled" />
        </View>
        <View className="flex-row items-center gap-3">
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
          options={FANS}
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
        <SegmentedPill
          accessibilityLabel="Preset"
          value={preset}
          onChange={setPreset}
          options={PRESETS}
        />
        <View className="flex-row gap-2.5">
          {MODES.map((m) => (
            <ModeButton
              key={m.mode}
              mode={m.mode}
              label={m.label}
              selected={mode === m.mode}
              onPress={() => setMode(m.mode)}
            />
          ))}
        </View>
      </Section>

      <Section title="AC unit">
        <AcUnit
          size="lg"
          on={on}
          display={<AcDisplay size="lg" on={on} mode={mode} temp={24} fan={fan} preset={preset} />}
        />
        <AcUnit size="md" on={on} display={<AcDisplay size="md" on={on} mode={mode} temp={24} />} />
        <View className="h-30 flex-row gap-4">
          <View>
            <AcUnit
              size="sm"
              on={on}
              display={<AcDisplay size="sm" on={on} mode={mode} temp={25} />}
            />
            <View className="h-17">
              <AirParticles
                boardWidth={150}
                boardHeight={70}
                durationMs={PARTICLE_MS[fan]}
                dotSize={4}
                fadeIn={0.12}
                fadeOut={0.75}
                visible={on}
                curves={HOME_AIR}
              />
            </View>
          </View>
          <AcUnit size="xs" on={on} />
        </View>
        <View className="flex-row items-center gap-4">
          <AcUnitTile on={on} />
          <AcUnitTile on={false} />
          <AcUnit size="side" />
          <AcUnit size="top" />
          <FanIcon spinning={on} speed={fan} color={tokens.ink} />
        </View>
      </Section>

      <View className="h-30" />
      <TabBar items={TABS} current={tab} onSelect={setTab} />
    </Screen>
  );
}

export default function GalleryRoute() {
  const [theme, setTheme] = useState<ThemeName>('dark');
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <ThemeProvider name={theme}>
      <Gallery theme={theme} setTheme={setTheme} />
    </ThemeProvider>
  );
}
