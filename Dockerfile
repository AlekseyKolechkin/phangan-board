## Сборка фронтенда
#FROM node:20 AS frontend-build
#WORKDIR /app/frontend
#COPY frontend/package*.json ./
#RUN npm install
#COPY frontend/ .
#RUN npm run build
#
## Сборка backend
#FROM eclipse-temurin:17-jre AS backend-build
#WORKDIR /app
#COPY backend/target/*.jar app.jar
#COPY --from=frontend-build /app/frontend/dist ./static
#
## Запуск
#EXPOSE 8080
#ENTRYPOINT ["java", "-jar", "app.jar"]