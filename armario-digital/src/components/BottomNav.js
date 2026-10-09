import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, useStyles } from "../theme";

const ITEMS = [
  { id: "inicio", icon: "home" },
  { id: "armario", icon: "shirt" },
  { id: "crear", icon: "sparkles" },
  { id: "conjuntos", icon: "grid" },
  { id: "perfil", icon: "person" },
];

export default function BottomNav({ screen, onNav, compact }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  // Pegada al borde inferior, justo por encima del indicador de inicio del iPhone
  const bottom = Math.max(insets.bottom - 16, 8);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <View style={[styles.pill, compact && { transform: [{ scale: 0.86 }] }]}>
        {ITEMS.map(({ id, icon }) => {
          const active = screen === id;
          return (
            <TouchableOpacity key={id} onPress={() => onNav(id)} style={styles.item}>
              <View style={[styles.iconWrap, active && { backgroundColor: colors.bg }]}>
                <Ionicons name={active ? icon : `${icon}-outline`} size={20} color={active ? colors.ink : colors.inkFaint} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (c) => StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  pill: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: c.surface, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 10,
    shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  item: { marginHorizontal: 2 },
  iconWrap: { width: 46, height: 36, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
