import os
print("Çalışma dizini:", os.getcwd())
print("Dosya bulunduğu dizin:", os.path.dirname(os.path.abspath(__file__)))

# Örnek dosya kontrolü (varsa)
path = os.path.join(os.path.dirname(__file__), "test.txt")
print("Dosya var mı:", os.path.exists(path))
import sys
import findspark
import re
import numpy as np
import pandas as pd
import time

from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
import seaborn as sns
from mpl_toolkits.mplot3d import Axes3D
from pymongo import MongoClient
from rapidfuzz import process, fuzz
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, lower, trim, when, lit, mean, isnan, stddev
from pyspark.sql.types import DoubleType
from pyspark.ml.feature import VectorAssembler, StandardScaler
from pyspark.ml.clustering import KMeans
from pyspark.ml import Pipeline
import dns.resolver
findspark.init()


# Helper functions
def normalize_track_name(name):
    if not isinstance(name, str):
        return ""
    name = re.sub(r'\([^)]*\)', '', name)
    name = re.sub(r'\[[^]]*\]', '', name)
    name = re.sub(r'[^\w\s]', '', name)
    return name.strip().lower()


def find_best_match(track_name, track_list, threshold=80):
    if not track_name:
        return None
    normalized_track = normalize_track_name(track_name)
    if not normalized_track:
        return None
    if normalized_track in track_list:
        return normalized_track
    results = process.extract(normalized_track, track_list, limit=1, scorer=fuzz.token_sort_ratio)
    if results and results[0][1] >= threshold:
        return results[0][0]
    return None


def print_user_analysis(email, matched_count, cluster, similarities):
    print(f"\n{'-' * 40}")
    print(f"Kullanıcı: {email}")
    print(f"Eşleşen Şarkı: {matched_count}")

    if cluster is None:
        print("Yeterli veri bulunamadı.")
        return

    print(f"Baskın Tür: {cluster_names[cluster]}")

    # Sort similarities by absolute value
    sorted_sims = sorted(similarities, key=lambda x: abs(x[1]), reverse=True)

    # Only show significant matches (above 20%)
    significant_matches = [(c, sim) for c, sim in sorted_sims if abs(sim) > 0.2]

    if significant_matches:
        print("\nMüzik Türü Uyumluluk:")
        for c, sim in significant_matches:
            match_level = "✓✓✓" if abs(sim) > 0.7 else "✓✓" if abs(sim) > 0.4 else "✓"
            print(f"{match_level} {cluster_names[c]}: %{abs(sim * 100):.1f}")


def visualize_clusters(predictions_df, centers, cluster_names):
    """
    Visualize clusters using PCA for dimensionality reduction
    """
    try:
        # Convert PySpark Vectors to numpy arrays safely
        features_list = [row.scaled_features.toArray() for row in predictions_df.select("scaled_features").collect()]
        X = np.array(features_list)
        y = np.array([row.prediction for row in predictions_df.select("prediction").collect()])

        # Centers are already numpy arrays, just stack them
        centers_array = np.vstack(centers)

        # Create color palette
        colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD']

        # Set style - use a basic style that's always available
        plt.style.use('default')

        # Create figure with white background
        plt.figure(figsize=(15, 6), facecolor='white')

        # 2D PCA
        pca_2d = PCA(n_components=2)
        X_2d = pca_2d.fit_transform(X)
        centers_2d = pca_2d.transform(centers_array)

        # 2D Plot
        plt.subplot(121)
        for i in range(5):
            mask = y == i
            plt.scatter(X_2d[mask, 0], X_2d[mask, 1],
                        c=colors[i], label=cluster_names[i], alpha=0.6, s=50)
            plt.scatter(centers_2d[i, 0], centers_2d[i, 1],
                        c='black', marker='x', s=200, linewidths=3)

        plt.title('Kümeleme Sonuçları (2D)', pad=20)
        plt.xlabel('Birinci Temel Bileşen')
        plt.ylabel('İkinci Temel Bileşen')
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.grid(True, alpha=0.3)

        # 3D PCA
        pca_3d = PCA(n_components=3)
        X_3d = pca_3d.fit_transform(X)
        centers_3d = pca_3d.transform(centers_array)

        # 3D Plot
        ax = plt.subplot(122, projection='3d')
        for i in range(5):
            mask = y == i
            ax.scatter(X_3d[mask, 0], X_3d[mask, 1], X_3d[mask, 2],
                       c=colors[i], label=cluster_names[i], alpha=0.6, s=50)
            ax.scatter(centers_3d[i, 0], centers_3d[i, 1], centers_3d[i, 2],
                       c='black', marker='x', s=200, linewidths=3)

        ax.set_title('Kümeleme Sonuçları (3D)', pad=20)
        ax.set_xlabel('Birinci Temel Bileşen')
        ax.set_ylabel('İkinci Temel Bileşen')
        ax.set_zlabel('Üçüncü Temel Bileşen')
        ax.view_init(elev=20, azim=45)
        ax.grid(True, alpha=0.3)

        plt.tight_layout()
        plt.savefig('clustering_results.png', dpi=300, bbox_inches='tight')
        print("\nGörselleştirme 'clustering_results.png' dosyasına kaydedildi.")

    except Exception as e:
        print(f"Görselleştirme hatası: {str(e)}")
        import traceback
        print(traceback.format_exc())


