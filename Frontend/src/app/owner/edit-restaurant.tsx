import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useOwner } from '@/context/OwnerContext';
import { ApiError, ownerApi } from '@/services/api';
import { resolveImageUrl } from '@/services/config';

export default function EditRestaurantScreen() {
  const router = useRouter();
  const { restaurant, reload } = useOwner();

  const [name, setName] = useState(restaurant?.name || '');
  const [address, setAddress] = useState(restaurant?.address || '');
  const [phone, setPhone] = useState(restaurant?.phone_number || '');
  const [openingTime, setOpeningTime] = useState(
    restaurant?.opening_time ? restaurant.opening_time.slice(0, 5) : '07:00'
  );
  const [closingTime, setClosingTime] = useState(
    restaurant?.closing_time ? restaurant.closing_time.slice(0, 5) : '22:00'
  );
  const [description, setDescription] = useState(restaurant?.description || '');
  const [image, setImage] = useState(restaurant?.image || '');
  const [saving, setSaving] = useState(false);

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>Không tìm thấy thông tin nhà hàng để chỉnh sửa.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên nhà hàng.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ quán.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại liên hệ.');
      return;
    }

    setSaving(true);
    try {
      await ownerApi.updateRestaurantInfo(restaurant.id, {
        name: name.trim(),
        address: address.trim(),
        phone_number: phone.trim(),
        opening_time: openingTime.trim() || undefined,
        closing_time: closingTime.trim() || undefined,
        description: description.trim() || undefined,
        image: image.trim() || undefined,
      });

      await reload();
      Alert.alert('Thành công', 'Thông tin nhà hàng đã được cập nhật!', [
        { text: 'Đồng ý', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert(
        'Không thể lưu',
        err instanceof ApiError ? err.message : 'Đã có lỗi xảy ra khi cập nhật quán.'
      );
    } finally {
      setSaving(false);
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
        <Text style={styles.headerTitle}>Sửa thông tin quán</Text>
        <TouchableOpacity
          style={[styles.saveHeaderBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#EA580C" />
          ) : (
            <Text style={styles.saveHeaderBtnText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Ảnh bìa quán */}
          <View style={styles.imageCard}>
            <Image
              source={{
                uri:
                  resolveImageUrl(image) ||
                  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
              }}
              style={styles.previewImage}
            />
            <View style={styles.imageInputBox}>
              <Text style={styles.inputLabel}>URL ảnh bìa nhà hàng:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Dán link ảnh (http://...)"
                placeholderTextColor="#9CA3AF"
                value={image}
                onChangeText={setImage}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Form thông tin */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Tên nhà hàng <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="VD: Cơm Tấm Sài Gòn 99"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Địa chỉ kinh doanh <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Số nhà, ngõ, đường, quận/huyện..."
                placeholderTextColor="#9CA3AF"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Số điện thoại liên hệ <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="VD: 0901234567"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Giờ hoạt động */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Giờ mở cửa</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="07:00"
                  placeholderTextColor="#9CA3AF"
                  value={openingTime}
                  onChangeText={setOpeningTime}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Giờ đóng cửa</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="22:00"
                  placeholderTextColor="#9CA3AF"
                  value={closingTime}
                  onChangeText={setClosingTime}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mô tả / Lời giới thiệu quán</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Giới thiệu các món đặc sản, cam kết vệ sinh an toàn thực phẩm..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          {/* Nút lưu lớn */}
          <TouchableOpacity
            style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  saveHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveHeaderBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EA580C',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  imageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#F1F5F9',
  },
  imageInputBox: {
    padding: 14,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  req: {
    color: '#DC2626',
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 90,
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EA580C',
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
