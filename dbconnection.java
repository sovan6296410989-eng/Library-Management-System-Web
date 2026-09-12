import java.net.URI;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

public class dbconnection {
    private static final Logger LOGGER = Logger.getLogger(dbconnection.class.getName());

    private static String dbUrl;
    private static String dbUser;
    private static String dbPassword;

    static {
        initializeConfig();
    }

    private static void initializeConfig() {
        // Support standard environment variables across Docker, Railway, Render, etc.
        String rawUrl = envFirst("LIBRARY_DB_URL", "DATABASE_URL", "MYSQL_URL", "MYSQLURL");
        dbUser = envOrDefault("LIBRARY_DB_USER", "root");
        dbPassword = envOrDefault("LIBRARY_DB_PASSWORD", "721127");

        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            dbUrl = "jdbc:mysql://localhost:3306/library_db";
            return;
        }

        rawUrl = rawUrl.trim();
        // Handle cloud URLs formatted as mysql://user:password@host:port/database
        if (rawUrl.startsWith("mysql://")) {
            try {
                URI uri = URI.create(rawUrl);
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 3306;
                String path = uri.getPath() != null ? uri.getPath() : "/library_db";
                if (path.startsWith("/")) {
                    path = path.substring(1);
                }

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

                String query = uri.getQuery() != null ? "?" + uri.getQuery() : "";
                dbUrl = "jdbc:mysql://" + host + ":" + port + "/" + path + query;
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

    public static Connection getConnection() throws Exception {
        return getConnection(3, 1500);
    }

    public static Connection getConnection(int maxAttempts, long waitMs) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");

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

