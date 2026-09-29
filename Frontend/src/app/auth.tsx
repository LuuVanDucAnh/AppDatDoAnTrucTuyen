import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saveSession, setSaveSession] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <View style={styles.headerLogoMini}>
                <Text style={styles.headerLogoText}>F</Text>
              </View>
              <Text style={styles.headerTitle}>Food</Text>
            </View>
            <View style={{ width: 24 }} /> {/* Placeholder for balance */}
          </View>

          {/* App Info Card */}
          <View style={styles.appInfoCard}>
            <View style={styles.appIconContainer}>
              <Ionicons name="fast-food" size={32} color="#fff" />
            </View>
            <View style={styles.appInfoTextContainer}>
              <View style={styles.appTitleRow}>
                <Text style={styles.appName}>Food</Text>
                <View style={styles.versionBadge}>
                  <Text style={styles.versionText}>v1.0</Text>
                </View>
              </View>
              <Text style={styles.appSlogan}>Món ngon nóng hổi, giao tận cửa</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, isLogin && styles.tabButtonActive]}
              onPress={() => setIsLogin(true)}
            >
              <Ionicons name="lock-closed-outline" size={16} color={isLogin ? '#fff' : '#666'} style={styles.tabIcon} />
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Đăng nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, !isLogin && styles.tabButtonActive]}
              onPress={() => setIsLogin(false)}
            >
              <Ionicons name="person-outline" size={16} color={!isLogin ? '#fff' : '#666'} style={styles.tabIcon} />
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Đăng ký</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {!isLogin && (
              <>
                <Text style={styles.inputLabel}>Họ và tên *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập họ tên của bạn"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <Text style={styles.inputLabel}>Số điện thoại *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập số điện thoại"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </>
            )}

            <Text style={styles.inputLabel}>{isLogin ? 'Email hoặc Số điện thoại *' : 'Email (Tuỳ chọn)'}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="at-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={isLogin ? "email@vidu.com hoặc 0901234567" : "email@vidu.com"}
                keyboardType="email-address"
                autoCapitalize="none"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
              />
            </View>

            <View style={styles.passwordLabelRow}>
              <Text style={styles.inputLabel}>Mật khẩu *</Text>
              {isLogin && (
                <TouchableOpacity>
                  <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu của bạn"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#888" />
              </TouchableOpacity>
            </View>

            {isLogin && (
              <View style={styles.sessionRow}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setSaveSession(!saveSession)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, saveSession && styles.checkboxChecked]}>
                    {saveSession && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Lưu phiên đăng nhập</Text>
                </TouchableOpacity>
                <View style={styles.jwtBadge}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#008a00" />
                  <Text style={styles.jwtBadgeText}>JWT Safe</Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.submitButton} activeOpacity={0.8}>
              <Text style={styles.submitButtonText}>
                {isLogin ? 'ĐĂNG NHẬP NGAY' : 'ĐĂNG KÝ TÀI KHOẢN'}
              </Text>
              <Ionicons name={isLogin ? "log-in-outline" : "person-add-outline"} size={20} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            {isLogin && (
              <View style={styles.securityInfoBox}>
                <Ionicons name="lock-closed" size={18} color="#008a00" />
                <Text style={styles.securityInfoText}>
                  Bảo mật chuẩn JWT (Access Token & Refresh Token tự động gia hạn an toàn).
                </Text>
              </View>
            )}
          </View>

          {/* Social Logins */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC TIẾP TỤC VỚI</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome5 name="google" size={20} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome5 name="apple" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome5 name="facebook" size={22} color="#4267B2" />
            </TouchableOpacity>
          </View>

          {/* Footer Card */}
          <View style={styles.footerCard}>
            <View style={styles.footerIconContainer}>
              <Ionicons name="bicycle-outline" size={24} color="#C44E00" />
            </View>
            <View style={styles.footerTextContainer}>
              <Text style={styles.footerTitle}>Giao nhanh trong 20 phút</Text>
              <Text style={styles.footerDesc}>Hộp giữ nhiệt chuyên dụng luôn ấm nóng</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoMini: {
    width: 28,
    height: 28,
    backgroundColor: '#D35400',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerLogoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D35400',
  },
  appInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF0E6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  appIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#D35400',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appInfoTextContainer: {
    flex: 1,
  },
  appTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D35400',
    marginRight: 8,
  },
  versionBadge: {
    backgroundColor: '#FFE0B2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  versionText: {
    fontSize: 12,
    color: '#D35400',
    fontWeight: 'bold',
  },
  appSlogan: {
    fontSize: 13,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E9ECEF',
    borderRadius: 30,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 26,
  },
  tabButtonActive: {
    backgroundColor: '#A04000',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  formContainer: {
    marginBottom: 24,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#A04000',
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    height: 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#A04000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#A04000',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#555',
  },
  jwtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  jwtBadgeText: {
    fontSize: 12,
    color: '#008a00',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#A04000',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  securityInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    marginLeft: 8,
    lineHeight: 18,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    height: 54,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  footerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF5E6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#FFE4B5',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  footerTextContainer: {
    flex: 1,
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  footerDesc: {
    fontSize: 13,
    color: '#666',
  },
});
