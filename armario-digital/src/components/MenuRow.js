import React from "react";
import { View, TouchableOpacity, Switch, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Text from "./Text";
import { useTheme, useStyles } from "../theme";

// Fila de menú con icono, título, subtítulo y flecha
export function MenuRow({ icon, label, sub, onPress, last, badge }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <TouchableOpacity onPress={onPress} style={[styles.row, !last && styles.border]}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={16} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {!!sub && <Text style={styles.sub}>{sub}</Text>}
      </View>
      {!!badge && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
      <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
    </TouchableOpacity>
  );
}

// Fila con interruptor
export function SwitchRow({ label, sub, value, onChange, last }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <View style={[styles.row, !last && styles.border]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {!!sub && <Text style={styles.sub}>{sub}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.line, true: colors.accent }} thumbColor="#FFFFFF" />
    </View>
  );
}

// Tarjeta que agrupa filas
export function Card({ children, style }) {
  const styles = useStyles(createStyles);
  return <View style={[styles.card, style]}>{children}</View>;
}

const createStyles = (c) => StyleSheet.create({
  card: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 14, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  border: { borderBottomWidth: 1, borderBottomColor: c.line },
  iconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: c.accentSofter, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 14.5, fontWeight: "500", color: c.ink },
  sub: { fontSize: 12, color: c.inkSoft, marginTop: 1 },
  badge: { minWidth: 20, height: 20, borderRadius: 999, backgroundColor: "#E53950", alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
});
