FROM eclipse-temurin:21-jdk

WORKDIR /app

# Download the MySQL JDBC driver directly during build (no reliance on a committed jar)
RUN mkdir -p lib && \
    curl -fsSL -o lib/mysql-connector-j-26.7.0.jar \
    https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/26.7.0/mysql-connector-j-26.7.0.jar

COPY . .
RUN javac -cp "./lib/mysql-connector-j-26.7.0.jar" ./Server.java ./dbconnection.java

EXPOSE 8080

CMD ["java", "-cp", ".:/app/lib/mysql-connector-j-26.7.0.jar", "Server"]
