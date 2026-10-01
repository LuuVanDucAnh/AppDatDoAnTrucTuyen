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

import { useApp } from '@/context/AppContext';
import { useOwner } from '@/context/OwnerContext';
import { ApiError, ownerApi } from '@/services/api';
import { resolveImageUrl } from '@/services/config';

export default function CreateRestaurantScreen() {
  const router = useRouter();
  const { user } = useApp();
  const { reload, selectRestaurant } = useOwner();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [openingTime, setOpeningTime] = useState('07:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên nhà hàng / quán ăn.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ kinh doanh của quán.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại hotline.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await ownerApi.createRestaurant({
        owner_id: user?.id,
        name: name.trim(),
        address: address.trim(),
        phone_number: phone.trim(),
        opening_time: openingTime.trim() || '07:00',
        closing_time: closingTime.trim() || '22:00',
        description: description.trim() || undefined,
        image: image.trim() || undefined,
      });

      await reload();
      if (created?.id) {
        selectRestaurant(created.id);
      }

      Alert.alert('Đăng ký thành công', 'Nhà hàng của bạn đã sẵn sàng mở bán!', [
        {
          text: 'Vào quản lý ngay',
          onPress: () => router.replace('/owner/dashboard' as any),
        },
      ]);
    } catch (err) {
      Alert.alert(
        'Không thể tạo quán',
        err instanceof ApiError ? err.message : 'Đã có lỗi xảy ra khi tạo nhà hàng.'
      );
    } finally {
      setSubmitting(false);
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
        <Text style={styles.headerTitle}>Đăng ký mở quán mới</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Banner giới thiệu */}
          <View style={styles.introCard}>
            <View style={styles.introIconBox}>
              <Ionicons name="storefront" size={26} color="#EA580C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.introTitle}>Bắt đầu bán hàng trên sàn</Text>
              <Text style={styles.introSub}>
                Tiếp cận hàng nghìn thực khách mỗi ngày với hệ thống quản lý đơn trực tiếp.
              </Text>
            </View>
          </View>

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
              <Text style={styles.inputLabel}>URL ảnh bìa / đại diện quán:</Text>
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

          {/* Form thông tin quán */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Tên quán ăn / Thương hiệu <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="VD: Phở Bò Gia Truyền Nam Định"
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
                placeholder="Số nhà, đường, phường, quận..."
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
                placeholder="VD: 0912345678"
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
              <Text style={styles.inputLabel}>Mô tả / Lời giới thiệu</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Giới thiệu về món ngon, hương vị và thông điệp gửi tới khách hàng..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          {/* Nút xác nhận tạo quán */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleCreate}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Xác nhận mở quán</Text>
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
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 14,
    padding: 14,
  },
  introIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#C2410C',
  },
  introSub: {
    fontSize: 12,
    color: '#9A3412',
    marginTop: 2,
    lineHeight: 16,
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
    height: 140,
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
    height: 80,
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
