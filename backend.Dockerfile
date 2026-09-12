FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY . .
RUN javac -cp "./lib/mysql-connector-j-26.7.0.jar" ./Server.java ./dbconnection.java

EXPOSE 8080

CMD ["java", "-cp", ".:/app/lib/mysql-connector-j-26.7.0.jar", "Server"]
