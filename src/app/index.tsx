// Design: Chill canvas › Main.dc.html — placeholder until CHILL-004 (Home) is built.
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomePlaceholder() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 px-5 pt-5">
        <Text className="font-regular text-support text-muted">Thu, 16 October</Text>
        <Text className="font-bold text-title text-ink">Good evening</Text>

        <View className="mt-6 rounded-panel border border-glass-line bg-glass p-5">
          <Text className="font-semibold text-header text-ink">Bedroom</Text>
          <Text className="font-regular text-support text-muted">Air conditioner · Cooling</Text>
          <View className="mt-4 flex-row items-start">
            <Text className="font-light text-reading-sm text-ink">24</Text>
            <Text className="font-light text-degree-sm text-ink">°</Text>
          </View>
          <View className="mt-4 h-13 w-30 flex-row items-center justify-end rounded-full bg-pill p-1">
            <View className="h-11 w-11 rounded-full bg-accent" />
          </View>
        </View>

        <Text className="mt-6 font-regular text-caption text-muted">
          Foundation only — screens come next (specs CHILL-003…009).
        </Text>
      </View>
    </SafeAreaView>
  );
}
