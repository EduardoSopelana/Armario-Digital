import React from "react";
import { View, TouchableOpacity, StyleSheet, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Text from "./Text";
import { useTheme, useStyles } from "../theme";

export function Pill({ active, onPress, children, style }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, marginRight: 8,
          backgroundColor: active ? colors.accent : colors.surface,
          borderColor: active ? "transparent" : colors.line,
        },
        style,
      ]}
    >
      <Text style={{ color: active ? colors.onAccent : colors.inkSoft, fontSize: 13, fontWeight: "500" }}>{children}</Text>
    </TouchableOpacity>
  );
}

export function PrimaryButton({ onPress, children, disabled, style, icon }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      style={[
        {
          width: "100%", paddingVertical: 14, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center",
          backgroundColor: disabled ? colors.inkFaint : colors.accent,
        },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={17} color={colors.onAccent} style={{ marginRight: 8 }} />}
      <Text style={{ color: colors.onAccent, fontSize: 15, fontWeight: "500" }}>{children}</Text>
    </TouchableOpacity>
  );
}

export function GhostButton({ onPress, children, style, textStyle, icon, iconColor }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.line,
          backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", justifyContent: "center",
        },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={16} color={iconColor || colors.ink} style={{ marginRight: 8 }} />}
      <Text style={[{ color: colors.ink, fontSize: 15, fontWeight: "500" }, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}

export function FieldLabel({ children }) {
  const { colors } = useTheme();
  return <Text style={{ fontSize: 12.5, fontWeight: "500", color: colors.inkSoft, marginBottom: 8 }}>{children}</Text>;
}

export function EmptyState({ text, cta, onPress, icon = "shirt-outline" }) {
  const { colors } = useTheme();
  return (
    <View style={{ borderWidth: 1, borderColor: colors.line, borderStyle: "dashed", borderRadius: 16, padding: 34, alignItems: "center" }}>
      <Ionicons name={icon} size={26} color={colors.inkFaint} style={{ marginBottom: 10 }} />
      <Text style={{ color: colors.inkSoft, fontSize: 14, textAlign: "center", marginBottom: cta ? 14 : 0 }}>{text}</Text>
      {cta && (
        <TouchableOpacity onPress={onPress} style={{ backgroundColor: colors.accent, paddingVertical: 9, paddingHorizontal: 18, borderRadius: 999 }}>
          <Text style={{ color: colors.onAccent, fontSize: 13.5, fontWeight: "500" }}>{cta}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function HeartButton({ favorito, onPress, size = 28, iconSize = 14 }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        position: "absolute", top: 8, right: 8, width: size, height: size, borderRadius: size,
        backgroundColor: "rgba(255,255,255,0.88)", alignItems: "center", justifyContent: "center",
        elevation: 2, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 3,
      }}
    >
      <Ionicons name={favorito ? "heart" : "heart-outline"} size={iconSize} color={favorito ? colors.heart : "#7A6F63"} />
    </TouchableOpacity>
  );
}

// El margen superior del estado/notch lo gestiona el SafeAreaView de App.js.
export function TopBar({ title, onBack, right }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12, paddingBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 }}>
        {onBack && (
          <TouchableOpacity onPress={onBack} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </TouchableOpacity>
        )}
        <Text style={{ fontSize: 24, fontWeight: "500", color: colors.ink, fontFamily: "display" }}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

// Botón redondo de acento (el "+" de las cabeceras)
export function RoundAddButton({ onPress, icon = "add" }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={{ backgroundColor: colors.accent, width: 36, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={icon} size={20} color={colors.onAccent} />
    </TouchableOpacity>
  );
}

export function Sheet({ visible = true, title, onClose, children }) {
  const { colors } = useTheme();
  const styles = useStyles(createSheetStyles);
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={17} color={colors.inkSoft} />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingBottom: 30 }}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createSheetStyles = (c) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: c.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "88%", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sheetTitle: { fontSize: 19, fontWeight: "500", color: c.ink, fontFamily: "display" },
  closeBtn: { width: 32, height: 32, borderRadius: 999, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" },
});

// Estilo común de los campos de texto (cambia con el tema)
export function useInputStyle() {
  const { colors } = useTheme();
  return {
    width: "100%", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.line,
    fontSize: 14.5, color: colors.ink, backgroundColor: colors.surface, fontFamily: "Inter_400Regular",
  };
}
