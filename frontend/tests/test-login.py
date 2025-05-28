from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

class SpotifyAuthTest:
    def __init__(self):
        self.service = Service(r"C:\Users\Monster\Downloads\chromedriver-win32 (1)\chromedriver-win32\chromedriver.exe")
        self.options = webdriver.ChromeOptions()
        self.options.add_argument("--start-maximized")
        self.driver = webdriver.Chrome(service=self.service, options=self.options)
        self.wait = WebDriverWait(self.driver, 20)

    def test_initial_redirect(self):
        """Test 1: Spotify giriş sayfasına yönlendirme testi"""
        try:
            print("\n=== Test 1: Spotify Giriş Sayfasına Yönlendirme ===")
            self.driver.get("http://localhost:5173/")
            
            login_button = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Spotify ile Giriş Yap')]"))
            )
            
            print("Buton bulundu. Tıklanıyor...")
            login_button.click()
            
            time.sleep(3)
            current_url = self.driver.current_url
            if "accounts.spotify.com" in current_url:
                print("✅ Test başarılı: Kullanıcı doğru şekilde Spotify giriş sayfasına yönlendirildi.")
                print("\n⚠️ Lütfen manuel olarak giriş yapın. Test, giriş yaptıktan sonra devam edecek...")
                return True
            else:
                print(f"❌ Test başarısız: Spotify giriş sayfasına yönlendirme yapılamadı. Mevcut URL: {current_url}")
                return False
                
        except Exception as e:
            print(f"❌ Hata oluştu: {e}")
            return False

    def test_wrapped_redirect(self):
        """Test 2: Wrapped sayfasına yönlendirme testi"""
        try:
            print("\n=== Test 2: Wrapped Sayfasına Yönlendirme ===")
            
            # Kullanıcının giriş yapmasını bekle
            print("Wrapped sayfasına yönlendirmeyi bekliyorum...")
            
            # Wrapped sayfasına yönlendirmeyi bekle (maksimum 60 saniye)
            max_wait_time = 60
            start_time = time.time()
            
            while time.time() - start_time < max_wait_time:
                current_url = self.driver.current_url
                if "/wrapped" in current_url and "userId=" in current_url:
                    print("✅ Test başarılı: Wrapped sayfasına yönlendirme başarılı.")
                    print(f"Kullanıcı ID: {current_url.split('userId=')[1]}")
                    return True
                time.sleep(1)
            
            print(f"❌ Test başarısız: Wrapped sayfasına yönlendirme yapılamadı. Mevcut URL: {current_url}")
            return False
                
        except Exception as e:
            print(f"❌ Hata oluştu: {e}")
            return False

    def test_wrapped_content(self):
        """Test 3: Wrapped sayfası içeriğini kontrol et"""
        try:
            print("\n=== Test 3: Wrapped Sayfası İçeriği ===")
            
            # Önce loading durumunu kontrol et
            try:
                loading_element = self.wait.until(
                    EC.presence_of_element_located((By.XPATH, "//div[contains(text(), 'Yükleniyor')]"))
                )
                print("Loading durumu tespit edildi, veriler yükleniyor...")
                time.sleep(5)  # Verilerin yüklenmesi için bekle
            except:
                print("Loading durumu bulunamadı, sayfa direkt yüklenmiş olabilir.")
            
            # Ana container'ı bul
            main_container = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div.bg-white.bg-opacity-90"))
            )
            
            # Başlık elementini kontrol et
            title = main_container.find_element(By.CSS_SELECTOR, "h2.text-xs.font-light")
            
            # Navigasyon butonlarını kontrol et
            nav_buttons = main_container.find_elements(By.CSS_SELECTOR, "button.bg-black.text-white")
            
            if main_container.is_displayed():
                print("✅ Test başarılı: Wrapped içeriği başarıyla yüklendi.")
                print(f"Başlık: {title.text}")
                print(f"Navigasyon butonları: {len(nav_buttons)} adet")
                
                # Story tipine göre içeriği kontrol et
                try:
                    if "topTrack" in main_container.get_attribute("innerHTML"):
                        track_name = main_container.find_element(By.CSS_SELECTOR, "p.text-2xl.font-bold")
                        print(f"Şarkı adı: {track_name.text}")
                    elif "topArtist" in main_container.get_attribute("innerHTML"):
                        artist_name = main_container.find_element(By.CSS_SELECTOR, "p.text-2xl.font-semibold")
                        print(f"Sanatçı adı: {artist_name.text}")
                    elif "mlCluster" in main_container.get_attribute("innerHTML"):
                        genres = main_container.find_element(By.CSS_SELECTOR, "p.text-sm.text-gray-200")
                        print(f"Müzik tarzları: {genres.text}")
                except:
                    print("Story içeriği bulunamadı veya farklı bir formatta.")
                
                return True
            else:
                print("❌ Test başarısız: Wrapped içeriği görünür değil.")
                return False
                
        except Exception as e:
            print(f"❌ Test başarısız: Wrapped içeriği bulunamadı. Hata: {e}")
            return False

    def run_all_tests(self):
        """Tüm testleri çalıştır"""
        try:
            print("=== Spotify Kimlik Doğrulama Testleri Başlıyor ===")
            print("⚠️ Bu test, manuel giriş gerektirmektedir.")
            print("1. Test başladığında Spotify giriş sayfasına yönlendirileceksiniz")
            print("2. Lütfen manuel olarak giriş yapın")
            print("3. Test, giriş yaptıktan sonra otomatik olarak devam edecek")
            print("\nTest başlıyor...\n")
            
            # Test 1: İlk yönlendirme
            if not self.test_initial_redirect():
                return
            
            # Test 2: Wrapped sayfasına yönlendirme
            if not self.test_wrapped_redirect():
                return
                
            # Test 3: Wrapped içeriği kontrolü
            if not self.test_wrapped_content():
                return
            
            print("\n✅ Tüm testler başarıyla tamamlandı!")
            
        except Exception as e:
            print(f"\n❌ Test sürecinde hata oluştu: {e}")
        finally:
            self.driver.quit()

# Testleri çalıştır
if __name__ == "__main__":
    test_suite = SpotifyAuthTest()
    test_suite.run_all_tests()