def analyze_user(user_tracks_df):
    if user_tracks_df.count() == 0:
        return None

    # Calculate user features with the same preprocessing steps
    user_features = user_tracks_df.select(features).agg(
        *[mean(col(f)).alias(f) for f in features]
    )

    # Apply the same normalization and weighting
    weighted_features = {}
    for feature in features:
        value = float(user_features.select(feature).collect()[0][0])

        # Handle null/invalid values
        if value is None or np.isnan(value):
            value = 0.0

        # Z-score normalization
        mean_val = df.select(mean(col(feature))).collect()[0][0]
        stddev_val = df.select(stddev(col(feature))).collect()[0][0]

        if stddev_val is None or stddev_val == 0:
            stddev_val = 1.0

        normalized_value = (value - mean_val) / stddev_val

        # Apply feature weight
        weighted_features[feature] = normalized_value * feature_weights[feature]

    # Create user vector
    user_df = spark.createDataFrame([weighted_features])
    user_vector = pipeline_model.transform(user_df).select("scaled_features").collect()[0][0]
    user_array = user_vector.toArray()

    # Calculate similarities using cosine similarity
    similarities = []
    for i, center in enumerate(centers):
        # Centers are already numpy arrays
        # Cosine similarity
        dot_product = np.dot(user_array, center)
        norm_user = np.linalg.norm(user_array)
        norm_center = np.linalg.norm(center)

        if norm_user == 0 or norm_center == 0:
            similarity = 0
        else:
            similarity = dot_product / (norm_user * norm_center)

        # Adjust similarity with cluster size (reduced impact)
        cluster_size = cluster_counts.filter(col("prediction") == i).first()["count"]
        size_factor = np.log1p(cluster_size) / np.log1p(df.count())
        adjusted_similarity = similarity * (0.85 + 0.15 * size_factor)

        similarities.append((i, adjusted_similarity))

    similarities.sort(key=lambda x: x[1], reverse=True)
    return similarities[0][0], similarities


# Spark session setup with optimizations
os.environ['JAVA_HOME'] = r'C:\Users\MONSTER\AppData\Local\Programs\Eclipse Adoptium\jdk-11.0.27.6-hotspot'
os.environ['HADOOP_HOME'] = r'C:\hadoop'
os.environ['SPARK_LOCAL_HOSTNAME'] = 'localhost'
os.environ['SPARK_HOME'] = r'C:\spark\spark-3.5.5-bin-hadoop3'
os.environ['PYSPARK_PYTHON'] = sys.executable
os.environ['PYSPARK_DRIVER_PYTHON'] = sys.executable

