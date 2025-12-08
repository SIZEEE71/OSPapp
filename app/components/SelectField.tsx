import React, { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import colors from "../theme";

interface SelectFieldProps {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}

export default function SelectField({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps) {
  const [showModal, setShowModal] = useState(false);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || label;

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.selectButtonText}>{selectedLabel}</Text>
        <Text style={styles.selectButtonArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="fade"
        transparent
        onDismiss={() => setShowModal(false)}
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.selectOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.selectModalContent}>
            <ScrollView>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.selectOption,
                    value === option.value && styles.selectOptionActive,
                  ]}
                  onPress={() => {
                    onChange(option.value);
                    setShowModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      value === option.value && styles.selectOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 6,
    marginTop: 12,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.background,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectButtonText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  selectButtonArrow: {
    fontSize: 12,
    color: colors.textMuted,
  },
  selectOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
  },
  selectModalContent: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 8,
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  selectOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceDivider,
  },
  selectOptionActive: {
    backgroundColor: colors.primary,
  },
  selectOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  selectOptionTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
});
