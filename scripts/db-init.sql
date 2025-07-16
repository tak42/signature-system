-- データベース初期化スクリプト
-- 開発用ユーザーとデータベースの作成

-- 既存のリソースをクリーンアップ（存在する場合）
DROP DATABASE IF EXISTS signature_dev;
DROP DATABASE IF EXISTS signature_test;
DROP USER IF EXISTS dev_user;

-- 開発用ユーザー作成
CREATE USER dev_user WITH PASSWORD 'dev_password';

-- 開発用データベース作成
CREATE DATABASE signature_dev OWNER dev_user;

-- テスト用データベース作成
CREATE DATABASE signature_test OWNER dev_user;

-- 基本権限付与
GRANT ALL PRIVILEGES ON DATABASE signature_dev TO dev_user;
GRANT ALL PRIVILEGES ON DATABASE signature_test TO dev_user;

-- signature_dev データベースに接続して詳細権限設定
\c signature_dev;

GRANT USAGE ON SCHEMA public TO dev_user;
GRANT CREATE ON SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO dev_user;

-- 将来作成されるオブジェクトに対する権限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO dev_user;

-- signature_test データベースでも同様の設定
\c signature_test;

GRANT USAGE ON SCHEMA public TO dev_user;
GRANT CREATE ON SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO dev_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO dev_user;

-- 初期化完了確認
\c postgres;
SELECT 'Database initialization completed successfully' as status;

-- 作成されたデータベースとユーザーの確認
\l
\du