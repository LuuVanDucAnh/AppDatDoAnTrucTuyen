import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { type Address, useApp } from '@/context/AppContext';

export default function AddressesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ select?: string }>();
  const isSelectMode = params.select === 'true';

  const {
    addresses,
    addressesLoading,
    setDefaultAddress,
    addAddress,
    updateAddress,
    deleteAddress,
  } = useApp();

  // Modal form thêm / sửa
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [receiverName, setReceiverName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingId(null);
    setReceiverName('');
    setPhone('');
    setAddressDetail('');
    setWard('');
    setDistrict('');
    setCity('');
    setIsDefault(addresses.length === 0);
    setModalVisible(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingId(addr.id);
    setReceiverName(addr.recipientName);
    setPhone(addr.phone);
    setAddressDetail(addr.detailAddress);
    setWard(addr.ward || '');
    setDistrict(addr.district || '');
    setCity(addr.city || '');
    setIsDefault(addr.isDefault);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!receiverName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên người nhận.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại.');
      return;
    }
    if (!addressDetail.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ chi tiết.');
      return;
    }

    setSubmitting(true);
    if (editingId) {
      // Cập nhật
      const success = await updateAddress(editingId, {
        receiverName: receiverName.trim(),
        phone: phone.trim(),
        addressDetail: addressDetail.trim(),
        ward: ward.trim() || undefined,
        district: district.trim() || undefined,
        city: city.trim() || undefined,
        isDefault,
      });
      setSubmitting(false);
      if (success) {
        setModalVisible(false);
      }
    } else {
      // Thêm mới
      const created = await addAddress({
        receiverName: receiverName.trim(),
        phone: phone.trim(),
        addressDetail: addressDetail.trim(),
        ward: ward.trim() || undefined,
        district: district.trim() || undefined,
        city: city.trim() || undefined,
        isDefault,
      });
      setSubmitting(false);
      if (created) {
        setModalVisible(false);
      }
    }
  };

  const handleDelete = (addr: Address) => {
    Alert.alert(
      'Xoá địa chỉ',
      `Bạn có chắc chắn muốn xoá địa chỉ "${addr.detailAddress}" không?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            await deleteAddress(addr.id);
          },
        },
      ]
    );
  };

  const handleSelectAddress = (addr: Address) => {
    if (isSelectMode) {
      void setDefaultAddress(addr.id);
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isSelectMode ? 'Chọn địa chỉ nhận hàng' : 'Sổ địa chỉ'}
        </Text>
        <TouchableOpacity style={styles.addHeaderBtn} onPress={openAddModal}>
          <Ionicons name="add" size={22} color="#EA580C" />
          <Text style={styles.addHeaderText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {addressesLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingText}>Đang tải danh sách địa chỉ...</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="location-outline" size={54} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Chưa có địa chỉ nào</Text>
              <Text style={styles.emptySub}>
                Thêm địa chỉ giao hàng để đặt món nhanh chóng hơn.
              </Text>
              <TouchableOpacity style={styles.addNowBtn} onPress={openAddModal}>
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.addNowBtnText}>Thêm địa chỉ mới</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const fullAddress = [item.detailAddress, item.ward, item.district, item.city]
              .filter(Boolean)
              .join(', ');

            return (
              <TouchableOpacity
                style={[styles.addressCard, item.isDefault && styles.addressCardDefault]}
                activeOpacity={isSelectMode ? 0.7 : 1}
                onPress={() => handleSelectAddress(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.nameRow}>
                    <Ionicons name="person-outline" size={15} color="#4B5563" />
                    <Text style={styles.recipientName}>{item.recipientName}</Text>
                    <Text style={styles.phoneDivider}>|</Text>
                    <Text style={styles.phone}>{item.phone}</Text>
                  </View>
                  {item.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>MẶC ĐỊNH</Text>
                    </View>
                  )}
                </View>

                <View style={styles.addressLineRow}>
                  <Ionicons name="location" size={16} color="#EA580C" style={{ marginTop: 2 }} />
                  <Text style={styles.detailAddress}>{fullAddress}</Text>
                </View>

                {/* Hàng nút chức năng */}
                <View style={styles.actionsRow}>
                  {!item.isDefault ? (
                    <TouchableOpacity
                      style={styles.setDefaultBtn}
                      onPress={() => void setDefaultAddress(item.id)}
                    >
                      <Text style={styles.setDefaultBtnText}>Đặt làm mặc định</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flex: 1 }} />
                  )}

                  <View style={styles.btnGroupRight}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => openEditModal(item)}
                    >
                      <Ionicons name="create-outline" size={17} color="#2563EB" />
                      <Text style={styles.actionBtnTextBlue}>Sửa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleDelete(item)}
                    >
                      <Ionicons name="trash-outline" size={17} color="#DC2626" />
                      <Text style={styles.actionBtnTextRed}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Modal Thêm / Sửa Địa chỉ */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Họ tên người nhận <Text style={styles.req}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: Nguyễn Văn A"
                  placeholderTextColor="#9CA3AF"
                  value={receiverName}
                  onChangeText={setReceiverName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Số điện thoại <Text style={styles.req}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 0901234567"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Địa chỉ chi tiết (Số nhà, đường) <Text style={styles.req}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 123 Đường Cầu Giấy"
                  placeholderTextColor="#9CA3AF"
                  value={addressDetail}
                  onChangeText={setAddressDetail}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Phường / Xã</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Dịch Vọng"
                    placeholderTextColor="#9CA3AF"
                    value={ward}
                    onChangeText={setWard}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Quận / Huyện</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Cầu Giấy"
                    placeholderTextColor="#9CA3AF"
                    value={district}
                    onChangeText={setDistrict}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tỉnh / Thành phố</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Hà Nội"
                  placeholderTextColor="#9CA3AF"
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Đặt làm địa chỉ mặc định</Text>
                <Switch
                  value={isDefault}
                  onValueChange={setIsDefault}
                  trackColor={{ false: '#D1D5DB', true: '#EA580C' }}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Xác nhận</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#111827',
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EA580C',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 10,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  addNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EA580C',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },
  addNowBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  addressCardDefault: {
    borderColor: '#FDBA74',
    backgroundColor: '#FFFCF8',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recipientName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
  },
  phoneDivider: {
    color: '#D1D5DB',
  },
  phone: {
    fontSize: 13.5,
    color: '#4B5563',
  },
  defaultBadge: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#EA580C',
  },
  addressLineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  detailAddress: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  setDefaultBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  setDefaultBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  btnGroupRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionBtnTextBlue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  actionBtnTextRed: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#111827',
  },
  modalBody: {
    gap: 12,
  },
  formGroup: {
    gap: 5,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
  },
  req: {
    color: '#DC2626',
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#374151',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  submitBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