spark = SparkSession.builder \
    .master("local[*]") \
    .config("spark.driver.host", "127.0.0.1") \
    .config("spark.driver.bindAddress", "127.0.0.1") \
    .config("spark.driver.memory", "4g") \
    .config("spark.executor.memory", "4g") \
    .config("spark.sql.shuffle.partitions", "8") \
    .config("spark.default.parallelism", "8") \
    .config("spark.memory.offHeap.enabled", "true") \
    .config("spark.memory.offHeap.size", "2g") \
    .appName("SpotifyClustering") \
    .getOrCreate()

spark.sparkContext.setLogLevel("ERROR")

# Start timing
start_time = time.time()

print("Program başladı...")

# Feature definitions
features = [
    "acousticness", "danceability", "duration_ms", "energy",
    "instrumentalness", "liveness", "loudness", "speechiness",
    "tempo", "valence"
]

# Feature ranges
feature_ranges = {
    "acousticness": (0, 1),
    "danceability": (0, 1),
    "duration_ms": (30000, 600000),  # 30 saniye ile 10 dakika arası
    "energy": (0, 1),
    "instrumentalness": (0, 1),
    "liveness": (0, 1),
    "loudness": (-40, 5),  # Daha gerçekçi aralık
    "speechiness": (0, 1),
    "tempo": (40, 220),  # Daha gerçekçi BPM aralığı
    "valence": (0, 1)
}

# Feature weights
feature_weights = {
    "danceability": 1.5,  # Daha dengeli ağırlık
    "energy": 1.5,  # Daha dengeli ağırlık
    "valence": 1.2,  # Daha düşük ağırlık
    "tempo": 1.2,  # Daha düşük ağırlık
    "loudness": 1.0,  # Normal ağırlık
    "instrumentalness": 1.3,  # Artırılmış ağırlık
    "acousticness": 1.3,  # Artırılmış ağırlık
    "speechiness": 1.4,  # Artırılmış ağırlık
    "liveness": 1.0,  # Normal ağırlık
    "duration_ms": 0.8  # Azaltılmış ağırlık
}

