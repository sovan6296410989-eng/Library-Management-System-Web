FROM eclipse-temurin:21-jdk

WORKDIR /app

# Install Node.js 20 & npm
RUN apt-get update && \
    apt-get install -y ca-certificates curl gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN javac -cp "./lib/mysql-connector-j-26.7.0.jar" ./Server.java ./dbconnection.java

ENV PORT=3000
ENV BACKEND_PORT=8080
ENV BACKEND_URL=http://localhost:8080

EXPOSE 3000 8080

CMD ["bash", "-c", "java -cp '.:./lib/mysql-connector-j-26.7.0.jar' Server & node server.js"]

