pipeline {
    agent any

    environment {
        NODE_ENV = 'test'
        DATABASE_URL = 'postgresql://ci:ci@127.0.0.1:5432/ci'
    }

    stages {

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Generate Prisma Client') {
            steps {
                bat 'npm run db:generate'
            }
        }

        stage('Build Project') {
            steps {
                bat 'npm run build'
            }
        }

        stage('Start Server') {
            steps {
                bat 'pm2 restart football-api || pm2 start dist/index.js --name football-api'
            }
        }

    }
}