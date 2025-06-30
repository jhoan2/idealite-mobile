// components/PageInfoModal.tsx
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PageInfoModalProps {
  visible: boolean;
  onClose: () => void;
  pageId: string | null;
}

export function PageInfoModal({
  visible,
  onClose,
  pageId,
}: PageInfoModalProps) {
  const { bottom } = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ["50%", "75%", "90%"], []);

  // Open/close sheet when visible changes
  useEffect(() => {
    if (visible && pageId) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [visible, pageId]);

  const handleClose = () => {
    onClose();
  };

  // Don't render if no pageId
  if (!pageId) {
    return null;
  }

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      index={-1}
      enablePanDownToClose
      onClose={handleClose}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      )}
      backgroundStyle={{
        backgroundColor: "#FFFFFF",
      }}
      handleIndicatorStyle={{
        backgroundColor: "#D1D5DB",
        width: 40,
      }}
    >
      <BottomSheetView
        style={{ flex: 1, paddingBottom: bottom, minHeight: "100%" }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-4 border-b border-gray-200"></View>
      </BottomSheetView>
    </BottomSheet>
  );
}