try:
    print("Spotify Müzik Analizi Başlıyor...")

    # Load data silently
    df = spark.read.option("header", True).option("sep", ";").csv("SpotifyFeatures.csv")

    # Process data silently
    for feature in features:
        df = df.withColumn(feature, col(feature).cast(DoubleType()))

    # Handle null values with more sophisticated approach
    for feature in features:
        feature_mean = df.select(mean(col(feature)).alias('mean')).collect()[0]['mean']
        if feature_mean is None:
            feature_mean = feature_ranges[feature][0]

        df = df.withColumn(
            feature,
            when(
                col(feature).isNull() | isnan(col(feature)) |
                (col(feature) < feature_ranges[feature][0]) |
                (col(feature) > feature_ranges[feature][1]),
                feature_mean
            ).otherwise(col(feature))
        )

    # Z-score normalization before min-max scaling
    for feature in features:
        mean_val = df.select(mean(col(feature))).collect()[0][0]
        stddev_val = df.select(stddev(col(feature))).collect()[0][0]

        if stddev_val is None or stddev_val == 0:
            stddev_val = 1.0

        df = df.withColumn(
            feature,
            (col(feature) - mean_val) / stddev_val
        )

    # Apply feature weights after normalization
    for feature, weight in feature_weights.items():
        df = df.withColumn(feature, col(feature) * weight)

    # Cache the preprocessed dataframe
    df = df.cache()
    print(f"Toplam şarkı sayısı: {df.count():,}")

    # Clustering pipeline
    assembler = VectorAssembler(
        inputCols=features,
        outputCol="features_vec",
        handleInvalid="skip"
    )

    scaler = StandardScaler(
        inputCol="features_vec",
        outputCol="scaled_features",
        withStd=True,
        withMean=True
    )

    pipeline = Pipeline(stages=[assembler, scaler])
    pipeline_model = pipeline.fit(df)
    scaled_data = pipeline_model.transform(df).cache()

    print("\nKümeleme yapılıyor...")
    kmeans = KMeans(
        featuresCol="scaled_features",
        k=5,
        seed=42,
        maxIter=300,
        initSteps=50,
        tol=1e-6,
        distanceMeasure="cosine"
    )

    model = kmeans.fit(scaled_data)
    predictions = model.transform(scaled_data).cache()

    # Store cluster centers
    centers = model.clusterCenters()

    print("\nModel değerlendiriliyor...")
    sample_size = 10000
    sampled_data = predictions.select("scaled_features", "prediction").sample(
        False, sample_size / predictions.count(), seed=42
    ).limit(sample_size)

    sampled_features = np.array([row.scaled_features.toArray() for row in sampled_data.collect()])
    sampled_predictions = np.array([row.prediction for row in sampled_data.collect()])

    silhouette_avg = silhouette_score(sampled_features, sampled_predictions)
    print(f"\nModel Doğruluk: %{((silhouette_avg + 1) / 2 * 100):.1f}")

    # Update cluster names to be more concise
    cluster_names = {
        0: "Pop & Dance",
        1: "Chill & Acoustic",
        2: "Urban & Hip-Hop",
        3: "Alternative & Indie",
        4: "Electronic & Modern"
    }

    # Show cluster sizes in a compact format
    print("\nKüme Dağılımları:")
    cluster_counts = predictions.groupBy("prediction").count().orderBy("prediction")
    for row in cluster_counts.collect():
        print(f"{cluster_names[row['prediction']]}: {row['count']:,} şarkı")

    # After model training and evaluation, prepare data for visualization
    print("\nGörselleştirme hazırlanıyor...")

    try:
        # Sample the data for visualization if it's too large
        sample_size = min(10000, predictions.count())
        sampled_predictions = predictions.sample(False, sample_size / predictions.count(), seed=42)

        # Create visualization using the sampled predictions DataFrame
        visualize_clusters(sampled_predictions, centers, cluster_names)
    except Exception as e:
        print(f"Görselleştirme hatası: {str(e)}")
        print("Görselleştirme atlanıyor...")

    # Continue with user analysis
    print("\nKullanıcı verileri alınıyor...")
    uri = "mongodb+srv://sacidesula61:sacide61@spotifywrapped.15uc9iv.mongodb.net/?retryWrites=true&w=majority&appName=spotifywrapped"
    client = MongoClient(uri)
    db = client["test"]
    collection = db["users"]
    users = list(collection.find({}, {"_id": 0, "email": 1, "topTracks": 1}))

    if not users:
        print("Uyarı: Kullanıcı verisi bulunamadı.")
        sys.exit(1)

    # Cache track names silently
    track_names_dict = {normalize_track_name(row['track_name']): row['track_name']
                        for row in df.select('track_name').collect()
                        if row['track_name']}
    track_names_set = set(track_names_dict.keys())

    # User analysis with cleaner output
    print(f"\nKullanıcı Analizleri ({len(users)} kullanıcı):")
    for user in users:
        email = user.get("email", "Email bulunamadı")
        tracks = user.get("topTracks", [])

        if not tracks:
            continue

        matched_tracks = {}
        for track in tracks:
            name = track.get("name", "").strip()
            if not name:
                continue
            matched = find_best_match(name, track_names_set)
            if matched and matched not in matched_tracks.values():
                matched_tracks[name] = matched

        if not matched_tracks:
            continue

        matched_names = [track_names_dict[m] for m in matched_tracks.values()]
        user_tracks = df.filter(col("track_name").isin(matched_names))

        result = analyze_user(user_tracks)
        if result:
            cluster, similarities = result
            print_user_analysis(email, len(matched_tracks), cluster, similarities)

    print(f"\nAnaliz tamamlandı! ({time.time() - start_time:.1f} saniye)")

except Exception as e:
    print(f"Hata: {str(e)}")
    sys.exit(1)

finally:
    spark.stop()