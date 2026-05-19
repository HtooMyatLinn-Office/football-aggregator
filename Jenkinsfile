pipeline {
    agent any

    parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['development', 'production'],
            description: 'Choose deployment environment'
        )
    }

    environment {
        PORT = '3000'
        CI = 'true'
    }

    stages {

        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        stage('Load Environment Config') {
            steps {
                script {

                    if (params.ENVIRONMENT == 'production') {

                        echo 'Using PRODUCTION environment'

                        bat '''
                            @echo off
                            copy /Y .env.production .env
                        '''

                    } else {

                        echo 'Using DEVELOPMENT environment'

                        bat '''
                            @echo off
                            copy /Y .env.development .env
                        '''
                    }
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                bat '''
                    @echo off
                    call npm ci
                    if errorlevel 1 exit /b 1
                '''
            }
        }

        stage('Generate Prisma Client') {
            steps {
                bat '''
                    @echo off
                    call npm run db:generate
                    if errorlevel 1 exit /b 1
                '''
            }
        }

        stage('Build Project') {
            steps {
                bat '''
                    @echo off
                    call npm run build
                    if errorlevel 1 exit /b 1
                '''
            }
        }

        stage('Deploy Development') {

            when {
                expression {
                    params.ENVIRONMENT == 'development'
                }
            }

            steps {

                echo 'Deploying DEVELOPMENT server'

                bat '''
                    @echo off

                    call npx pm2 restart football-api-dev

                    if errorlevel 1 (
                        call npx pm2 start dist/index.js --name football-api-dev
                    )

                    call npx pm2 save
                    call npx pm2 status
                '''
            }
        }

        stage('Deploy Production') {

            when {
                expression {
                    params.ENVIRONMENT == 'production'
                }
            }

            steps {

                echo 'Deploying PRODUCTION server'

                bat '''
                    @echo off

                    call npx pm2 restart football-api-prod

                    if errorlevel 1 (
                        call npx pm2 start dist/index.js --name football-api-prod
                    )

                    call npx pm2 save
                    call npx pm2 status
                '''
            }
        }

    }

    post {

        success {
            echo 'Pipeline completed successfully'
        }

        failure {
            echo 'Pipeline failed'
        }

        always {

            bat '''
                @echo off

                echo =========================
                echo PM2 STATUS
                echo =========================

                call npx pm2 status
            '''
        }
    }
}