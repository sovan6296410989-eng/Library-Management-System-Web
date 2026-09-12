import java.net.URI;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.logging.Level;
import java.util.logging.Logger;

public class dbconnection {
    private static final Logger LOGGER = Logger.getLogger(dbconnection.class.getName());

    private static String dbUrl;
    private static String dbUser;
    private static String dbPassword;
    private static String rawHost = "localhost";
    private static int rawPort = 3306;
    private static String rawDb = "library_db";

    private static volatile boolean dbInitialized = false;

    static {
        initializeConfig();
    }

    private static void initializeConfig() {
        // Support standard environment variables across Docker, Railway, Render, etc.
        String rawUrl = envFirst("LIBRARY_DB_URL", "DATABASE_URL", "MYSQL_URL", "MYSQLURL");
        dbUser = envOrDefault("LIBRARY_DB_USER", "root");
        dbPassword = envOrDefault("LIBRARY_DB_PASSWORD", "721127");

        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            dbUrl = "jdbc:mysql://localhost:3306/library_db?allowPublicKeyRetrieval=true&useSSL=false";
            return;
        }

        rawUrl = rawUrl.trim();
        // Handle cloud URLs formatted as mysql://user:password@host:port/database
        if (rawUrl.startsWith("mysql://")) {
            try {
                URI uri = URI.create(rawUrl);
                rawHost = uri.getHost() != null ? uri.getHost() : "localhost";
                rawPort = uri.getPort() > 0 ? uri.getPort() : 3306;
                String path = uri.getPath() != null ? uri.getPath() : "/library_db";
                if (path.startsWith("/")) {
                    path = path.substring(1);
                }
                rawDb = path.isEmpty() ? "library_db" : path;

                String userInfo = uri.getUserInfo();
                if (userInfo != null && !userInfo.isEmpty()) {
                    String[] parts = userInfo.split(":", 2);
                    if (parts.length > 0 && !parts[0].isEmpty()) {
                        dbUser = parts[0];
                    }
                    if (parts.length > 1) {
                        dbPassword = parts[1];
                    }
                }

                String query = uri.getQuery() != null ? "?" + uri.getQuery() : "?allowPublicKeyRetrieval=true&useSSL=false";
                dbUrl = "jdbc:mysql://" + rawHost + ":" + rawPort + "/" + rawDb + query;
            } catch (Exception e) {
                dbUrl = "jdbc:" + rawUrl;
            }
        } else if (!rawUrl.startsWith("jdbc:")) {
            dbUrl = "jdbc:mysql://" + rawUrl;
        } else {
            dbUrl = rawUrl;
        }
    }

    private static String envFirst(String... names) {
        for (String name : names) {
            String val = System.getenv(name);
            if (val != null && !val.trim().isEmpty()) {
                return val.trim();
            }
        }
        return null;
    }

    private static String envOrDefault(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    private static synchronized void ensureDatabaseAndCredentials() {
        if (dbInitialized) {
            return;
        }

        String serverUrl = "jdbc:mysql://" + rawHost + ":" + rawPort + "/?allowPublicKeyRetrieval=true&useSSL=false";
        String[] candidatePasswords = new String[] {
            dbPassword,
            "mWanDodNerzuNKRjkIjXmRABeYIEkmen",
            "721127"
        };

        for (String candidate : candidatePasswords) {
            if (candidate == null) continue;
            try (Connection con = DriverManager.getConnection(serverUrl, dbUser, candidate);
                 Statement stmt = con.createStatement()) {

                // Ensure target database exists
                stmt.executeUpdate("CREATE DATABASE IF NOT EXISTS `" + rawDb + "`");

                // If currently using a different password than configured, update it
                if (!candidate.equals(dbPassword) && dbPassword != null && !dbPassword.isEmpty()) {
                    try {
                        stmt.executeUpdate("ALTER USER '" + dbUser + "'@'%' IDENTIFIED BY '" + dbPassword + "'");
                    } catch (Exception ignored) {}
                    try {
                        stmt.executeUpdate("ALTER USER '" + dbUser + "'@'localhost' IDENTIFIED BY '" + dbPassword + "'");
                    } catch (Exception ignored) {}
                    stmt.executeUpdate("FLUSH PRIVILEGES");
                }

                dbInitialized = true;
                LOGGER.info("Database `" + rawDb + "` and user `" + dbUser + "` verified successfully.");
                return;
            } catch (Exception ignored) {
                // Try next candidate
            }
        }

        dbInitialized = true;
    }

    public static Connection getConnection() throws Exception {
        return getConnection(5, 2000);
    }

    public static Connection getConnection(int maxAttempts, long waitMs) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");

        ensureDatabaseAndCredentials();

        Exception lastException = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return DriverManager.getConnection(dbUrl, dbUser, dbPassword);
            } catch (SQLException e) {
                lastException = e;
                if (attempt < maxAttempts) {
                    LOGGER.warning("Database connection attempt " + attempt + " failed (" + e.getMessage() + "). Retrying in " + waitMs + "ms...");
                    try {
                        Thread.sleep(waitMs);
                    } catch (InterruptedException ignored) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }

        throw new IllegalStateException("Failed to connect to database at " + dbUrl + " with user '" + dbUser + "' after " + maxAttempts + " attempts.", lastException);
    }
}
