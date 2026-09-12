FROM eclipse-temurin:21-jdk

WORKDIR /app

# Copy all project files
COPY . .

# Ensure MySQL connector driver is present and compile the Java application
RUN mkdir -p lib && \
    if [ ! -f lib/mysql-connector-j-26.7.0.jar ]; then \
        curl -fsSL -o lib/mysql-connector-j-26.7.0.jar https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/26.7.0/mysql-connector-j-26.7.0.jar; \
    fi && \
    javac -cp ".:./lib/mysql-connector-j-26.7.0.jar" Server.java dbconnection.java

ENV PORT=8080
EXPOSE 8080

CMD ["java", "-cp", ".:./lib/mysql-connector-j-26.7.0.jar", "Server"]
